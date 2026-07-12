import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import Account from "@/lib/account";
import { verifyAurinkoWebhookSignature } from "@/lib/aurinko";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/env";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimitResult = rateLimit(`aurinko-webhook:${ip}`, {
      windowMs: 60_000,
      maxRequests: 120,
    });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
          },
        },
      );
    }

    // Aurinko subscription validation handshake (no signature required)
    const validationToken = req.nextUrl.searchParams.get("validationToken");
    if (validationToken) {
      return new NextResponse(validationToken, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const rawBody = await req.text();
    const webhookSecret = env.AURINKO_WEBHOOK_SECRET;

    if (webhookSecret) {
      const timestamp = req.headers.get("x-aurinko-request-timestamp");
      const signature = req.headers.get("x-aurinko-signature");
      if (!verifyAurinkoWebhookSignature(rawBody, timestamp, signature, webhookSecret)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      console.error("AURINKO_WEBHOOK_SECRET is not configured in production");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    } else {
      console.warn("AURINKO_WEBHOOK_SECRET not set; skipping webhook signature verification in development");
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const subscription = body.subscription as { accountId?: unknown } | undefined;
    const rawAccountId = body.accountId ?? subscription?.accountId;
    const aurinkoAccountId =
      typeof rawAccountId === "string" || typeof rawAccountId === "number"
        ? String(rawAccountId)
        : null;

    if (!aurinkoAccountId) {
      return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
    }

    const accountData = await db.account.findFirst({
      where: { id: aurinkoAccountId },
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
