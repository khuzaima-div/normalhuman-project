import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, privateProcedure } from "../trpc"
import { emailAddressSchema, type EmailMessage } from "@/types"
import Account, { mapAurinkoError } from "@/lib/account"
import { syncEmailsToDatabase } from "@/lib/sync-to-db"
import { recoverStaleSyncStatus, syncAccountNow } from "@/lib/run-initial-sync"
import { authoriseAccountAccess, getAccountAccessToken } from "./account"
import { rateLimit } from "@/lib/rate-limit"

function toBodySnippet(body: string): string {
    return body
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200)
}

type SendEmailResponse = {
    status?: string
    id?: string
    submittedMessageId?: string
    threadId?: string
}

export const mailRouter = createTRPCRouter({
    getMyAccount: privateProcedure
        .input(z.object({
            accountId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            return await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)
        }),

    /**
     * Delta sync when possible, otherwise initial sync override.
     * Used by the mail UI auto-sync / polling loop.
     */
    syncNow: privateProcedure
        .input(z.object({
            accountId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const rateLimitResult = rateLimit(`sync:${ctx.auth.userId}`, {
                windowMs: 60_000,
                maxRequests: 10,
            });
            if (!rateLimitResult.success) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "Sync rate limit exceeded. Please try again shortly.",
                });
            }

            await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)
            await recoverStaleSyncStatus(input.accountId)

            try {
                const result = await syncAccountNow(input.accountId)
                const emailCount = await ctx.db.email.count({
                    where: { accountId: input.accountId },
                })
                const account = await ctx.db.account.findUnique({
                    where: { id: input.accountId },
                    select: {
                        syncStatus: true,
                        nextDeltaToken: true,
                        lastSyncedAt: true,
                    },
                })

                return {
                    ...result,
                    emailCount: "emailCount" in result && result.emailCount != null
                        ? result.emailCount
                        : emailCount,
                    syncStatus: account?.syncStatus ?? "idle",
                    hasDeltaToken: Boolean(account?.nextDeltaToken),
                    lastSyncedAt: account?.lastSyncedAt ?? null,
                }
            } catch (error) {
                console.error("mail.syncNow failed:", error)
                const mapped = mapAurinkoError(error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: mapped.message,
                })
            }
        }),

    sendEmail: privateProcedure
        .input(z.object({
            accountId: z.string(),
            threadId: z.string().optional(),
            body: z.string().min(1).max(500_000),
            subject: z.string().min(1).max(998),
            from: emailAddressSchema,
            to: z.array(emailAddressSchema).min(1).max(50),
            cc: z.array(emailAddressSchema).max(50).optional(),
            bcc: z.array(emailAddressSchema).max(50).optional(),
            replyTo: emailAddressSchema.optional(),
            inReplyTo: z.string().max(998).optional(),
            references: z.string().max(4_000).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const account = await authoriseAccountAccess(
                input.accountId,
                ctx.auth.userId,
                ctx.db,
            )

            const accessToken = await getAccountAccessToken(
                input.accountId,
                ctx.auth.userId,
                ctx.db,
            )

            const from = {
                address: account.emailAddress,
                name: account.name ?? "",
            }
            const to = input.to.map((address) => ({ ...address, name: address.name ?? "" }))
            const cc = input.cc?.map((address) => ({ ...address, name: address.name ?? "" }))
            const bcc = input.bcc?.map((address) => ({ ...address, name: address.name ?? "" }))
            const replyTo = from

            const accountInstance = new Account(accessToken)
            const response = (await accountInstance.sendEmail({
                from,
                subject: input.subject,
                body: input.body,
                to,
                cc,
                bcc,
                replyTo,
                threadId: input.threadId,
                inReplyTo: input.inReplyTo,
                references: input.references,
            })) as SendEmailResponse

            const messageId = response.id ?? `local-sent-${Date.now()}`
            const threadId = response.threadId || input.threadId || messageId
            const now = new Date().toISOString()

            const sentEmail: EmailMessage = {
                id: messageId,
                threadId,
                createdTime: now,
                lastModifiedTime: now,
                sentAt: now,
                receivedAt: now,
                internetMessageId:
                    response.submittedMessageId || `<${messageId}@aurinko.sent>`,
                subject: input.subject,
                sysLabels: ["sent"],
                keywords: [],
                sysClassifications: [],
                sensitivity: "normal",
                from,
                to,
                cc: cc ?? [],
                bcc: bcc ?? [],
                replyTo: replyTo ? [replyTo] : [],
                hasAttachments: false,
                body: input.body,
                bodySnippet: toBodySnippet(input.body),
                attachments: [],
                inReplyTo: input.inReplyTo,
                references: input.references,
                internetHeaders: [],
                nativeProperties: {},
                omitted: [],
            }

            try {
                await syncEmailsToDatabase([sentEmail], account.id)
            } catch (error) {
                console.error("Failed to force-insert sent email into database:", error)
            }

            return response
        }),
});
