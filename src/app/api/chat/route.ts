import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import { OramaManager } from "@/server/orama";
import { buildEmailRagContext } from "@/lib/rag-context";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { authoriseAccountAccess } from "@/server/api/routers/account";
import { BillingLimitError, releaseChatCredit, reserveChatCredit } from "@/lib/billing";
import { rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schemas/chat";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    let userId: string | null = null;
    let creditReserved = false;

    try {
        const authResult = await auth();
        userId = authResult.userId;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const rateLimitResult = rateLimit(`chat:${userId}`, {
            windowMs: 60_000,
            maxRequests: 20,
        });
        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: "Too many requests" },
                {
                    status: 429,
                    headers: {
                        "Retry-After": String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
                    },
                },
            );
        }

        let rawBody: unknown;
        try {
            rawBody = await req.json();
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const parsed = chatRequestSchema.safeParse(rawBody);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid request", details: parsed.error.flatten() },
                { status: 400 },
            );
        }

        const { messages, accountId } = parsed.data;

        try {
            await reserveChatCredit(userId);
            creditReserved = true;
        } catch (error) {
            if (error instanceof BillingLimitError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        await authoriseAccountAccess(accountId, userId, db);

        const lastMessage = messages[messages.length - 1]!;

        const oramaManager = new OramaManager(accountId);
        await oramaManager.initialize();

        const context = await oramaManager.vectorSearch({ prompt: lastMessage.content });
        const hits = context.hits ?? [];

        const emailContextStrings = buildEmailRagContext(hits);

        const systemPrompt = {
            role: "system" as const,
            content: `You are an AI email assistant embedded in an email client app. Your purpose is to help the user by answering questions based on the context of their previous emails.
            THE TIME NOW IS ${new Date().toLocaleString()}
      
            START CONTEXT BLOCK
            ${emailContextStrings}
            END OF CONTEXT BLOCK
      
            When responding, please keep in mind:
            - Be helpful, clever, and articulate.
            - Rely strictly on the provided email context to inform your responses.
            - If the context does not contain enough information, politely say you don't have enough information.
            - Do not invent or speculate about anything that is not directly supported by the email context.
            - Keep your responses concise and markdown-formatted.`
        };

        const userMessages = messages
            .filter((message) => message.role === "user" || !message.role)
            .map((message) => ({
                role: "user" as const,
                content: message.content,
            }));

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                systemPrompt,
                ...userMessages,
            ],
            stream: true,
        });

        const stream = OpenAIStream(response as Parameters<typeof OpenAIStream>[0]);

        return new StreamingTextResponse(stream);

    } catch (error) {
        if (creditReserved && userId) {
            await releaseChatCredit(userId);
        }
        console.error("Error in AI Chat Route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
