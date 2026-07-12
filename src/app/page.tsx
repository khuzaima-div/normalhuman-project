import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LinkAccountButton from "@/components/link-account-button";
import { BrandMark } from "@/components/brand-mark";
import { db } from "@/server/db";
import { Mail, Sparkles } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const accounts = await db.account.findMany({
    where: { userId },
    select: { id: true },
  });

  if (accounts.length > 0) {
    redirect("/mail");
  }

  return (
    <div className="brand-mesh relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-10 text-center">
        <div className="flex flex-col items-center space-y-4">
          <BrandMark size="lg" showWordmark={false} />
          <div className="space-y-2">
            <h1 className="text-display font-semibold tracking-tight text-foreground">
              Normal Human
            </h1>
            <p className="mx-auto max-w-xs text-body leading-relaxed text-muted-foreground">
              A calm, AI-powered email client. Connect your inbox to get started.
            </p>
          </div>
        </div>

        <ul className="space-y-2 text-left">
          <li className="flex items-start gap-3 px-1 py-2 text-body text-muted-foreground">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Ask AI questions about your emails with full context</span>
          </li>
          <li className="flex items-start gap-3 px-1 py-2 text-body text-muted-foreground">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Search, compose, and manage threads in one place</span>
          </li>
        </ul>

        <LinkAccountButton />
      </div>
    </div>
  );
}
