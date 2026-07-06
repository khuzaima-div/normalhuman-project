import { z } from "zod"
import { createTRPCRouter, privateProcedure } from "../trpc"
import { PrismaClient } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { OramaManager } from "@/server/orama"

/**
 * Type-safe access validator mapping Prisma client interface structures explicitly
 */
export const authoriseAccountAccess = async (
    accountId: string, 
    userId: string, 
    db: PrismaClient
) => {
    const account = await db.account.findFirst({
        where: {
            id: accountId,
            userId: userId,
        },
        select: {
            id: true,
            emailAddress: true,
            name: true,
            accessToken: true,
        }
    })
    if (!account) throw new Error('Account not found')
    return account
}

export const accountRouter = createTRPCRouter({
    // Get accounts router query
    getAccounts: privateProcedure.query(async ({ ctx }) => {
        return await ctx.db.account.findMany({
            where: { userId: ctx.auth.userId },
            orderBy: { id: 'desc' },
            select: { id: true, emailAddress: true, name: true }
        })
    }),

    // Get live threads count router query
    getNumThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            tab: z.string().nullish().default("inbox"),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            let filter: Record<string, any> = {}
            const currentTab = input.tab ?? 'inbox';

            if (currentTab === 'inbox') {
                filter.inboxStatus = true
            } else if (currentTab === 'draft') {
                filter.draftStatus = true
            } else if (currentTab === 'sent') {
                filter.sentStatus = true
            } else if (currentTab === 'done') {
                filter.doneStatus = true
            }

            return await ctx.db.thread.count({
                where: {
                    accountId: account.id,
                    ...filter
                }
            })
        }),

    // Dynamic threads fetching procedure
    getThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            tab: z.string().nullish().default("inbox"),
            done: z.boolean().nullish().default(false)
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            const safeTab = input.tab ?? "inbox";
            const safeDone = input.done ?? false;

            let filter: Record<string, any> = {}

            if (safeTab === 'inbox') {
                filter.inboxStatus = true
            } else if (safeTab === 'draft') {
                filter.draftStatus = true
            } else if (safeTab === 'sent') {
                filter.sentStatus = true
            }

            filter.done = safeDone

            return await ctx.db.thread.findMany({
                where: {
                    accountId: account.id,
                    ...filter
                },
                include: {
                    emails: {
                        orderBy: {
                            sentAt: 'asc'
                        },
                        select: {
                            from: true,
                            body: true,
                            bodySnippet: true,
                            emailLabel: true,
                            subject: true,
                            sysLabels: true,
                            id: true,
                            sentAt: true
                        }
                    }
                },
                take: 15,
                orderBy: {
                    lastMessageDate: 'desc'
                }
            })
        }),

    // 🔥 ELLIOTT'S ORAMA FULL-TEXT SEARCH MUTATION (From image_6278be.jpg)
    searchEmails: privateProcedure
        .input(z.object({
            accountId: z.string(),
            query: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // 1. Check permissions safely
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)
            
            // 2. Initialize Orama Client for this specific account
            const orama = new OramaManager(account.id)
            await orama.initialize()
            
            // 3. Search full-text logs using the query string term
            const results = await orama.search({ term: input.query })
            
            return results
        }),

    // Auto-Suggestions Fetcher Pattern
    getSuggestions: privateProcedure
        .input(z.object({
            accountId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db);
            
            return await ctx.db.emailAddress.findMany({
                where: {
                    accountId: account.id
                },
                select: {
                    address: true,
                    name: true
                }
            });
        }),

    // Perfect Reply Metadatas Dynamic Resolver
    getReplyDetails: privateProcedure
        .input(z.object({
            accountId: z.string(),
            threadId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db);
            
            const thread = await ctx.db.thread.findFirst({
                where: {
                    id: input.threadId,
                },
                include: {
                    emails: {
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
            });

            if (!thread || thread.emails.length === 0) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Thread not found" });
            }

            const fallbackEmail = thread.emails[thread.emails.length - 1]!;
            const lastExternalEmail = [...thread.emails].reverse().find(
                email => email.from.address !== account.emailAddress
            ) ?? fallbackEmail;

            return {
                subject: lastExternalEmail.subject,
                to: [lastExternalEmail.from, ...lastExternalEmail.to.filter(to => to.address !== account.emailAddress)],
                cc: lastExternalEmail.cc.filter(cc => cc.address !== account.emailAddress),
                from: { name: account.name, address: account.emailAddress },
                id: lastExternalEmail.internetMessageId,
            };
        }),
})