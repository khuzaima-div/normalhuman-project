import { create, insert, search, type AnyOrama } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import { db } from "@/server/db";
import { getEmbeddings } from "../lib/embeddings";

// Frontend k mutabiq types ko manage krne k liye strict interface
interface OramaEmailDocument {
    title: string;
    body: string;
    rawBody: string;
    from: string;
    to: string[];
    sentAt: string;
    embeddings: number[];
    threadId: string;
}

export class OramaManager {
    // @ts-ignore
    private orama: AnyOrama;
    private accountId: string;

    constructor(accountId: string) {
        this.accountId = accountId;
    }

    async initialize() {
        const account = await db.account.findUnique({
            where: { id: this.accountId },
            select: { binaryIndex: true }
        });

        if (!account) throw new Error('Account not found');

        if (account.binaryIndex) {
            // Database se string readable format mein restore karna
            this.orama = await restore('json', account.binaryIndex);
        } else {
            this.orama = await create({
                schema: {
                    title: "string",
                    body: "string",
                    rawBody: "string",
                    from: 'string',
                    to: 'string[]',
                    sentAt: 'string',
                    embeddings: 'vector[1536]',
                    threadId: 'string'
                },
            });
            await this.saveIndex();
        }
    }

    async insert(document: OramaEmailDocument) {
        await insert(this.orama, document);
        await this.saveIndex();
    }

    async vectorSearch({ prompt, numResults = 10 }: { prompt: string, numResults?: number }) {
        const embeddings = await getEmbeddings(prompt);
        const results = await search(this.orama, {
            mode: 'hybrid',
            term: prompt,
            vector: {
                value: embeddings,
                property: 'embeddings'
            },
            similarity: 0.80,
            limit: numResults,
        });
        return results;
    }

    async search({ term }: { term: string }) {
        return await search(this.orama, {
            term: term,
        });
    }

    async saveIndex() {
        const index = await persist(this.orama, 'json');
        await db.account.update({
            where: { id: this.accountId },
            data: { 
                binaryIndex: index as string // Buffer crash fixed here
            }
        });
    }
}