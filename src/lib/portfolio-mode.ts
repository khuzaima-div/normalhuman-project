import { env } from "@/env";

export const PORTFOLIO_EMAIL_LIMIT = 45;

export function isPortfolioMode(): boolean {
    return env.PORTFOLIO_MODE;
}

type DatedEmail = {
    sentAt?: string | Date | null;
    receivedAt?: string | Date | null;
    createdTime?: string | Date | null;
};

function emailTimestamp(email: DatedEmail): number {
    const raw = email.sentAt ?? email.receivedAt ?? email.createdTime ?? 0;
    const parsed = raw instanceof Date ? raw.getTime() : Date.parse(String(raw));
    return Number.isFinite(parsed) ? parsed : 0;
}

export function takeLatestEmails<T extends DatedEmail>(
    emails: T[],
    limit = PORTFOLIO_EMAIL_LIMIT,
): T[] {
    return [...emails]
        .sort((a, b) => emailTimestamp(b) - emailTimestamp(a))
        .slice(0, limit);
}
