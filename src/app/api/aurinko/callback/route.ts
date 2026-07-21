// src/app/api/aurinko/callback/route.ts
import { auth, currentUser } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko"
import { runInitialSync, syncAccountNow } from "@/lib/run-initial-sync"
import { db } from "@/server/db"
import { waitUntil } from "@vercel/functions"
import { assertAccountAllowed, BillingLimitError } from "@/lib/billing"
import { OAUTH_STATE_COOKIE, verifyOAuthState } from "@/lib/oauth-state"

export const GET = async (req: NextRequest) => {
    try {
        // 1. Clerk User Authentication Check
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
        }

        // 2. URL Params Extraction
        const params = req.nextUrl.searchParams
        const status = params.get('status')
        const code = params.get('code')
        const state = params.get('state')

        if (!state || !verifyOAuthState(state, userId)) {
            return NextResponse.json({ message: "Invalid OAuth state" }, { status: 403 })
        }

        const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value
        if (cookieState && cookieState !== state) {
            return NextResponse.json({ message: "Invalid OAuth state" }, { status: 403 })
        }

        if (status !== 'success') {
            return NextResponse.json({ message: "Failed to link account" }, { status: 400 })
        }
        if (!code) {
            return NextResponse.json({ message: "No code provided" }, { status: 400 })
        }

        // 3. Step 1: Code ko token se exchange karein
        const token = await exchangeCodeForAccessToken(code)
        if (!token) {
            return NextResponse.json({ message: "Failed to exchange code for access token" }, { status: 400 })
        }

        // 4. Step 2: Account Details mangwein
        const accountDetails = await getAccountDetails(token.accessToken)

        // Ensure User Exists in Database Before Account Insertion
        let existingUser = await db.user.findUnique({
            where: { id: userId }
        })

        // Fallback: Agar local development mein webhook na chalne ki wajah se user DB mein nahi ha
        if (!existingUser) {
            const clerkUser = await currentUser()
            if (!clerkUser) {
                return NextResponse.json({ message: "Clerk user profile fetch failed" }, { status: 404 })
            }

            const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress
            if (!primaryEmail) {
                return NextResponse.json({ message: "User email address missing in Clerk" }, { status: 400 })
            }

            existingUser = await db.user.create({
                data: {
                    id: userId,
                    emailAddress: primaryEmail,
                    firstName: clerkUser.firstName || "",
                    lastName: clerkUser.lastName || "",
                    imageUrl: clerkUser.imageUrl || "",
                }
            })
        }

        const accountId = token.accountId.toString()
        const existingAccount = await db.account.findUnique({
            where: { id: accountId },
            select: { userId: true, nextDeltaToken: true },
        })

        if (existingAccount && existingAccount.userId !== userId) {
            return NextResponse.json(
                { message: "This email account is already linked to another user" },
                { status: 409 },
            )
        }

        // Same inbox reconnect: match by email even if Aurinko assigned a new account id
        const accountByEmail = !existingAccount
            ? await db.account.findFirst({
                where: {
                    userId: existingUser.id,
                    emailAddress: { equals: accountDetails.email, mode: "insensitive" },
                },
                select: { id: true, nextDeltaToken: true },
            })
            : null

        const isReconnect = Boolean(existingAccount || accountByEmail)

        if (!isReconnect) {
            try {
                await assertAccountAllowed(existingUser.id)
            } catch (error) {
                if (error instanceof BillingLimitError) {
                    return NextResponse.redirect(
                        new URL("/mail?accountLimit=reached", req.nextUrl.origin),
                    )
                }
                throw error
            }
        }

        // 5. Persist token — reconnect may need to migrate Account.id (ON UPDATE CASCADE)
        const hadDeltaToken = Boolean(
            existingAccount?.nextDeltaToken ?? accountByEmail?.nextDeltaToken,
        )

        if (accountByEmail && accountByEmail.id !== accountId) {
            await db.account.update({
                where: { id: accountByEmail.id },
                data: {
                    id: accountId,
                    accessToken: token.accessToken,
                    emailAddress: accountDetails.email,
                    name: accountDetails.name,
                },
            })
        } else {
            await db.account.upsert({
                where: {
                    id: accountId,
                },
                update: {
                    accessToken: token.accessToken,
                    emailAddress: accountDetails.email,
                    name: accountDetails.name,
                },
                create: {
                    id: accountId,
                    userId: existingUser.id,
                    emailAddress: accountDetails.email,
                    name: accountDetails.name,
                    accessToken: token.accessToken,
                    nextDeltaToken: null,
                },
            })
        }

        // After link/reconnect: delta sync when possible, otherwise full initial sync
        waitUntil(
            (hadDeltaToken ? syncAccountNow(accountId) : runInitialSync(accountId))
                .catch((error) => {
                    console.error("Failed to run sync after Aurinko link:", error);
                }),
        );

        const redirectResponse = NextResponse.redirect(new URL(`/mail?accountId=${accountId}`, req.nextUrl.origin));
        redirectResponse.cookies.delete(OAUTH_STATE_COOKIE);
        return redirectResponse;

    } catch (error) {
        console.error("Error in Aurinko Callback:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
