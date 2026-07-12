import { headers } from "next/headers";
import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

type SubscriptionRecordPayload = {
    userId?: string | null;
    subscriptionId: string;
    customerId: string | null;
    productId: string;
    priceId: string;
    currentPeriodEnd: Date;
};

function getUserIdFromSession(session: Stripe.Checkout.Session) {
    return session.metadata?.userId ?? session.client_reference_id ?? null;
}

function getPeriodEnd(subscription: Stripe.Subscription) {
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

    return currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : new Date();
}

async function getPlanDetails(subscription: Stripe.Subscription) {
    const plan = subscription.items.data[0]?.price;

    if (!plan) {
        throw new Error("No plan found for this subscription.");
    }

    if (typeof plan.product === "string" || plan.product.deleted) {
        throw new Error("No valid product found for this subscription.");
    }

    return {
        productId: plan.product.id,
        priceId: plan.id,
    };
}

async function upsertSubscriptionRecord({
    userId,
    subscriptionId,
    customerId,
    productId,
    priceId,
    currentPeriodEnd,
}: SubscriptionRecordPayload) {
    const existing = await db.stripeSubscription.findFirst({
        where: {
            OR: [
                { subscriptionId },
                ...(customerId ? [{ customerId }] : []),
                ...(userId ? [{ userId }] : []),
            ],
        },
    });

    if (existing) {
        return db.stripeSubscription.update({
            where: { id: existing.id },
            data: {
                // Preserve existing userId when renewals omit it
                ...(userId !== undefined && userId !== null ? { userId } : {}),
                subscriptionId,
                customerId: customerId ?? existing.customerId,
                productId,
                priceId,
                currentPeriodEnd,
            },
        });
    }

    return db.stripeSubscription.create({
        data: {
            userId: userId ?? null,
            subscriptionId,
            customerId,
            productId,
            priceId,
            currentPeriodEnd,
        },
    });
}

export async function POST(req: Request) {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get("Stripe-Signature");

    if (!signature) {
        return new NextResponse("missing stripe signature", { status: 400 });
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET as string,
        );
    } catch (error: unknown) {
        console.error("❌ Webhook Error:", error);
        return new NextResponse("webhook error", { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = getUserIdFromSession(session);

        if (!userId) {
            return new NextResponse("missing user id", { status: 400 });
        }

        if (typeof session.subscription !== "string") {
            return new NextResponse("missing subscription id", { status: 400 });
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription, {
            expand: ["items.data.price.product"],
        });
        const { productId, priceId } = await getPlanDetails(subscription);

        await upsertSubscriptionRecord({
            userId,
            subscriptionId: subscription.id,
            customerId:
                typeof subscription.customer === "string"
                    ? subscription.customer
                    : null,
            productId,
            priceId,
            currentPeriodEnd: getPeriodEnd(subscription),
        });

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === "invoice.payment_succeeded") {
        const invoice = event.data.object as Stripe.Invoice & {
            subscription: string | null;
        };

        if (typeof invoice.subscription !== "string") {
            return new NextResponse("No subscription on invoice", { status: 200 });
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription, {
            expand: ["items.data.price.product"],
        });
        const { productId, priceId } = await getPlanDetails(subscription);

        await upsertSubscriptionRecord({
            userId: undefined,
            subscriptionId: subscription.id,
            customerId:
                typeof subscription.customer === "string"
                    ? subscription.customer
                    : null,
            productId,
            priceId,
            currentPeriodEnd: getPeriodEnd(subscription),
        });

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        if (!isActive) {
            await db.stripeSubscription.deleteMany({
                where: { subscriptionId: subscription.id },
            });

            return NextResponse.json({ message: "success" }, { status: 200 });
        }

        await db.stripeSubscription.updateMany({
            where: { subscriptionId: subscription.id },
            data: {
                updatedAt: new Date(),
                currentPeriodEnd: getPeriodEnd(subscription),
            },
        });

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;

        await db.stripeSubscription.deleteMany({
            where: { subscriptionId: subscription.id },
        });

        return NextResponse.json({ message: "success" }, { status: 200 });
    }

    return NextResponse.json({ message: "success" }, { status: 200 });
}