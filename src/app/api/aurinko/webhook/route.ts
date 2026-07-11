import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import Account from "@/lib/account";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Aurinko subscription validation handshake
    const validationToken = req.nextUrl.searchParams.get("validationToken");
    if (validationToken) {
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const body = await req.json();
    const aurinkoAccountId = body.accountId ?? body.subscription?.accountId;

    if (!aurinkoAccountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    const accountData = await db.account.findFirst({
      where: { id: aurinkoAccountId.toString() },
    });

    if (!accountData?.accessToken) {
      console.error(`Account not found for Aurinko ID: ${aurinkoAccountId}`);
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const accountInstance = new Account(accountData.accessToken);

    // Delta sync upserts new/changed emails via syncEmailsToDatabase (same pipeline as initial sync)
    waitUntil(
      accountInstance.syncEmails().catch((error) => {
        console.error(
          `Delta sync failed for ${accountData.emailAddress}:`,
          error,
        );
      }),
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error processing Aurinko webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
