// src/lib/sync-to-db.ts
import type { EmailMessage, EmailAddress } from "@/types";
import { db } from "@/server/db";
export async function syncEmailsToDatabase(emails: EmailMessage[], accountId: string) {
    console.log(`🔄 Attempting to sync ${emails.length} emails to database for account: ${accountId}`);
    try {
        // Process emails sequentially to avoid exhausting the database connection pool
        for (const [index, email] of emails.entries()) {
            await upsertEmail(email, accountId, index);
        }
        console.log("✅ All emails synchronized to database successfully.");
    } catch (error) {
        console.error("❌ Critical error during database sync sequence:", error);
    }
}

async function upsertEmail(email: EmailMessage, accountId: string, index: number) {
    try {
        // 1. Determine local Email Label matching your schema Enum (inbox, sent, draft)
        let emailLabel: "inbox" | "sent" | "draft" = "inbox";
        if (email.sysLabels.includes("sent")) {
            emailLabel = "sent";
        } else if (email.sysLabels.includes("draft")) {
            emailLabel = "draft";
        }

        // 2. Collect and unique all addresses present inside this email instance
        const addressesToUpsert = new Map<string, EmailAddress>();
        
        const rawAddresses = [
            email.from,
            ...(email.to || []),
            ...(email.cc || []),
            ...(email.bcc || []),
            ...(email.replyTo || [])
        ];

        for (const address of rawAddresses) {
            if (address && address.address) {
                // Lowercase to handle case insensitivity issues gracefully
                addressesToUpsert.set(address.address.toLowerCase(), address);
            }
        }

        // 3. Upsert unique addresses sequentially or mapping via schema lookup
        const upsertedAddressesMap = new Map<string, string>(); // Maps raw email address string to database generated cuid CUID

        for (const [cleanAddress, addressObj] of addressesToUpsert) {
            const dbAddress = await upsertEmailAddress(addressObj, accountId);
            if (dbAddress) {
                upsertedAddressesMap.set(cleanAddress, dbAddress.id);
            }
        }

        const fromId = email.from?.address ? upsertedAddressesMap.get(email.from.address.toLowerCase()) : undefined;
        if (!fromId) {
            console.warn(`⚠️ Skipping email upsert [Index: ${index}]: Origin identity reference mapping failed.`);
            return;
        }

        // 4. Create or update Thread record beforehand to establish proper parent mapping
        // Using threadId from Aurinko or falling back safely to a relational connection lookup
        const thread = await db.thread.upsert({
            where: { id: email.threadId },
            update: {
                subject: email.subject || "[No Subject]",
                lastMessageDate: new Date(email.sentAt || email.createdTime),
                done: false,
                inboxStatus: emailLabel === "inbox",
                draftStatus: emailLabel === "draft",
                sentStatus: emailLabel === "sent",
            },
            create: {
                id: email.threadId,
                accountId: accountId,
                subject: email.subject || "[No Subject]",
                lastMessageDate: new Date(email.sentAt || email.createdTime),
                done: false,
                inboxStatus: emailLabel === "inbox",
                draftStatus: emailLabel === "draft",
                sentStatus: emailLabel === "sent",
            }
        });

        // 5. Build lookup array connections strictly matching your Prisma Schema relational fields
        const toConnect = (email.to || []).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const ccConnect = (email.cc || []).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const bccConnect = (email.bcc || []).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const replyToConnect = (email.replyTo || []).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
// 6. Finally, upsert core Email entry matching your precise model definition
        await db.email.upsert({
            where: { internetMessageId: email.internetMessageId },
            update: {
                subject: email.subject || "[No Subject]",
                body: email.body,
                bodySnippet: email.bodySnippet,
                sysLabels: email.sysLabels,
                keywords: email.keywords,
                sysClassifications: email.sysClassifications,
                lastModifiedTime: (email.lastModifiedTime && !isNaN(Date.parse(email.lastModifiedTime))) 
                    ? new Date(email.lastModifiedTime) 
                    : new Date(),
                emailLabel: emailLabel,
            },
            create: {
                id: email.id,
                threadId: thread.id,
                accountId: accountId,
                internetMessageId: email.internetMessageId,
                subject: email.subject || "[No Subject]",
                body: email.body,
                bodySnippet: email.bodySnippet,
                createdTime: (email.createdTime && !isNaN(Date.parse(email.createdTime))) 
                    ? new Date(email.createdTime) 
                    : new Date(),
                lastModifiedTime: (email.lastModifiedTime && !isNaN(Date.parse(email.lastModifiedTime))) 
                    ? new Date(email.lastModifiedTime) 
                    : new Date(),
                sentAt: (email.sentAt && !isNaN(Date.parse(email.sentAt))) 
                    ? new Date(email.sentAt) 
                    : new Date(),
                receivedAt: (email.receivedAt && !isNaN(Date.parse(email.receivedAt))) 
                    ? new Date(email.receivedAt) 
                    : new Date(),
                sysLabels: email.sysLabels,
                keywords: email.keywords,
                sysClassifications: email.sysClassifications,
                hasAttachments: email.hasAttachments || false,
                emailLabel: emailLabel,
                fromId: fromId,
                // Structuring relations matching many-to-many properties mapping syntax
                to: { connect: toConnect },
                cc: { connect: ccConnect },
                bcc: { connect: bccConnect },
                replyTo: { connect: replyToConnect },
            }
        });

        // 7. If email contains active attachments, construct database maps securely
        if (email.hasAttachments && email.attachments && email.attachments.length > 0) {
            for (const attachment of email.attachments) {
                await db.emailAttachment.upsert({
                    where: { id: attachment.id },
                    update: {},
                    create: {
                        id: attachment.id,
                        emailId: email.id,
                        name: attachment.name || "Untitled Attachment",
                        mimeType: attachment.mimeType,
                        size: attachment.size,
                        inline: attachment.inline || false,
                        contentId: attachment.contentId,
                        content: attachment.content,
                        contentLocation: attachment.contentLocation,
                    }
                });
            }
        }

    } catch (error) {
        console.error(`❌ Failed to upsert email entity at index ${index}:`, error);
    }
}

async function upsertEmailAddress(address: EmailAddress, accountId: string) {
    try {
        const cleanAddressStr = address.address.toLowerCase();
        
        // Match using explicit dynamic compound unique index constraint defined in your schema
        return await db.emailAddress.upsert({
            where: {
                accountId_address: {
                    accountId: accountId,
                    address: cleanAddressStr,
                }
            },
            update: {
                name: address.name,
                raw: address.raw
            },
            create: {
                accountId: accountId,
                address: cleanAddressStr,
                name: address.name,
                raw: address.raw
            }
        });
    } catch (error) {
        console.error(`❌ Failed to upsert email address entity [${address.address}]:`, error);
        return null;
    }
}