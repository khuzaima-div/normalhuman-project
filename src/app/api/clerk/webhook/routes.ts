// src/app/api/aurinko/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import Account from '@/lib/account';

export async function POST(req: NextRequest) {
    try {
        // 1. Aurinko se aane wali notification (body) ko parse kiya
        const body = await req.json();
        console.log("📡 [Aurinko Webhook Received]:", JSON.stringify(body, null, 2));

        // Aurinko validation token parameter query check (Baaz dafa validation check aata ha)
        const validationToken = req.nextUrl.searchParams.get('validationToken');
        if (validationToken) {
            return new NextResponse(validationToken, { 
                status: 200, 
                headers: { 'Content-Type': 'text/plain' } 
            });
        }

        // 2. Notification data se accountId nikali (Aurinko ke standard payload ke mutabiq)
        const aurinkoAccountId = body.accountId || body.subscription?.accountId;

        if (!aurinkoAccountId) {
            return NextResponse.json({ error: "Missing accountId context" }, { status: 400 });
        }

        // 3. Database se is account ka real record dhoonda taake accessToken mil sake
        const accountData = await db.account.findFirst({
            where: {
                // Aapke schema ke mutabiq unique identifier (id ya token link matching)
                id: aurinkoAccountId.toString() 
            }
        });

        if (!accountData || !accountData.accessToken) {
            console.error(`❌ Account not found in DB for Aurinko ID: ${aurinkoAccountId}`);
            return NextResponse.json({ error: "Account mapping not found" }, { status: 404 });
        }

        // 4. Apni Account class ko initialize kiya token de kar
        const accountInstance = new Account(accountData.accessToken);

        // 5. Background sync run karwa diya jo database mein entries upsert karega
        console.log(`🔄 Triggering background delta sync for: ${accountData.emailAddress}`);
        await accountInstance.syncEmails();

        // 6. Aurinko ko success response bhej diya taake use pata chale hume data mil gaya ha
        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error: any) {
        console.error("❌ Error processing Aurinko Webhook:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message }, 
            { status: 500 }
        );
    }
}