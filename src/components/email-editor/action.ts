'use server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createStreamableValue } from 'ai/rsc';

// 1. FULL EMAIL RE-WRITE ENGINE (Using system blocks + Markdown context parsing)
export async function generateEmail(context: string, prompt: string) {
    const stream = createStreamableValue('');

    (async () => {
        const { textStream } = await streamText({
            model: openai('gpt-4-turbo') as Parameters<typeof streamText>[0]['model'],
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
    })();

    return { output: stream.value };
}

// 2. INLINE AUTOCOMPLETE ENGINE (Ctrl + J)
export async function generate(currentText: string, subject: string, recipient: string) {
    const stream = createStreamableValue('');

    (async () => {
        const { textStream } = await streamText({
            model: openai('gpt-4-turbo') as Parameters<typeof streamText>[0]['model'],
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
    })();

    return { output: stream.value };
}