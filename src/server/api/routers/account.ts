import { z } from "zod"
import { createTRPCRouter, privateProcedure } from "../trpc"
import type { AppPrismaClient } from "@/server/db"
import { TRPCError } from "@trpc/server"
import { recoverStaleSyncStatus } from "@/lib/run-initial-sync"
import { isPortfolioMode, PORTFOLIO_EMAIL_LIMIT } from "@/lib/portfolio-mode"
import { getPortfolioScope } from "@/lib/portfolio-queries"

const publicAccountSelect = {
    id: true,
    emailAddress: true,
    name: true,
} as const

export type PublicAccount = {
    id: string
    emailAddress: string
    name: string | null
}

/**
 * Validates ownership and returns safe account metadata only (no credentials).
 */
export const authoriseAccountAccess = async (
    accountId: string,
    userId: string,
    db: AppPrismaClient
): Promise<PublicAccount> => {
    const account = await db.account.findFirst({
        where: {
            id: accountId,
            userId: userId,
        },
        select: publicAccountSelect,
    })
    if (!account) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" })
    }
    return account
}

/**
 * Server-only: fetch Aurinko access token after ownership validation.
 */
export const getAccountAccessToken = async (
    accountId: string,
    userId: string,
    db: AppPrismaClient
): Promise<string> => {
    await authoriseAccountAccess(accountId, userId, db)

    const tokenRow = await db.account.findFirst({
        where: { id: accountId, userId },
        select: { accessToken: true },
    })

    if (!tokenRow?.accessToken) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" })
    }

    return tokenRow.accessToken
}

export const accountRouter = createTRPCRouter({
    getAccounts: privateProcedure.query(async ({ ctx }) => {
        await recoverStaleSyncStatus()

        return await ctx.db.account.findMany({
            where: { userId: ctx.auth.userId },
            orderBy: { id: 'desc' },
            select: { id: true, emailAddress: true, name: true, syncStatus: true, lastSyncedAt: true }
        })
    }),

    getNumThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            tab: z.string().nullish().default("inbox"),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            const filter: Record<string, boolean> = {}
            const currentTab = input.tab ?? 'inbox'

            if (currentTab === 'inbox') {
                filter.inboxStatus = true
                filter.done = false
            } else if (currentTab === 'draft') {
                filter.draftStatus = true
            } else if (currentTab === 'sent') {
                filter.sentStatus = true
            } else if (currentTab === 'done') {
                filter.done = true
            }

            const portfolio = await getPortfolioScope(account.id, ctx.db)
            if (portfolio && portfolio.threadIds.length === 0) {
                return 0
            }

            return await ctx.db.thread.count({
                where: {
                    accountId: account.id,
                    ...filter,
                    ...(portfolio ? { id: { in: portfolio.threadIds } } : {}),
                }
            })
        }),

    getThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            view: z.enum(["inbox", "draft", "sent"]).nullish().default("inbox"),
            done: z.boolean().nullish().default(false),
            /** @deprecated use view */
            tab: z.string().nullish(),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            const safeView = (input.view ?? input.tab ?? "inbox") as "inbox" | "draft" | "sent"
            const safeDone = input.done ?? false

            const filter: Record<string, boolean> = {}

            if (safeView === 'inbox') {
                filter.inboxStatus = true
            } else if (safeView === 'draft') {
                filter.draftStatus = true
            } else if (safeView === 'sent') {
                filter.sentStatus = true
            }

            filter.done = safeDone

            const portfolio = await getPortfolioScope(account.id, ctx.db)
            if (portfolio && portfolio.threadIds.length === 0) {
                return []
            }

            return await ctx.db.thread.findMany({
                where: {
                    accountId: account.id,
                    ...filter,
                    ...(portfolio ? { id: { in: portfolio.threadIds } } : {}),
                },
                include: {
                    emails: {
                        ...(portfolio ? { where: { id: { in: portfolio.emailIds } } } : {}),
                        orderBy: {
                            sentAt: 'asc'
                        },
                        select: {
                            from: true,
                            bodySnippet: true,
                            emailLabel: true,
                            subject: true,
                            sysLabels: true,
                            id: true,
                            sentAt: true,
                            hasAttachments: true,
                        }
                    }
                },
                take: isPortfolioMode() ? PORTFOLIO_EMAIL_LIMIT : 15,
                orderBy: {
                    lastMessageDate: 'desc'
                }
            })
        }),

    /** Full thread with bodies + attachments for the reading pane */
    getThread: privateProcedure
        .input(z.object({
            accountId: z.string(),
            threadId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            const portfolio = await getPortfolioScope(account.id, ctx.db)

            const thread = await ctx.db.thread.findFirst({
                where: {
                    id: input.threadId,
                    accountId: account.id,
                    ...(portfolio ? { id: { in: portfolio.threadIds } } : {}),
                },
                include: {
                    emails: {
                        ...(portfolio ? { where: { id: { in: portfolio.emailIds } } } : {}),
                        orderBy: { sentAt: 'asc' },
                        select: {
                            id: true,
                            from: true,
                            body: true,
                            bodySnippet: true,
                            emailLabel: true,
                            subject: true,
                            sysLabels: true,
                            sentAt: true,
                            hasAttachments: true,
                            attachments: {
                                select: {
                                    id: true,
                                    name: true,
                                    mimeType: true,
                                    size: true,
                                    inline: true,
                                }
                            }
                        }
                    }
                }
            })

            if (!thread || thread.emails.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" })
            }

            return thread
        }),

    setThreadDone: privateProcedure
        .input(z.object({
            accountId: z.string(),
            threadId: z.string(),
            done: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            const thread = await ctx.db.thread.findFirst({
                where: {
                    id: input.threadId,
                    accountId: account.id,
                },
                select: { id: true },
            })

            if (!thread) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" })
            }

            return await ctx.db.thread.update({
                where: { id: thread.id },
                data: { done: input.done },
                select: { id: true, done: true },
            })
        }),

    getSuggestions: privateProcedure
        .input(z.object({
            accountId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            return await ctx.db.emailAddress.findMany({
                where: {
                    accountId: account.id
                },
                select: {
                    address: true,
                    name: true
                }
            })
        }),

    getReplyDetails: privateProcedure
        .input(z.object({
            accountId: z.string(),
            threadId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            const portfolio = await getPortfolioScope(account.id, ctx.db)

            const thread = await ctx.db.thread.findFirst({
                where: {
                    id: input.threadId,
                    accountId: account.id,
                    ...(portfolio ? { id: { in: portfolio.threadIds } } : {}),
                },
                include: {
                    emails: {
                        ...(portfolio ? { where: { id: { in: portfolio.emailIds } } } : {}),
                        orderBy: { sentAt: 'asc' },
                        select: {
                            id: true,
                            from: true,
                            to: true,
                            cc: true,
                            bcc: true,
                            sentAt: true,
                            subject: true,
                            internetMessageId: true,
                        }
                    }
                }
            })

            if (!thread || thread.emails.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" })
            }

            const fallbackEmail = thread.emails[thread.emails.length - 1]!
            const lastExternalEmail = [...thread.emails].reverse().find(
                email => email.from.address !== account.emailAddress
            ) ?? fallbackEmail

            return {
                subject: lastExternalEmail.subject,
                to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(to => to.address !== account.emailAddress)],
                cc: lastExternalEmail.cc.filter(cc => cc.address !== account.emailAddress),
                from: { name: account.name, address: account.emailAddress },
                id: lastExternalEmail.internetMessageId,
            }
        }),
})
