// src/lib/account.ts
import type { EmailHeader, EmailMessage, SyncResponse, SyncUpdatedResponse } from '@/types';
import { db } from '@/server/db';
import axios from 'axios';
import { syncEmailsToDatabase } from './sync-to-db';
import { isPortfolioMode, takeLatestEmails } from './portfolio-mode';

const API_BASE_URL = 'https://api.aurinko.io/v1';

function isNetworkReachabilityError(error: unknown): boolean {
    const candidates: string[] = [];
    if (axios.isAxiosError(error)) {
        if (error.code) candidates.push(error.code);
        if (error.message) candidates.push(error.message);
        const cause = error.cause;
        if (cause instanceof Error) {
            candidates.push(cause.message);
            const causeCode = (cause as NodeJS.ErrnoException).code;
            if (causeCode) candidates.push(causeCode);
        }
    } else if (error instanceof Error) {
        candidates.push(error.message);
        const code = (error as NodeJS.ErrnoException).code;
        if (code) candidates.push(code);
    }
    const joined = candidates.join(" ").toUpperCase();
    return (
        joined.includes("ETIMEDOUT") ||
        joined.includes("ECONNRESET") ||
        joined.includes("ECONNREFUSED") ||
        joined.includes("ENOTFOUND") ||
        joined.includes("EAI_AGAIN") ||
        joined.includes("NETWORK ERROR")
    );
}

/** Map Aurinko HTTP errors to user-facing messages. */
export function mapAurinkoError(error: unknown): Error {
    if (isNetworkReachabilityError(error)) {
        return new Error(
            "Cannot reach Aurinko — check your network/VPN and try again.",
        );
    }
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const code =
            typeof error.response?.data === "object" &&
            error.response?.data !== null &&
            "code" in error.response.data
                ? String((error.response.data as { code?: string }).code)
                : undefined;

        if (status === 402 || code === "payment.required") {
            return new Error(
                "Aurinko payment required — check your Aurinko plan.",
            );
        }
        if (status === 401 || status === 403) {
            return new Error(
                "Aurinko authorization failed — reconnect your email account.",
            );
        }
        const message =
            typeof error.response?.data === "object" &&
            error.response?.data !== null &&
            "message" in error.response.data
                ? String((error.response.data as { message?: string }).message)
                : error.message;
        return new Error(message || "Aurinko request failed");
    }
    if (error instanceof Error) return error;
    return new Error("Aurinko request failed");
}

/** True when Aurinko rejects a stale/invalid delta sync token. */
export function isInvalidSyncTokenError(error: unknown): boolean {
    const chunks: string[] = [mapAurinkoError(error).message];
    if (axios.isAxiosError(error) && error.response?.data != null) {
        chunks.push(
            typeof error.response.data === "string"
                ? error.response.data
                : JSON.stringify(error.response.data),
        );
    }
    const haystack = chunks.join(" ").toLowerCase();
    return (
        haystack.includes("sync token is not valid") ||
        haystack.includes("invalid sync token") ||
        haystack.includes("delta token is not valid") ||
        haystack.includes("invalid delta token")
    );
}

