import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import { OramaManager } from "@/server/orama";
import { buildEmailRagContext } from "@/lib/rag-context";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { authoriseAccountAccess } from "@/server/api/routers/account";
import { assertChatAllowed, BillingLimitError } from "@/lib/billing";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { messages, accountId } = await req.json();
        
        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        if (!accountId) {
            return NextResponse.json({ error: "No account selected" }, { status: 400 });
        }

        try {
            await assertChatAllowed(userId);
        } catch (error) {
            if (error instanceof BillingLimitError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        await authoriseAccountAccess(accountId, userId, db);

        const lastMessage = messages[messages.length - 1];

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

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                systemPrompt,
                ...messages.filter((message: { role: string }) => message.role === "user"),
            ],
            stream: true,
        });

        const stream = OpenAIStream(response as Parameters<typeof OpenAIStream>[0], {
            onCompletion: async () => {
                const todayStr = new Date().toDateString();
                try {
                    await db.chatbotInteraction.upsert({
                        where: {
                            userId_day: {
                                userId,
                                day: todayStr,
                            },
                        },
                        create: {
                            userId,
                            day: todayStr,
                            count: 1,
                        },
                        update: {
                            count: {
                                increment: 1,
                            },
                        },
                    });
                } catch (error) {
                    console.error("Error updating chatbot interaction:", error);
                }
            },
        });

        return new StreamingTextResponse(stream);

    } catch (error) {
        console.error("Error in AI Chat Route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
