// src/app/api/initial-sync/route.ts
import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { accountId, userId } = body;
        
        if (!accountId || !userId) {
            return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
        }

        const dbAccount = await db.account.findUnique({
            where: {
                id: accountId,
                userId,
            }
        });
        
        if (!dbAccount) {
            return NextResponse.json({ error: "ACCOUNT_NOT_FOUND" }, { status: 404 });
        }

        // Token properties parsed strictly based on your schema structure
        const account = new Account(dbAccount.accessToken);
        
        // 🌟 PROFESSIONAL FIX: Wrap subscription in a try-catch block to prevent local tunnel failures from breaking the initial email sync
        try {
            console.log("📡 Registering Aurinko subscription hooks...");
            await account.createSubscription();
        } catch (subError: any) {
            console.warn("⚠️ Webhook subscription skipped or failed in local environment, but moving forward with email sync:", subError.message || subError);
        }

        console.log("🔄 Initiating core initial sync sequence from Aurinko API...");
        const response = await account.performInitialSync();
        
        if (!response) {
            return NextResponse.json({ error: "FAILED_TO_SYNC" }, { status: 500 });
        }

        const { deltaToken, emails } = response;

        // Triggering database pipeline safely
        await syncEmailsToDatabase(emails, accountId);

        // 🌟 Fixed: Unique database constraint mutation safely hitting ID instead of dynamic tokens
        await db.account.update({
            where: {
                id: accountId,
            },
            data: {
                nextDeltaToken: deltaToken,
            } as any // Explicit cast to handle custom output types discrepancies
        });

        console.log('✅ Sync complete, tracking delta token:', deltaToken);
        return NextResponse.json({ success: true, deltaToken }, { status: 200 });

    } catch (error: any) {
        console.error("❌ Error in initial-sync route:", error);
        return NextResponse.json({ error: error.message || "INTERNAL_SERVER_ERROR" }, { status: 500 });
    }
};