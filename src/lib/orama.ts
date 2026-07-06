import { db } from "@/server/db";
import { getEmbeddings } from "@/lib/embeddings";

export interface SearchResult {
  hits: Array<{
    document: any;
    score?: number;
  }>;
}

export class OramaManager {
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }

  async initialize(): Promise<void> {
    // Initialize Orama index if needed
    // This can be used to set up any necessary data structures
  }

  async vectorSearch({ prompt }: { prompt: string }): Promise<SearchResult> {
    try {
      // Get embeddings for the search prompt
      const promptEmbeddings = await getEmbeddings(prompt);

      // Query emails from database for this account
      const emails = await db.email.findMany({
        where: {
          account: {
            id: this.accountId,
          },
        },
        select: {
          id: true,
          from: true,
          to: true,
          cc: true,
          subject: true,
          body: true,
          bodyPlain: true,
          createdTime: true,
          threadId: true,
        },
      });

      if (emails.length === 0) {
        return { hits: [] };
      }

      // For now, return all emails as hits
      // In production, you'd perform actual vector similarity search
      const hits = emails.map((email) => ({
        document: email,
        score: 1,
      }));

      return { hits };
    } catch (error) {
      console.error("Error in vectorSearch:", error);
      return { hits: [] };
    }
  }
}
