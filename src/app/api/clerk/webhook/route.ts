import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

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

  if (event.type !== "user.created") {
    return new Response("Event ignored", { status: 200 });
  }

  const { id, first_name, last_name, image_url, email_addresses } = event.data;
  const emailAddress =
    email_addresses?.[0]?.email_address ?? `${id}@temporary.com`;

  try {
    await db.user.create({
      data: {
        id,
        emailAddress,
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        imageUrl: image_url ?? "",
      },
    });

    return new Response("Webhook received", { status: 200 });
  } catch (error) {
    // Idempotent: user may already exist from Aurinko callback fallback
    try {
      await db.user.update({
        where: { id },
        data: {
          emailAddress,
          firstName: first_name ?? "",
          lastName: last_name ?? "",
          imageUrl: image_url ?? "",
        },
      });
      return new Response("Webhook received", { status: 200 });
    } catch (updateError) {
      console.error("Clerk webhook DB error:", updateError);
      return new Response("Database insertion failed", { status: 500 });
    }
  }
};
