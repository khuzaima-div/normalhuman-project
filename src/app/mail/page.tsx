import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/server/db"
import { MailErrorBoundary } from "@/components/mail/error-boundary"
import Mail from "./mail"

export default async function MailDashboard({
  searchParams,
}: {
  searchParams: Promise<{ accountLimit?: string; accountId?: string }>
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const accounts = await db.account.findMany({
    where: { userId },
    select: { id: true },
  })

  if (accounts.length === 0) {
    redirect("/")
  }

  const params = await searchParams

  return (
    <MailErrorBoundary>
      <Mail
        defaultLayout={[20, 32, 48]}
        defaultCollapsed={false}
        navCollapsedSize={4}
        accountLimitReached={params.accountLimit === "reached"}
      />
    </MailErrorBoundary>
  )
}
