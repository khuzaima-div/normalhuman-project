import { accountRouter } from "@/server/api/routers/account"; // 🌟 Humne apna account router import kiya
import { mailRouter } from "@/server/api/routers/mail";
import { searchRouter } from "@/server/api/routers/search";
import { createTRPCRouter } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 * All routers added in /routers should be manually linked here.
 */
export const appRouter = createTRPCRouter({
  account: accountRouter, // 🌟 Is line se accountRouter poore project ke liye register ho gaya!
  mail: mailRouter,
  search: searchRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;