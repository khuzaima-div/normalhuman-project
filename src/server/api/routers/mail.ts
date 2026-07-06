import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, privateProcedure } from "../trpc"
import { emailAddressSchema } from "@/types"
import Account from "@/lib/account"
import { authoriseAccountAccess } from "./account"

export const mailRouter = createTRPCRouter({
    getMyAccount: privateProcedure
        .input(z.object({
            accountId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            return await authoriseAccountAccess(input.accountId, ctx.auth.userId, ctx.db)
        }),

    sendEmail: privateProcedure
        .input(z.object({
            accountId: z.string(),
            threadId: z.string().optional(),
            body: z.string(),
            subject: z.string(),
            from: emailAddressSchema,
            to: z.array(emailAddressSchema),
            cc: z.array(emailAddressSchema).optional(),
            bcc: z.array(emailAddressSchema).optional(),
            replyTo: emailAddressSchema.optional(),
            inReplyTo: z.string().optional(),
            references: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const account = await ctx.db.account.findFirst({
                where: {
                    id: input.accountId,
                    userId: ctx.auth.userId,
                },
            })

            if (!account) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Account not found",
                })
            }

            const accountInstance = new Account(account.accessToken)
            const response = await accountInstance.sendEmail({
                from: {
                    ...input.from,
                    name: input.from.name ?? "",
                },
                subject: input.subject,
                body: input.body,
                to: input.to.map((address) => ({ ...address, name: address.name ?? "" })),
                cc: input.cc?.map((address) => ({ ...address, name: address.name ?? "" })),
                bcc: input.bcc?.map((address) => ({ ...address, name: address.name ?? "" })),
                replyTo: input.replyTo ? { ...input.replyTo, name: input.replyTo.name ?? "" } : undefined,
                threadId: input.threadId,
                inReplyTo: input.inReplyTo,
                references: input.references,
            })

            return response
        }),
});
