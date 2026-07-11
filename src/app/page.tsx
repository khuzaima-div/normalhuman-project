import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import LinkAccountButton from "@/components/link-account-button";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Normal Human
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A calm, AI-powered email client. Connect your inbox to get started.
          </p>
        </div>

        <ul className="space-y-3 text-left text-sm text-muted-foreground">
          <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Ask AI questions about your emails with full context</span>
          </li>
          <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Search, compose, and manage threads in one place</span>
          </li>
        </ul>

        <LinkAccountButton />
      </div>
    </div>
  );
}
