import { create, upsert, search, getByID, type AnyOrama } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import { db } from "@/server/db";
import { getEmbeddings } from "../lib/embeddings";

interface OramaEmailDocument {
    id: string;
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
    // @ts-expect-error Orama instance typed loosely across restore/create
    private orama: AnyOrama;
    private accountId: string;
    private seenIds = new Set<string>();

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
            this.orama = await restore('json', account.binaryIndex);
        } else {
            this.orama = await create({
                schema: {
                    id: "string",
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
        }
    }

    async insert(
        document: OramaEmailDocument,
        options: { persist?: boolean } = {},
    ) {
        if (this.seenIds.has(document.id)) {
            return;
        }
        this.seenIds.add(document.id);

        try {
            const existing = await getByID(this.orama, document.id);
            if (existing) {
                // Already indexed — skip to avoid duplicate hits
                if (options.persist !== false) {
                    // no-op persist
                }
                return;
            }
        } catch {
            // Legacy index without id lookup support
        }

        await upsert(this.orama, document);

        if (options.persist !== false) {
            await this.saveIndex();
        }
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
                binaryIndex: index as string
            }
        });
    }
}
