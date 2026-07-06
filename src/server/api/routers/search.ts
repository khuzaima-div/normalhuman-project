import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { OramaManager } from "@/server/orama";

export const searchRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z.object({
        accountId: z.string(),
        query: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        if (!input.accountId || !input.query.trim()) {
          return { hits: [] };
        }

        const oramaManager = new OramaManager(input.accountId);
        await oramaManager.initialize();
        const results = await oramaManager.search({ term: input.query });

        return results ?? { hits: [] };
      } catch (error) {
        console.error("Search mutation failed:", error);
        return { hits: [] };
      }
    }),
});
