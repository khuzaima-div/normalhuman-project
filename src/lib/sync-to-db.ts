// src/lib/sync-to-db.ts
import type { EmailMessage, EmailAddress } from "@/types";
import { db } from "@/server/db";
import { OramaManager } from "@/server/orama";
import { getEmbeddings } from "@/lib/embeddings";
import { isPortfolioMode, PORTFOLIO_EMAIL_LIMIT } from "./portfolio-mode";

const ORAMA_BODY_LIMIT = 2_000;
const ORAMA_RAW_BODY_LIMIT = 500;

export async function enforcePortfolioEmailCap(
    accountId: string,
    oramaClient?: OramaManager,
): Promise<string[]> {
    if (!isPortfolioMode()) return [];

    const allRemoved: string[] = [];

    for (let attempt = 0; attempt < 5; attempt++) {
        const emails = await db.email.findMany({
            where: { accountId },
            orderBy: { sentAt: "desc" },
            select: { id: true },
        });

        if (emails.length <= PORTFOLIO_EMAIL_LIMIT) break;

        const excessIds = emails.slice(PORTFOLIO_EMAIL_LIMIT).map((email) => email.id);
        await db.email.deleteMany({ where: { id: { in: excessIds } } });
        allRemoved.push(...excessIds);
    }

    if (allRemoved.length === 0) return [];

    const orphanThreads = await db.thread.findMany({
        where: { accountId },
        select: { id: true, _count: { select: { emails: true } } },
    });

    const orphanIds = orphanThreads
        .filter((thread) => thread._count.emails === 0)
        .map((thread) => thread.id);

    if (orphanIds.length > 0) {
        await db.thread.deleteMany({ where: { id: { in: orphanIds } } });
    }

    if (oramaClient) {
        await syncOramaToPortfolioEmails(accountId, oramaClient);
    }

    console.log(
        `[portfolio] Trimmed account ${accountId} to ${PORTFOLIO_EMAIL_LIMIT} emails (removed ${allRemoved.length})`,
    );

    return allRemoved;
}

async function syncOramaToPortfolioEmails(
    accountId: string,
    oramaClient: OramaManager,
) {
    await oramaClient.createFreshIndex();
    await backfillMissingOramaDocuments(accountId, oramaClient);
}

async function indexEmailInOrama(
    oramaClient: OramaManager,
    params: {
        id: string;
        subject: string;
        bodySnippet: string | null;
        body: string | null;
        fromName: string | null;
        fromAddress: string;
        toAddresses: string[];
        sentAt: Date;
        threadId: string;
    },
) {
    const embeddingText = `${params.subject || ""} ${params.bodySnippet || ""}`;
    const embeddings = await getEmbeddings(embeddingText);

    await oramaClient.upsertDocument(
        {
            id: params.id,
            title: params.subject || "[No Subject]",
            body: (params.bodySnippet || "").slice(0, ORAMA_BODY_LIMIT),
            rawBody: (params.body || "").slice(0, ORAMA_RAW_BODY_LIMIT),
            from: `${params.fromName || ""} <${params.fromAddress}>`,
            to: params.toAddresses,
            sentAt: params.sentAt.toISOString(),
            embeddings,
            threadId: params.threadId,
        },
        { persist: false },
    );
}

async function backfillMissingOramaDocuments(
    accountId: string,
    oramaClient: OramaManager,
) {
    const emails = await db.email.findMany({
        where: { accountId },
        orderBy: { sentAt: "desc" },
        ...(isPortfolioMode() ? { take: PORTFOLIO_EMAIL_LIMIT } : {}),
        include: {
            from: true,
            to: { select: { name: true, address: true } },
        },
    });

    let backfilled = 0;

    for (const email of emails) {
        if (await oramaClient.hasDocument(email.id)) {
            continue;
        }

        await indexEmailInOrama(oramaClient, {
            id: email.id,
            subject: email.subject,
            bodySnippet: email.bodySnippet,
            body: email.body,
            fromName: email.from.name,
            fromAddress: email.from.address,
            toAddresses: email.to.map((t) => `${t.name || ""} <${t.address}>`),
            sentAt: email.sentAt,
            threadId: email.threadId,
        });
        backfilled++;
    }

    if (backfilled > 0) {
        console.log(
            `📇 Backfilled ${backfilled} missing Orama documents for account ${accountId}`,
        );
    }
}

export async function syncEmailsToDatabase(emails: EmailMessage[], accountId: string) {
    console.log(`🔄 Attempting to sync ${emails.length} emails to database for account: ${accountId}`);
    const oramaClient = new OramaManager(accountId);
    await oramaClient.initialize();

    try {
        for (const [index, email] of emails.entries()) {
            await upsertEmail(email, accountId, index, oramaClient);
        }

        const removedIds = await enforcePortfolioEmailCap(
            accountId,
            isPortfolioMode() ? oramaClient : undefined,
        );

        if (!isPortfolioMode() || removedIds.length === 0) {
            await backfillMissingOramaDocuments(accountId, oramaClient);
        }

        await oramaClient.saveIndex();

        console.log("✅ All emails synchronized to database and Orama Index successfully.");
    } catch (error) {
        console.error("❌ Critical error during database sync sequence:", error);
        throw error;
    }
}

