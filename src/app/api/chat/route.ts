import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";
import { OramaManager } from "@/lib/orama";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
// import { getSubscriptionStatus } from "@/lib/stripe-actions";
// import { FREE_CREDITS_PER_DAY } from "@/app/constants";

// Real OpenAI initialization
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        // 1. User Authentication Check
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 3. Extract Request Data
        const { messages, accountId } = await req.json();
        
        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: "No messages provided" }, { status: 400 });
        }

        const lastMessage = messages[messages.length - 1];

        // 4. Initialize Orama and Perform Real Vector Search
        const oramaManager = new OramaManager(accountId);
        await oramaManager.initialize();

        // Yeh background mein aapka naya getEmbeddings use karke real search karega
        const context = await oramaManager.vectorSearch({ prompt: lastMessage.content });
        console.log(`${context.hits.length} real email hits found for RAG`);

        // 5. Build the AI Prompt with Real Email Context
        const emailContextStrings = context.hits
            .map((hit: any) => JSON.stringify(hit.document))
            .join('\n');

        const systemPrompt = {
            role: "system",
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

        // 6. Call OpenAI Chat Completion with Streaming Enabled
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Optimized, fast, and cost-effective model
            messages: [
                systemPrompt,
                ...messages.filter((message: any) => message.role === "user"),
            ],
            stream: true,
        });

        // 7. Stream the Response back to the Vercel AI SDK frontend hook
        const stream = OpenAIStream(response as any, {
            onCompletion: async () => {
                // Usage limit increment on successful stream complete
                const todayStr = new Date().toDateString();
                // Note: Make sure chatbotInteraction model exists in your Prisma schema
                try {
                    await db.chatbotInteraction.updateMany({
                        where: {
                            userId,
                            day: todayStr
                        },
                        data: {
                            count: {
                                increment: 1
                            }
                        }
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