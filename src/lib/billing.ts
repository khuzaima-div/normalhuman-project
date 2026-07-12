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

/**
 * Atomically reserve one chat/AI credit before starting a paid API call.
 * Prevents concurrent requests from exceeding the daily free limit.
 */
export async function reserveChatCredit(userId: string): Promise<void> {
  if (await isProUser(userId)) {
    return;
  }

  const day = getTodayStr();

  await db.$transaction(async (tx) => {
    const record = await tx.chatbotInteraction.findUnique({
      where: {
        userId_day: {
          userId,
          day,
        },
      },
    });

    const usage = record?.count ?? 0;
    if (usage >= FREE_CREDITS_PER_DAY) {
      throw new BillingLimitError("Limit reached");
    }

    await tx.chatbotInteraction.upsert({
      where: {
        userId_day: {
          userId,
          day,
        },
      },
      create: {
        userId,
        day,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });
  });
}

/**
 * Release a reserved credit when an AI request fails before delivering value.
 */
export async function releaseChatCredit(userId: string): Promise<void> {
  if (await isProUser(userId)) {
    return;
  }

  const day = getTodayStr();

  try {
    await db.chatbotInteraction.updateMany({
      where: {
        userId,
        day,
        count: {
          gt: 0,
        },
      },
      data: {
        count: {
          decrement: 1,
        },
      },
    });
  } catch (error) {
    console.error("Failed to release chat credit:", error);
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