async function upsertEmail(email: EmailMessage, accountId: string, index: number, oramaClient: OramaManager) {
    try {
        let emailLabel: "inbox" | "sent" | "draft" = "inbox";
        if (email.sysLabels.includes("sent")) {
            emailLabel = "sent";
        } else if (email.sysLabels.includes("draft")) {
            emailLabel = "draft";
        }

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
                addressesToUpsert.set(address.address.toLowerCase(), address);
            }
        }

        const upsertedAddressesMap = new Map<string, string>();

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

        const participantIds = Array.from(addressesToUpsert.keys());

        const thread = await db.thread.upsert({
            where: { id: email.threadId },
            update: {
                accountId: accountId,
                subject: email.subject || "[No Subject]",
                lastMessageDate: new Date(email.sentAt || email.createdTime),
                ...(emailLabel === "inbox" ? { inboxStatus: true } : {}),
                ...(emailLabel === "draft" ? { draftStatus: true } : {}),
                ...(emailLabel === "sent" ? { sentStatus: true } : {}),
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

        const toConnect = (email.to || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const ccConnect = (email.cc || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const bccConnect = (email.bcc || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);
        const replyToConnect = (email.replyTo || []).filter(addr => addr && addr.address).map(addr => ({ id: upsertedAddressesMap.get(addr.address.toLowerCase()) })).filter(item => !!item.id);

        const sentAt = (email.sentAt && !isNaN(Date.parse(email.sentAt)))
            ? new Date(email.sentAt)
            : new Date();
        const receivedAt = (email.receivedAt && !isNaN(Date.parse(email.receivedAt)))
            ? new Date(email.receivedAt)
            : new Date();
        const lastModifiedTime = (email.lastModifiedTime && !isNaN(Date.parse(email.lastModifiedTime)))
            ? new Date(email.lastModifiedTime)
            : new Date();

        // After Aurinko reconnect, message ids can change while internetMessageId stays stable.
        // Resolve by id first, then by internetMessageId, to avoid unique conflicts on either key.
        const existingById = await db.email.findUnique({
            where: { id: email.id },
            select: { id: true },
        });
        const existingByMessageId =
            !existingById && email.internetMessageId
                ? await db.email.findUnique({
                    where: { internetMessageId: email.internetMessageId },
                    select: { id: true },
                })
                : null;
        const existingEmailId = existingById?.id ?? existingByMessageId?.id;
        const persistedEmailId = existingEmailId ?? email.id;

        const emailUpdateData = {
            accountId: accountId,
            threadId: thread.id,
            internetMessageId: email.internetMessageId,
            subject: email.subject || "[No Subject]",
            body: email.body,
            bodySnippet: email.bodySnippet,
            sysLabels: email.sysLabels,
            keywords: email.keywords,
            sysClassifications: email.sysClassifications,
            lastModifiedTime,
            sentAt,
            receivedAt,
            hasAttachments: email.hasAttachments || false,
            emailLabel: emailLabel,
            fromId: fromId,
            to: { set: toConnect },
            cc: { set: ccConnect },
            bcc: { set: bccConnect },
            replyTo: { set: replyToConnect },
        };

        if (existingEmailId) {
            await db.email.update({
                where: { id: existingEmailId },
                data: emailUpdateData,
            });
        } else {
            await db.email.create({
                data: {
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
                    lastModifiedTime,
                    sentAt,
                    receivedAt,
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
                },
            });
        }

        try {
            await indexEmailInOrama(oramaClient, {
                id: persistedEmailId,
                subject: email.subject || "[No Subject]",
                bodySnippet: email.bodySnippet ?? null,
                body: email.body ?? null,
                fromName: email.from?.name ?? null,
                fromAddress: email.from?.address ?? "",
                toAddresses: (email.to || []).map((t) => `${t.name || ""} <${t.address || " "}>`),
                sentAt,
                threadId: thread.id,
            });
        } catch (oramaError) {
            console.error(`⚠️ Orama indexing failed for email ${persistedEmailId}:`, oramaError);
        }

        if (email.hasAttachments && email.attachments && email.attachments.length > 0) {
            for (const attachment of email.attachments) {
                await db.emailAttachment.upsert({
                    where: { id: attachment.id },
                    update: {},
                    create: {
                        id: attachment.id,
                        emailId: persistedEmailId,
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
        throw error;
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

export async function applyPortfolioLimits(accountId: string) {
    if (!isPortfolioMode()) return;

    await enforcePortfolioEmailCap(accountId);
    await rebuildOramaIndexForAccount(accountId);
    await enforcePortfolioEmailCap(accountId);
}

export async function populateOramaIndex(
    oramaClient: OramaManager,
    accountId: string,
) {
    await oramaClient.createFreshIndex();
    await backfillMissingOramaDocuments(accountId, oramaClient);
    await oramaClient.saveIndex();
}

export async function rebuildOramaIndexForAccount(accountId: string) {
    await db.account.update({
        where: { id: accountId },
        data: { binaryIndex: null },
    });

    const oramaClient = new OramaManager(accountId);
    await populateOramaIndex(oramaClient, accountId);
}
