// src/app/api/aurinko/callback/route.ts
import { auth, currentUser } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { exchangeCodeForAccessToken, getAccountDetails } from "@/lib/aurinko"
import { db } from "@/server/db" 
import axios from "axios"
import { waitUntil } from "@vercel/functions" // 🌟 Fixed: Added Vercel functions import for background routing

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

        // 5. Step 3: Ensure the Aurinko account record is unique and always updated
        await db.account.upsert({
            where: {
                id: token.accountId.toString(),
            },
            update: {
                accessToken: token.accessToken,
                emailAddress: accountDetails.email,
                name: accountDetails.name,
                nextDeltaToken: null,
            },
            create: {
                id: token.accountId.toString(),
                userId: existingUser.id,
                emailAddress: accountDetails.email,
                name: accountDetails.name,
                accessToken: token.accessToken,
                nextDeltaToken: null,
            },
        })

        // 🌟 6. Trigger initial sync endpoint via waitUntil safely
       // 🌟 FIXED: dynamic base host fallback matching your configured env key name
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || req.nextUrl.origin;

        waitUntil(
            axios.post(`${baseUrl}/api/initial-sync`, {
                accountId: token.accountId.toString(),
                userId
            }).then(response => {
                console.log('Initial sync triggered successfully:', response.data);
            }).catch(error => {
                console.error('Failed to trigger initial sync:', error.message || error);
            })
        );

        // User ko cleanly dashboard ya mail page par bhej dein, and pass the newly linked account ID
        return NextResponse.redirect(new URL(`/mail?accountId=${token.accountId.toString()}`, req.nextUrl.origin));

    } catch (error) {
        console.error("Error in Aurinko Callback:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}