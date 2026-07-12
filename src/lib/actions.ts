'use server';

import { auth } from "@clerk/nextjs/server";
import { getStripe, isStripeConfigured } from "./stripe";
import { redirect } from "next/navigation";
import { db } from "@/server/db";

/**
 * User ko Stripe Checkout Page par redirect karne ke liye
 */
export async function createCheckoutSession() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error('User not authenticated');
    }

    if (!isStripeConfigured()) {
        throw new Error('Billing is not configured');
    }

    const stripe = getStripe();
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
        throw new Error('Billing is not configured');
    }

    // Checkout session create ho raha hai
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/mail`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/mail`,
        client_reference_id: userId,
        metadata: {
            userId: userId,
        },
        subscription_data: {
            metadata: {
                userId: userId,
            },
        },
    });

    if (!session.url) {
        throw new Error('Failed to create checkout session');
    }

    redirect(session.url);
}

/**
 * User ko Stripe ke Customer Portal par bhejne ke liye (Subscription cancel/update karne)
 */
export async function createBillingPortalSession() {
    const { userId } = await auth();
    
    if (!userId) {
        throw new Error('User not authenticated');
    }

    if (!isStripeConfigured()) {
        throw new Error('Billing is not configured');
    }

    const stripe = getStripe();

    // Database se user ki stripe details fetch ho rahi hain
    const subscription = await db.stripeSubscription.findUnique({
        where: { userId: userId },
    });

    if (!subscription?.customerId) {
        throw new Error('Stripe customer ID not found for this user');
    }

    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.customerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/mail`,
    });

    if (!session.url) {
        throw new Error('Failed to create billing portal session');
    }

    redirect(session.url);
}

/**
 * Frontend par check karne ke liye ke user paid hai ya nahi
 */
export async function getSubscriptionStatus() {
    const { userId } = await auth();
    
    if (!userId) {
        return false;
    }

    const subscription = await db.stripeSubscription.findUnique({
        where: { userId: userId },
    });

    if (!subscription) {
        return false;
    }

    // Check agar subscription active hai aur expire nahi hui
    return subscription.currentPeriodEnd > new Date();
}
