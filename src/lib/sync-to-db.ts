// src/lib/sync-to-db.ts
import type { EmailMessage, EmailAddress } from "@/types";
import { db } from "@/server/db";
import { OramaManager } from "@/server/orama"; // <--- Orama Manager Import kiya
import { getEmbeddings } from "./embeddings"; // Vector search embeddings ke liye

export async function syncEmailsToDatabase(emails: EmailMessage[], accountId: string) {
    console.log(`🔄 Attempting to sync ${emails.length} emails to database for account: ${accountId}`);
    try {
        // 1. Orama Manager ko initialize karein sync shuru hone se pehle
        const oramaClient = new OramaManager(accountId);
        await oramaClient.initialize();

        // Process emails sequentially to avoid exhausting the database connection pool
        for (const [index, email] of emails.entries()) {
            await upsertEmail(email, accountId, index, oramaClient); // <--- oramaClient pass kiya
        }
        console.log("✅ All emails synchronized to database and Orama Index successfully.");
    } catch (error) {
        console.error("❌ Critical error during database sync sequence:", error);
    }
}

async function upsertEmail(email: EmailMessage, accountId: string, index: number, oramaClient: OramaManager) {
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
        const participantIds = Array.from(addressesToUpsert.keys());

        const thread = await db.thread.upsert({
            where: { id: email.threadId },
            update: {
                accountId: accountId,
                subject: email.subject || "[No Subject]",
                lastMessageDate: new Date(email.sentAt || email.createdTime),
                done: false,
                inboxStatus: emailLabel === "inbox",
                draftStatus: emailLabel === "draft",
                sentStatus: emailLabel === "sent",
                participantIds,
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
                participantIds,
            }
        });

        // 5. Build lookup array connections strictly matching your Prisma Schema relational fields
        const toConnect = (email.to || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const ccConnect = (email.cc || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const bccConnect = (email.bcc || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const replyToConnect = (email.replyTo || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);

        // 6. Finally, upsert core Email entry matching your precise model definition
        await db.email.upsert({
            where: { internetMessageId: email.internetMessageId },
            update: {
                accountId: accountId,
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
                to: { connect: toConnect },
                cc: { connect: ccConnect },
                bcc: { connect: bccConnect },
                replyTo: { connect: replyToConnect },
            }
        });

        // ✨ 7. ORAMA INTEGRATION: Email ko Orama search index mein insert karna embeddings ke sath
        try {
            // Vector search ke liye embeddings generate karna
            const embeddingText = `${email.subject || ""} ${email.bodySnippet || ""}`;
            const embeddings = await getEmbeddings(embeddingText);

            await oramaClient.insert({
                title: email.subject || "[No Subject]",
                body: email.bodySnippet || "",
                rawBody: email.body || "",
                from: `${email.from?.name || ""} <${email.from?.address || ""}>`,
                to: (email.to || []).map(t => `${t.name || ""} <${t.address || " "}>`),
                sentAt: new Date(email.sentAt || email.createdTime).toISOString(),
                embeddings: embeddings,
                threadId: thread.id
            });
            console.log(`🚀 Email indexed into Orama successfully: ${email.subject}`);
        } catch (oramaError) {
            console.error(`⚠️ Orama indexing failed for email ${email.id}:`, oramaError);
            // Main loop ko block nahi karenge agar kisi aik email ka vector embedding fail ho jaye
        }

        // 8. If email contains active attachments, construct database maps securely
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