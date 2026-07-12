import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

function getPrimaryEmail(event: WebhookEvent): string | null {
  if (event.type === "user.created" || event.type === "user.updated") {
    return event.data.email_addresses?.[0]?.email_address ?? null;
  }
  return null;
}

export const POST = async (req: Request) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let event: WebhookEvent;
  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "user.deleted") {
    const userId = event.data.id;
    if (!userId) {
      return new Response("Missing user id", { status: 400 });
    }

    try {
      await db.user.delete({ where: { id: userId } });
    } catch (error) {
      // Idempotent: user may already be removed
      console.warn("Clerk user.deleted: user not found or already deleted", error);
    }

    return new Response("Webhook received", { status: 200 });
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    return new Response("Event ignored", { status: 200 });
  }

  const { id, first_name, last_name, image_url } = event.data;
  const emailAddress = getPrimaryEmail(event) ?? `${id}@temporary.com`;

  try {
    await db.user.upsert({
      where: { id },
      create: {
        id,
        emailAddress,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        imageUrl: image_url ?? "",
      },
      update: {
        emailAddress,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        imageUrl: image_url ?? "",
      },
    });

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Clerk webhook DB error:", error);
    return new Response("Database operation failed", { status: 500 });
  }
};
