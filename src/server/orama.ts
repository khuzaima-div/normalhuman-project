import { count, create, getByID, search, upsert, type AnyOrama } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import { db } from "@/server/db";
import { getEmbeddings } from "@/lib/embeddings";

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

// Vector indexes store 1536-dim embeddings as JSON; keep headroom for portfolio-sized indexes.
const MAX_BINARY_INDEX_CHARS = 50_000_000;
const VECTOR_SIMILARITY = 0.55;

export class OramaManager {
    // @ts-expect-error Orama instance typed loosely across restore/create
    private orama: AnyOrama;
    private accountId: string;

    constructor(accountId: string) {
        this.accountId = accountId;
    }

    private async createIndex() {
        return await create({
            schema: {
                id: "string",
                title: "string",
                body: "string",
                rawBody: "string",
                from: "string",
                to: "string[]",
                sentAt: "string",
                embeddings: "vector[1536]",
                threadId: "string",
            },
        });
    }

    async createFreshIndex() {
        this.orama = await this.createIndex();
    }

    async initialize() {
        const account = await db.account.findUnique({
            where: { id: this.accountId },
            select: { binaryIndex: true },
        });

        if (!account) throw new Error("Account not found");

        if (
            account.binaryIndex &&
            account.binaryIndex.length <= MAX_BINARY_INDEX_CHARS
        ) {
            try {
                // After restore, Orama exposes a placeholder schema — do not inspect it
                // to decide whether embeddings exist (that false-negative wiped valid indexes).
                this.orama = await restore("json", account.binaryIndex);
                return;
            } catch (error) {
                console.warn("Failed to restore Orama index, creating fresh:", error);
            }
        } else if (account.binaryIndex) {
            console.warn(
                `Orama index exceeds ${MAX_BINARY_INDEX_CHARS} chars, creating fresh vector index`,
            );
        }

        this.orama = await this.createIndex();
    }

    async documentCount(): Promise<number> {
        return await count(this.orama);
    }

    async hasDocument(id: string): Promise<boolean> {
        try {
            const doc = await getByID(this.orama, id);
            return doc != null;
        } catch {
            return false;
        }
    }

    async upsertDocument(
        document: OramaEmailDocument,
        options: { persist?: boolean } = {},
    ) {
        await upsert(this.orama, document);

        if (options.persist !== false) {
            await this.saveIndex();
        }
    }

    async vectorSearch({ prompt, numResults = 10 }: { prompt: string; numResults?: number }) {
        try {
            const embeddings = await getEmbeddings(prompt);
            return await search(this.orama, {
                mode: "hybrid",
                term: prompt,
                vector: {
                    value: embeddings,
                    property: "embeddings",
                },
                similarity: VECTOR_SIMILARITY,
                limit: numResults,
            });
        } catch (error) {
            // Legacy text-only indexes (or transient vector errors) fall back to full-text.
            console.warn(
                "Hybrid vector search failed, falling back to full-text search:",
                error,
            );
            return await search(this.orama, {
                term: prompt,
                limit: numResults,
            });
        }
    }

    async search({ term }: { term: string }) {
        return await search(this.orama, {
            term: term,
        });
    }

    async saveIndex() {
        const index = await persist(this.orama, "json");
        await db.account.update({
            where: { id: this.accountId },
            data: {
                binaryIndex: index as string,
            },
        });
    }
}
