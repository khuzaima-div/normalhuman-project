import "../styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { ThemeProvider } from "@/components/theme-provider"; // 👈 ThemeProvider Import kiya
import { ThreadProvider } from "@/hooks/use-thread";
import KBar from "./mail/components/kbar";
import { Toaster } from "@/components/ui/sonner"
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
        {/* 🌟 suppressHydrationWarning lagana lazmi ha taake theme flash ke errors na aayin */}
        <html lang="en" className={`${geist.variable} h-full w-full`} suppressHydrationWarning>
          <body className="antialiased h-full w-full overflow-hidden m-0 p-0 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300">
            <ThemeProvider
              attribute="class"       // 👈 Yeh sabse important line ha jo pure app ko dark utility deti ha
              defaultTheme="dark"     // 👈 Premium look ke liye pehli baar dark auto-load hoga
              enableSystem={true}
              disableTransitionOnChange
            >
                <ThreadProvider>
                  <KBar>
                    {children}
                    <Toaster/>
                  </KBar>
                </ThreadProvider>
              </ThemeProvider>
          </body>
        </html>
      </Providers>
    </ClerkProvider>
  );
}