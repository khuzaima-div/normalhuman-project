import Account, { mapAurinkoError } from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { env } from "@/env";

const INITIAL_SYNC_TIMEOUT_MS =
  env.NODE_ENV === "development" ? 10 * 60_000 : 5 * 60_000;

/** Localhost: a few minutes. Production: longer grace period. */
const STALE_SYNCING_MS =
  env.NODE_ENV === "development" ? 2 * 60_000 : 10 * 60_000;

/** In-process registry of active sync promises (initial + delta). */
const activeSyncs = new Map<string, Promise<unknown>>();

export function isSyncInFlight(accountId: string): boolean {
  return activeSyncs.has(accountId);
}

export async function withSyncLock<T>(
  accountId: string,
  work: () => Promise<T>,
): Promise<T> {
  const existing = activeSyncs.get(accountId);
  if (existing) {
    await existing.catch(() => undefined);
  }

  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  activeSyncs.set(accountId, gate);

  try {
    return await work();
  } finally {
    activeSyncs.delete(accountId);
    release();
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function markAccountReady(
  accountId: string,
  extra?: { nextDeltaToken?: string | null; lastSyncedAt?: Date },
) {
  await db.account.update({
    where: { id: accountId },
    data: {
      // Schema: idle | syncing | error — idle is the "ready" state.
      syncStatus: "idle",
      lastSyncedAt: extra?.lastSyncedAt ?? new Date(),
      ...(extra?.nextDeltaToken !== undefined
        ? { nextDeltaToken: extra.nextDeltaToken }
        : {}),
    },
  });
}

/**
 * If syncStatus is "syncing" but no in-process fetch is running, or it has
 * been stuck longer than STALE_SYNCING_MS (especially in local development),
 * force the account back to idle ("ready") and optionally re-run initial sync
 * when nextDeltaToken is still null so inbound mail can flow again.
 */
export async function recoverStaleSyncStatus(accountId?: string) {
  const candidates = await db.account.findMany({
    where: {
      ...(accountId ? { id: accountId } : {}),
      syncStatus: "syncing",
    },
    select: {
      id: true,
      accessToken: true,
      lastSyncedAt: true,
      nextDeltaToken: true,
      _count: { select: { emails: true } },
    },
  });

  const now = Date.now();
  const reSyncIds: string[] = [];

  for (const account of candidates) {
    const inFlight = isSyncInFlight(account.id);
    const isStaleByTime =
      !account.lastSyncedAt ||
      now - account.lastSyncedAt.getTime() > STALE_SYNCING_MS;
    const orphanedSyncing = !inFlight;
    // Do not reset or re-start an import that is still running. A full mailbox
    // import can legitimately exceed the stale threshold in local development.
    if (inFlight || (!orphanedSyncing && !isStaleByTime)) {
      continue;
    }

    await markAccountReady(account.id, {
      lastSyncedAt: account.lastSyncedAt ?? new Date(),
    });

    console.warn(
      `[sync fallback] Forced syncStatus idle (ready) for account ${account.id}` +
        ` (inFlight=${inFlight}, stale=${isStaleByTime}, nextDeltaToken=${account.nextDeltaToken ? "set" : "null"})`,
    );

    // Without a delta token, delta/webhook sync cannot pull new mail — re-seed it.
    if (!account.nextDeltaToken && !isSyncInFlight(account.id)) {
      reSyncIds.push(account.id);
    }
  }

  for (const id of reSyncIds) {
    if (env.NODE_ENV === "development") {
      console.warn(
        `[sync fallback] Triggering initial sync override for account ${id} (null nextDeltaToken)`,
      );
      // Fire-and-forget so getAccounts stays responsive; errors are logged inside.
      void runInitialSync(id).catch((error) => {
        console.error(`[sync fallback] Initial sync override failed for ${id}:`, error);
      });
    }
  }
}

/**
 * Manual / testing entry: delta sync when possible, otherwise full initial sync.
 * Always clears a stuck "syncing" status afterward.
 */
export async function syncAccountNow(accountId: string) {
  return withSyncLock(accountId, async () => {
    const dbAccount = await db.account.findUnique({ where: { id: accountId } });
    if (!dbAccount) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    await db.account.update({
      where: { id: accountId },
      data: { syncStatus: "syncing" },
    });

    const account = new Account(dbAccount.accessToken);

    try {
      if (dbAccount.nextDeltaToken) {
        await account.syncEmails();
        await markAccountReady(accountId);
        return {
          mode: "delta" as const,
          success: true as const,
        };
      }

      // No delta token — pull latest via initial sync override.
      const response = await withTimeout(
        account.performInitialSync(),
        INITIAL_SYNC_TIMEOUT_MS,
        "performInitialSync",
      );

      if (!response) {
        throw new Error("FAILED_TO_SYNC");
      }

      await withTimeout(
        syncEmailsToDatabase(response.emails, accountId),
        INITIAL_SYNC_TIMEOUT_MS,
        "syncEmailsToDatabase",
      );

      await markAccountReady(accountId, {
        nextDeltaToken: response.deltaToken,
      });

      return {
        mode: "initial" as const,
        success: true as const,
        emailCount: response.emails.length,
        deltaToken: response.deltaToken,
      };
    } catch (error) {
      await db.account.update({
        where: { id: accountId },
        data: { syncStatus: "error" },
      });
      throw mapAurinkoError(error);
    }
  });
}

export async function runInitialSync(accountId: string) {
  return withSyncLock(accountId, async () => {
    const dbAccount = await db.account.findUnique({
      where: { id: accountId },
    });

    if (!dbAccount) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    await db.account.update({
      where: { id: accountId },
      data: { syncStatus: "syncing" },
    });

    const account = new Account(dbAccount.accessToken);

    try {
      try {
        await account.createSubscription();
      } catch (subError: unknown) {
        const message = subError instanceof Error ? subError.message : String(subError);
        console.warn(
          "Webhook subscription skipped or failed, continuing with email sync:",
          message,
        );
      }

      const response = await withTimeout(
        account.performInitialSync(),
        INITIAL_SYNC_TIMEOUT_MS,
        "performInitialSync",
      );

      if (!response) {
        throw new Error("FAILED_TO_SYNC");
      }

      const { deltaToken, emails } = response;

      await withTimeout(
        syncEmailsToDatabase(emails, accountId),
        INITIAL_SYNC_TIMEOUT_MS,
        "syncEmailsToDatabase",
      );

      await markAccountReady(accountId, { nextDeltaToken: deltaToken });

      return { success: true as const, deltaToken };
    } catch (error) {
      await db.account.update({
        where: { id: accountId },
        data: { syncStatus: "error" },
      });
      throw mapAurinkoError(error);
    }
  });
}
