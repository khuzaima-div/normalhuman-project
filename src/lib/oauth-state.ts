import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { env } from "@/env";

export const OAUTH_STATE_COOKIE = "aurinko_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function sign(payload: string): string {
  return createHmac("sha256", env.CLERK_SECRET_KEY).update(payload).digest("hex");
}

/**
 * Create a signed OAuth state token binding the Clerk user and expiry.
 */
export function createOAuthState(userId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const exp = Date.now() + STATE_TTL_MS;
  const payload = `${userId}.${exp}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verify OAuth state matches the authenticated user and has not expired.
 */
export function verifyOAuthState(state: string, expectedUserId: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 4) {
    return false;
  }

  const [userId, expStr, nonce, signature] = parts;
  if (!userId || !expStr || !nonce || !signature) {
    return false;
  }

  if (userId !== expectedUserId) {
    return false;
  }

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return false;
  }

  const payload = `${userId}.${expStr}.${nonce}`;
  const expected = sign(payload);

  try {
    const sigBuf = Buffer.from(signature, "utf8");
    const expBuf = Buffer.from(expected, "utf8");
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