class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync(daysWithin: number): Promise<SyncResponse> {
        try {
            const response = await axios.post<SyncResponse>(
                `${API_BASE_URL}/email/sync`,
                {},
                {
                    headers: { Authorization: `Bearer ${this.token}` },
                    params: {
                        daysWithin,
                        bodyType: 'html'
                    }
                }
            );
            return response.data;
        } catch (error) {
            throw mapAurinkoError(error);
        }
    }

 async createSubscription() {
        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

        if (!webhookUrl) {
            console.warn("⚠️ [Aurinko Subscription] NEXT_PUBLIC_APP_URL is not set. Skipping webhook registration.");
            return { mocked: true, message: "Subscription skipped: NEXT_PUBLIC_APP_URL not configured." };
        }

        const hostname = new URL(webhookUrl).hostname;
        if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
            console.warn(
                "⚠️ [Aurinko Subscription] Local URLs are not reachable by Aurinko. " +
                "Skipping webhook registration; local polling will continue to sync mail.",
            );
            return {
                mocked: true,
                message: "Subscription skipped: NEXT_PUBLIC_APP_URL must be publicly reachable.",
            };
        }

        const notificationUrl = `${webhookUrl}/api/aurinko/webhook`;

        try {
            const res = await axios.post(
                `${API_BASE_URL}/subscriptions`,
                {
                    resource: '/email/messages',
                    notificationUrl,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('❌ Aurinko Subscription API Error Details:', JSON.stringify(error.response?.data, null, 2));
            }
            throw error;
        }
    }

    async syncEmails() {
        const account = await db.account.findFirst({
            where: {
                accessToken: this.token
            },
        }) as any; // 🌟 FIXED: Type-cast to bypass custom output path cache discrepancies
        
        if (!account) throw new Error("Invalid token");

        // Without a delta token, delta sync cannot run — seed via initial sync instead.
        if (!account.nextDeltaToken) {
            console.warn(
                `[syncEmails] Account ${account.id} has null nextDeltaToken; falling back to initial sync override.`,
            );
            await this.applyInitialSyncOverride(account.id);
            return;
        }

        try {
            let response = await this.getUpdatedEmails({ deltaToken: account.nextDeltaToken });
            let allEmails: EmailMessage[] = response.records || [];
            let storedDeltaToken = response.nextDeltaToken || account.nextDeltaToken;

            while (response.nextPageToken) {
                response = await this.getUpdatedEmails({ pageToken: response.nextPageToken });
                if (response.records) {
                    allEmails = allEmails.concat(response.records);
                }
                if (response.nextDeltaToken) {
                    storedDeltaToken = response.nextDeltaToken;
                }
            }

            if (allEmails.length > 0) {
                await syncEmailsToDatabase(allEmails, account.id);
            }

            await db.account.update({
                where: {
                    id: account.id,
                },
                data: {
                    nextDeltaToken: storedDeltaToken,
                    syncStatus: "idle",
                    lastSyncedAt: new Date(),
                } as any
            });
        } catch (error) {
            if (!isInvalidSyncTokenError(error)) {
                throw mapAurinkoError(error);
            }
            console.warn(
                `[syncEmails] Account ${account.id} has invalid nextDeltaToken; clearing and re-running initial sync.`,
            );
            await db.account.update({
                where: { id: account.id },
                data: { nextDeltaToken: null } as any,
            });
            await this.applyInitialSyncOverride(account.id);
        }
    }

    /** Seed mailbox via performInitialSync and persist the new delta token. */
    private async applyInitialSyncOverride(accountId: string) {
        const initial = await this.performInitialSync();
        if (initial?.emails?.length) {
            await syncEmailsToDatabase(initial.emails, accountId);
        }
        if (initial?.deltaToken) {
            await db.account.update({
                where: { id: accountId },
                data: {
                    nextDeltaToken: initial.deltaToken,
                    syncStatus: "idle",
                    lastSyncedAt: new Date(),
                } as any,
            });
        } else {
            await db.account.update({
                where: { id: accountId },
                data: {
                    syncStatus: "idle",
                    lastSyncedAt: new Date(),
                } as any,
            });
        }
    }

    async getUpdatedEmails({ deltaToken, pageToken }: { deltaToken?: string, pageToken?: string }): Promise<SyncUpdatedResponse> {
        const params: Record<string, string> = {};
        if (deltaToken) {
            params.deltaToken = deltaToken;
        }
        if (pageToken) {
            params.pageToken = pageToken;
        }
        try {
            const response = await axios.get<SyncUpdatedResponse>(
                `${API_BASE_URL}/email/sync/updated`,
                {
                    params,
                    headers: { Authorization: `Bearer ${this.token}` }
                }
            );
            return response.data;
        } catch (error) {
            throw mapAurinkoError(error);
        }
    }

    async performInitialSync() {
        try {
            const daysWithin = isPortfolioMode() ? 14 : 30;
            let syncResponse = await this.startSync(daysWithin);

            while (!syncResponse.ready) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                syncResponse = await this.startSync(daysWithin);
            }

            let storedDeltaToken: string = syncResponse.syncUpdatedToken;
            let updatedResponse = await this.getUpdatedEmails({ deltaToken: syncResponse.syncUpdatedToken });
            
            if (updatedResponse.nextDeltaToken) {
                storedDeltaToken = updatedResponse.nextDeltaToken;
            }
            
            let allEmails: EmailMessage[] = updatedResponse.records || [];

            while (updatedResponse.nextPageToken) {
                updatedResponse = await this.getUpdatedEmails({ pageToken: updatedResponse.nextPageToken });
                if (updatedResponse.records) {
                    allEmails = allEmails.concat(updatedResponse.records);
                }
                if (updatedResponse.nextDeltaToken) {
                    storedDeltaToken = updatedResponse.nextDeltaToken;
                }
            }

            if (allEmails.length === 0 && storedDeltaToken) {
                const catchUpResponse = await this.getUpdatedEmails({ deltaToken: storedDeltaToken });
                if (catchUpResponse.records && catchUpResponse.records.length > 0) {
                    allEmails = allEmails.concat(catchUpResponse.records);
                    storedDeltaToken = catchUpResponse.nextDeltaToken || storedDeltaToken;
                }
            }

            if (isPortfolioMode()) {
                allEmails = takeLatestEmails(allEmails);
                console.log(
                    `[portfolio] Initial sync capped to ${allEmails.length} latest emails`,
                );
            }

            return {
                emails: allEmails,
                deltaToken: storedDeltaToken,
            };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error during sync:', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.error('Error during sync:', error);
            }
            throw mapAurinkoError(error);
        }
    }

    async sendEmail({
        from,
        subject,
        body,
        inReplyTo,
        references,
        threadId,
        to,
        cc,
        bcc,
        replyTo,
    }: {
        from: EmailAddress;
        subject: string;
        body: string;
        inReplyTo?: string;
        references?: string;
        threadId?: string;
        to: EmailAddress[];
        cc?: EmailAddress[];
        bcc?: EmailAddress[];
        replyTo?: EmailAddress;
    }) {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/email/messages`,
                {
                    from,
                    subject,
                    body,
                    inReplyTo,
                    references,
                    threadId,
                    to,
                    cc,
                    bcc,
                    replyTo: replyTo ? [replyTo] : undefined,
                },
                {
                    params: {
                        returnIds: true
                    },
                    headers: { Authorization: `Bearer ${this.token}` }
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error sending email:', JSON.stringify(error.response?.data, null, 2));
            } else {
                console.error('Error sending email:', error);
            }
            throw error;
        }
    }

    async getWebhooks() {
        type Response = {
            records: {
                id: number;
                resource: string;
                notificationUrl: string;
                active: boolean;
                failSince: string;
                failDescription: string;
            }[];
            totalSize: number;
            offset: number;
            done: boolean;
        }
        const res = await axios.get<Response>(`${API_BASE_URL}/subscriptions`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        return res.data;
    }

    async createWebhook(resource: string, notificationUrl: string) {
        const res = await axios.post(`${API_BASE_URL}/subscriptions`, {
            resource,
            notificationUrl
        }, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        return res.data;
    }

    async deleteWebhook(subscriptionId: string) {
        const res = await axios.delete(`${API_BASE_URL}/subscriptions/${subscriptionId}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
        return res.data;
    }
}

type EmailAddress = {
    name: string;
    address: string;
}

export default Account;