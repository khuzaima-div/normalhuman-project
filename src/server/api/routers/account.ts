import { z } from "zod"
// 📑 Note: Agar aapke trpc.ts me iska naam 'protectedProcedure' ha to niche use change kar lena
import { createTRPCRouter, privateProcedure } from "../trpc"
import { PrismaClient } from "@prisma/client"

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
            select: { id: true, emailAddress: true, name: true }
        })
    }),

    // Get live threads count router query
    getNumThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            tab: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            // Validate account ownership
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            let filter: Record<string, any> = {}

            if (input.tab === 'inbox') {
                filter.inboxStatus = true
            } else if (input.tab === 'draft') {
                filter.draftStatus = true
            } else if (input.tab === 'sent') {
                filter.sentStatus = true
            } else if (input.tab === 'done') {
                filter.doneStatus = true
            }

            return await ctx.db.thread.count({
                where: {
                    accountId: account.id,
                    ...filter
                }
            })
        }),

    // 🌟 ELLIOTT'S NEW DYNAMIC THREADS FETCHING PROCEDURE (FIXED FILTER)
    getThreads: privateProcedure
        .input(z.object({
            accountId: z.string(),
            tab: z.string(),
            done: z.boolean()
        }))
        .query(async ({ ctx, input }) => {
            // 1. Authorise user access safely
            const account = await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)

            // 2. Setup dynamic filters for folder tabs using safe generic records
            let filter: Record<string, any> = {}

            if (input.tab === 'inbox') {
                filter.inboxStatus = true
            } else if (input.tab === 'draft') {
                filter.draftStatus = true
            } else if (input.tab === 'sent') {
                filter.sentStatus = true
            }

            // 3. Filter based on done/archive toggle state (Direct boolean check for Prisma object modeling)
            filter.done = input.done

            // 4. Fetch deeply nested and relational email items cleanly
            return await ctx.db.thread.findMany({
                where: {
                    accountId: account.id,
                    ...filter
                },
                include: {
                    emails: {
                        orderBy: {
                            sentAt: 'asc' // Oldest to newest emails within a thread chain
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
                take: 15, // Infinite scroll chunk size
                orderBy: {
                    lastMessageDate: 'desc' // Newest active thread updates stay on top
                }
            })
        })
})