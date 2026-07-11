import "@/styles/globals.css";
import { type Metadata } from "next";
import { Figtree } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider";
import { ThreadProvider } from "@/hooks/use-thread";
import KBar from "./mail/components/kbar";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Normal Human",
  description: "A calm, AI-powered email client",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <Providers>
        <html lang="en" className={`${figtree.variable} font-sans h-full w-full`} suppressHydrationWarning>
          <body className={`${figtree.className} h-full w-full overflow-hidden antialiased`}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={true}
              disableTransitionOnChange
            >
              <ThreadProvider>
                <KBar>
                  {children}
                  <Toaster />
                </KBar>
              </ThreadProvider>
            </ThemeProvider>
          </body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}
