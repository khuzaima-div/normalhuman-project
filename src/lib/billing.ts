import {
  FREE_ACCOUNTS_PER_USER,
  FREE_CREDITS_PER_DAY,
  PRO_ACCOUNTS_PER_USER,
} from "@/constants";
import { db } from "@/server/db";

export class BillingLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingLimitError";
  }
}

function getTodayStr(): string {
  return new Date().toDateString();
}

export async function isProUser(userId: string): Promise<boolean> {
  const subscription = await db.stripeSubscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return false;
  }

  return subscription.currentPeriodEnd > new Date();
}

export async function getDailyChatUsage(userId: string): Promise<number> {
  const record = await db.chatbotInteraction.findUnique({
    where: {
      userId_day: {
        userId,
        day: getTodayStr(),
      },
    },
  });

  return record?.count ?? 0;
}

export async function assertChatAllowed(userId: string): Promise<void> {
  if (await isProUser(userId)) {
    return;
  }

  const usage = await getDailyChatUsage(userId);
  if (usage >= FREE_CREDITS_PER_DAY) {
    throw new BillingLimitError("Limit reached");
  }
}

export async function getAccountLimit(userId: string): Promise<number> {
  return (await isProUser(userId))
    ? PRO_ACCOUNTS_PER_USER
    : FREE_ACCOUNTS_PER_USER;
}

export async function getAccountCount(userId: string): Promise<number> {
  return db.account.count({
    where: { userId },
  });
}

export async function assertAccountAllowed(userId: string): Promise<void> {
  const [count, limit] = await Promise.all([
    getAccountCount(userId),
    getAccountLimit(userId),
  ]);

  if (count >= limit) {
    throw new BillingLimitError("Account limit reached");
  }
}
