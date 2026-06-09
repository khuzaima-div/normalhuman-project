"use server"

import axios from 'axios'
import { auth } from "@clerk/nextjs/server";

/**
 * 1. Generate Aurinko Authorization URL
 */
export const getAurinkoAuthUrl = async (serviceType: 'Google' | 'Office365') => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const params = new URLSearchParams({
    clientId: process.env.AURINKO_CLIENT_ID as string,
    serviceType: serviceType,
    scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
    responseType: 'code',
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/aurinko/callback`,
    userUserId: userId, // Callback route mein Clerk ID track karne ke liye
  });

  return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;
};

/**
 * 2. Exchange Authorization Code for Access Token
 */
export const exchangeCodeForAccessToken = async (code: string) => {
  try {
    // Instructor ka exact dynamic URL query path reverse configuration ke sath
    const response = await axios.post(
      `https://api.aurinko.io/v1/auth/token/${code}`,
      {}, // Empty body jaisa instructor ne rakha tha
      {
        auth: {
          username: process.env.AURINKO_CLIENT_ID as string,
          password: process.env.AURINKO_CLIENT_SECRET as string,
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
