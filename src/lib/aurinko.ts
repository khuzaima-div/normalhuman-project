import axios from 'axios'
import { createHmac, timingSafeEqual } from 'crypto'
import { env } from "@/env";

export function getAurinkoCallbackUrl(): string {
  return `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/aurinko/callback`;
}

/**
 * Verify Aurinko webhook HMAC signature.
 * Base string format: v0:{timestamp}:{raw_body}
 */
export function verifyAurinkoWebhookSignature(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  signingSecret: string,
): boolean {
  if (!timestamp || !signature) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const expected = createHmac("sha256", signingSecret)
    .update(baseString)
    .digest("hex");

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

/**
 * Exchange Authorization Code for Access Token
 */
export const exchangeCodeForAccessToken = async (code: string) => {
  try {
    // Instructor ka exact dynamic URL query path reverse configuration ke sath
    const response = await axios.post(
      `https://api.aurinko.io/v1/auth/token/${code}`,
      {}, // Empty body jaisa instructor ne rakha tha
      {
        auth: {
          username: process.env.AURINKO_CLIENT_ID!,
          password: process.env.AURINKO_CLIENT_SECRET!,
        },
      }
    );

    return response.data as {
      accountId: number;
      accessToken: string;
      userId: string;
      userSession: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Aurinko Auth Error:', error.response?.data || error.message);
    } else {
      console.error('Aurinko Auth Error:', error);
    }
    throw new Error('Failed to exchange code for access token');
  }
};
/**
 * 3. Fetch Account Details using Access Token
 */
export const getAccountDetails = async (accessToken: string) => {
  try {
    const response = await axios.get('https://api.aurinko.io/v1/account', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data as {
      email: string;
      name: string;
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching account details:', error.response?.data || error.message);
    } else {
      console.error('Error fetching account details:', error);
    }
    throw new Error('Failed to fetch account details');
  }
};
