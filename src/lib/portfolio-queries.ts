import type { AppPrismaClient } from "@/server/db";
import { isPortfolioMode, PORTFOLIO_EMAIL_LIMIT } from "./portfolio-mode";

export type PortfolioScope = {
    emailIds: string[];
    threadIds: string[];
};

export async function getPortfolioScope(
    accountId: string,
    db: AppPrismaClient,
): Promise<PortfolioScope | null> {
    if (!isPortfolioMode()) return null;

    const emails = await db.email.findMany({
        where: { accountId },
        orderBy: { sentAt: "desc" },
        take: PORTFOLIO_EMAIL_LIMIT,
        select: { id: true, threadId: true },
    });

    return {
        emailIds: emails.map((email) => email.id),
        threadIds: [...new Set(emails.map((email) => email.threadId))],
    };
}

export async function getPortfolioEmailCount(
    accountId: string,
    db: AppPrismaClient,
): Promise<number> {
    const scope = await getPortfolioScope(accountId, db);
    if (scope) return scope.emailIds.length;

    return await db.email.count({ where: { accountId } });
}

export type PortfolioStartupStats = {
    PORTFOLIO_MODE: boolean;
    emailsInDb: number;
    portfolioEmails: number;
    portfolioThreads: number;
    getNumThreads: number;
    "getThreads().length": number;
};

export async function getPortfolioStartupStats(
    accountId: string,
    db: AppPrismaClient,
): Promise<PortfolioStartupStats> {
    const portfolio = await getPortfolioScope(accountId, db);
    const emailsInDb = await db.email.count({ where: { accountId } });

    const inboxFilter = {
        accountId,
        inboxStatus: true,
        done: false,
        ...(portfolio ? { id: { in: portfolio.threadIds } } : {}),
    } as const;

    const getNumThreads =
        portfolio && portfolio.threadIds.length === 0
            ? 0
            : await db.thread.count({ where: inboxFilter });

    const threads =
        portfolio && portfolio.threadIds.length === 0
            ? []
            : await db.thread.findMany({
                  where: inboxFilter,
                  take: isPortfolioMode() ? PORTFOLIO_EMAIL_LIMIT : 15,
                  orderBy: { lastMessageDate: "desc" },
                  select: { id: true },
              });

    return {
        PORTFOLIO_MODE: isPortfolioMode(),
        emailsInDb,
        portfolioEmails: portfolio?.emailIds.length ?? emailsInDb,
        portfolioThreads: portfolio?.threadIds.length ?? threads.length,
        getNumThreads,
        "getThreads().length": threads.length,
    };
}

let startupStatsLogged = false;

export async function logPortfolioStartupStats(
    accountId: string,
    db: AppPrismaClient,
) {
    if (startupStatsLogged) return;
    startupStatsLogged = true;

    const stats = await getPortfolioStartupStats(accountId, db);
    console.log("[portfolio startup stats]");
    console.log(`PORTFOLIO_MODE=${stats.PORTFOLIO_MODE}`);
    console.log(`emailsInDb=${stats.emailsInDb}`);
    console.log(`portfolioEmails=${stats.portfolioEmails}`);
    console.log(`portfolioThreads=${stats.portfolioThreads}`);
    console.log(`getNumThreads()=${stats.getNumThreads}`);
    console.log(`getThreads().length=${stats["getThreads().length"]}`);
}
