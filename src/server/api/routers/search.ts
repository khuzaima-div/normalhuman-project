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
        query: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.accountId || !input.query.trim()) {
        return { hits: [] };
      }

      try {
        await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db);
      } catch {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this account.",
        });
      }

      try {
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
