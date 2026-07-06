// src/lib/account.ts
import type { EmailHeader, EmailMessage, SyncResponse, SyncUpdatedResponse } from '@/types';
import { db } from '@/server/db';
import axios from 'axios';
import { syncEmailsToDatabase } from './sync-to-db';

const API_BASE_URL = 'https://api.aurinko.io/v1';

class Account {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async startSync(daysWithin: number): Promise<SyncResponse> {
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
    }

 async createSubscription() {
        // 🌟 PROFESSIONAL DYNAMIC TUNNEL CONFIGURATION
        // Agar aapke paas koi live tunnel chal raha ha, to uska URL yahan paste karein. 
        // Agar tunnel nahi chalana, to bas isko khali string "" chhor dein, system crash nahi karega!
        let webhookUrl = "https://unslow-marquitta-noncandescently.ngrok-free.dev"; 

        // Clean trailing slashes if any
        webhookUrl = webhookUrl.trim().replace(/\/$/, "");
            
        // Agar url invalid ha ya temporary band ha, to isko development mein warning de kar skip karenge
        if (!webhookUrl || webhookUrl.includes("potatoes-calculator-reports-crisis")) {
            console.warn("⚠️ [Aurinko Subscription] Cloudflare Tunnel link is inactive or placeholder. Skipping webhook registration for safe local debugging.");
            return { mocked: true, message: "Subscription skipped in local development mode." };
        }

        console.log(`📡 Attempting to register Aurinko Webhook at: ${webhookUrl}/api/aurinko/webhook`);

        try {
            const res = await axios.post(
                `${API_BASE_URL}/subscriptions`,
                {
                    resource: '/email/messages',
                    notificationUrl: webhookUrl + '/api/aurinko/webhook'
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
        if (!account.nextDeltaToken) throw new Error("No delta token");
        
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

        try {
            if (allEmails.length > 0) {
                await syncEmailsToDatabase(allEmails, account.id);
            }
        } catch (error) {
            console.log('Error writing delta emails to database:', error);
        }

        await db.account.update({
            where: {
                id: account.id,
            },
            data: {
                nextDeltaToken: storedDeltaToken,
            } as any
        });
    }

    async getUpdatedEmails({ deltaToken, pageToken }: { deltaToken?: string, pageToken?: string }): Promise<SyncUpdatedResponse> {
        let params: Record<string, string> = {};
        if (deltaToken) {
            params.deltaToken = deltaToken;
        }
        if (pageToken) {
            params.pageToken = pageToken;
        }
        const response = await axios.get<SyncUpdatedResponse>(
            `${API_BASE_URL}/email/sync/updated`,
            {
                params,
                headers: { Authorization: `Bearer ${this.token}` }
            }
        );
        return response.data;
    }

    async performInitialSync() {
        try {
            const daysWithin = 5;
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
            throw error;
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

            console.log('sendmail', response.data);
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