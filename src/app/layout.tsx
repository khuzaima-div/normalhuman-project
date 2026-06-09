import "../styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Normal Human AI",
  description: "The Minimalist AI-Powered Email Client",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <Providers>
        <html lang="en" className={`${geist.variable} h-full w-full`}> 
          <body className="antialiased h-full w-full overflow-hidden m-0 p-0">{children}</body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}