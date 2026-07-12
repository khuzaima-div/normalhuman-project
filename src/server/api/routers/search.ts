import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, privateProcedure } from "@/server/api/trpc";
import { OramaManager } from "@/server/orama";
import { authoriseAccountAccess } from "@/server/api/routers/account";

export const searchRouter = createTRPCRouter({
  search: privateProcedure
    .input(
      z.object({
        accountId: z.string(),
        query: z.string().max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.accountId || !input.query.trim()) {
        return { hits: [] };
      }

      await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db);

      try {
        const oramaManager = new OramaManager(input.accountId);
        await oramaManager.initialize();
        const results = await oramaManager.search({ term: input.query });

        return results ?? { hits: [] };
      } catch (error) {
        console.error("Search mutation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Search failed. Try again after sync completes.",
        });
      }
    }),
});
