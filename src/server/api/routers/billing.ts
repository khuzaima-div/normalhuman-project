import { FREE_CREDITS_PER_DAY } from "@/constants";
import { env } from "@/env";
import {
  getAccountCount,
  getAccountLimit,
  getDailyChatUsage,
  isProUser,
} from "@/lib/billing";
import { createTRPCRouter, privateProcedure } from "../trpc";

export const billingRouter = createTRPCRouter({
  getBillingSummary: privateProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    const [isPro, messagesUsedToday, accountsUsed, accountLimit, subscription] =
      await Promise.all([
        isProUser(userId),
        getDailyChatUsage(userId),
        getAccountCount(userId),
        getAccountLimit(userId),
        ctx.db.stripeSubscription.findUnique({
          where: { userId },
          select: { currentPeriodEnd: true },
        }),
      ]);

    const messagesRemaining = isPro
      ? null
      : Math.max(0, FREE_CREDITS_PER_DAY - messagesUsedToday);

    return {
      isPro,
      messagesUsedToday,
      messagesLimit: isPro ? null : FREE_CREDITS_PER_DAY,
      messagesRemaining,
      accountsUsed,
      accountLimit,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      billingAvailable: !!(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID),
    };
  }),
});
