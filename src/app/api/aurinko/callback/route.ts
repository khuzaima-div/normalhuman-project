// src/app/api/aurinko/callback/route.ts
import { auth, currentUser } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko"
import { runInitialSync } from "@/lib/run-initial-sync"
import { db } from "@/server/db" 
import { waitUntil } from "@vercel/functions"
import { assertAccountAllowed, BillingLimitError } from "@/lib/billing"

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

        // 🌟 Ensure User Exists in Database Before Account Insertion
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

            // Strictly matching your exact Prisma Schema
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
        })

        if (!existingAccount) {
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

        // 5. Step 3: Ensure the Aurinko account record is unique and always updated
        // Only clear nextDeltaToken on first create — preserve delta on token refresh
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

        // Re-run initial sync only when we still lack a delta token
        const linkedAccount = await db.account.findUnique({
            where: { id: accountId },
            select: { nextDeltaToken: true },
        })
        if (!linkedAccount?.nextDeltaToken) {
            waitUntil(
                runInitialSync(accountId)
                    .catch((error) => {
                        console.error("Failed to run initial sync:", error);
                    }),
            );
        }

        // User ko cleanly dashboard ya mail page par bhej dein, and pass the newly linked account ID
        return NextResponse.redirect(new URL(`/mail?accountId=${accountId}`, req.nextUrl.origin));

    } catch (error) {
        console.error("Error in Aurinko Callback:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}