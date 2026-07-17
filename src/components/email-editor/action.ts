'use server';

import { auth } from '@clerk/nextjs/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';
import { BillingLimitError, releaseChatCredit, reserveChatCredit } from '@/lib/billing';
import { rateLimit } from '@/lib/rate-limit';

const MAX_CONTEXT_LENGTH = 50_000;
const MAX_PROMPT_LENGTH = 2_000;
const MAX_CURRENT_TEXT_LENGTH = 10_000;
const MAX_SUBJECT_LENGTH = 500;
const MAX_RECIPIENT_LENGTH = 320;
const COMPOSE_MODEL = 'gpt-4o-mini' as const;

async function assertAiComposeAllowed(): Promise<string> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('Unauthorized');
    }

    const rateLimitResult = rateLimit(`ai-compose:${userId}`, {
        windowMs: 60_000,
        maxRequests: 30,
    });
    if (!rateLimitResult.success) {
        throw new Error('Too many requests');
    }

    await reserveChatCredit(userId);
    return userId;
}

// 1. FULL EMAIL RE-WRITE ENGINE (Using system blocks + Markdown context parsing)
export async function generateEmail(context: string, prompt: string) {
    let userId: string;
    try {
        userId = await assertAiComposeAllowed();
    } catch (error) {
        if (error instanceof BillingLimitError) {
            throw new Error('Limit reached');
        }
        throw error;
    }

    if (context.length > MAX_CONTEXT_LENGTH || prompt.length > MAX_PROMPT_LENGTH) {
        await releaseChatCredit(userId);
        throw new Error('Input too large');
    }

    const stream = createStreamableValue('');

    void (async () => {
        try {
            const { textStream } = await streamText({
                model: openai(COMPOSE_MODEL) as Parameters<typeof streamText>[0]['model'],
                prompt: `
You are an AI email assistant embedded in an email client app. Your purpose is to help the user compose or reply to emails perfectly.

THE TIME NOW IS ${new Date().toLocaleString()}

START CONTEXT BLOCK
${context}
END OF CONTEXT BLOCK

USER PROMPT:
${prompt}

When responding, follow these rules strictly:
1. Directly output the email body. Do NOT include any intro or outro text like "Here is your email", "Sure, I can help with that", or asking for clarification.
2. If the user makes a minor typo (like "replay" instead of "reply"), understand their true intent and generate the email anyway.
3. If the CONTEXT BLOCK above is empty or doesn't have enough info, use your general knowledge to write a professional, high-quality draft based entirely on the USER PROMPT.
4. Do not output the Subject line, just the email body content.
5. Format the output beautifully using clean HTML paragraphs (<p>...</p>) and bold tags (<strong>...</strong>) where appropriate to ensure excellent line spacing and readability. Do NOT wrap your entire response inside markdown code blocks (like \`\`\`html).
`,
            });

            for await (const delta of textStream) {
                stream.update(delta);
            }

            stream.done();
        } catch (error) {
            await releaseChatCredit(userId);
            console.error('generateEmail failed:', error);
            // Next.js RSC can only serialize plain values, so send the message string.
            stream.error(
                error instanceof Error ? error.message : 'AI generation failed',
            );
        }
    })();

    return { output: stream.value };
}

// 2. INLINE AUTOCOMPLETE ENGINE (Ctrl + J)
export async function generate(currentText: string, subject: string, recipient: string) {
    let userId: string;
    try {
        userId = await assertAiComposeAllowed();
    } catch (error) {
        if (error instanceof BillingLimitError) {
            throw new Error('Limit reached');
        }
        throw error;
    }

    if (
        currentText.length > MAX_CURRENT_TEXT_LENGTH ||
        subject.length > MAX_SUBJECT_LENGTH ||
        recipient.length > MAX_RECIPIENT_LENGTH
    ) {
        await releaseChatCredit(userId);
        throw new Error('Input too large');
    }

    const stream = createStreamableValue('');

    void (async () => {
        try {
            const { textStream } = await streamText({
                model: openai(COMPOSE_MODEL) as Parameters<typeof streamText>[0]['model'],
                prompt: `
You are an AI email assistant that helps users write, continue, and improve email content.

SUBJECT: ${subject}
RECIPIENT: ${recipient}

CURRENT DRAFT:
${currentText}

Continue the email naturally, preserving the existing draft style and tone. Do not include any explanations, labels, or formatting instructions in the output.
`,
            });

            for await (const delta of textStream) {
                stream.update(delta);
            }

            stream.done();
        } catch (error) {
            await releaseChatCredit(userId);
            console.error('generate failed:', error);
            // Next.js RSC can only serialize plain values, so send the message string.
            stream.error(
                error instanceof Error ? error.message : 'AI autocomplete failed',
            );
        }
    })();

    return { output: stream.value };
}
