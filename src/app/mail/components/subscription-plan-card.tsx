"use client"

import Image from "next/image"
import { useFormStatus } from "react-dom"
import { format } from "date-fns"
import { toast } from "sonner"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/actions"
import { FREE_CREDITS_PER_DAY } from "@/constants"

interface SubscriptionPlanCardProps {
  isCollapsed: boolean
}

function PlanButton({
  disabled,
  isPro,
}: {
  disabled: boolean
  isPro: boolean
}) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-caption font-semibold",
        "bg-primary text-primary-foreground shadow-token-xs",
        "transition-[background-color,opacity,transform] duration-200 ease-out",
        "hover:bg-primary/90 active:scale-[0.98]",
        "disabled:cursor-not-allowed disabled:opacity-60",
      )}
    >
      {pending
        ? "Loading..."
        : isPro
          ? "Manage subscription"
          : "Upgrade Plan"}
    </button>
  )
}

const cardSurfaceClass = cn(
  "relative flex w-full min-w-0 items-stretch overflow-hidden rounded-xl p-3",
  "border border-sidebar-border bg-sidebar-surface text-sidebar-foreground shadow-token-xs",
)

export function SubscriptionPlanCard({ isCollapsed }: SubscriptionPlanCardProps) {
  const { data, isLoading } = api.billing.getBillingSummary.useQuery(undefined, {
    enabled: !isCollapsed,
    refetchInterval: 30_000,
  })

  if (isCollapsed) {
    return null
  }

  if (isLoading || !data) {
    return (
      <div className="w-full min-w-0">
        <div className={cn(cardSurfaceClass, "h-28 animate-pulse")} />
      </div>
    )
  }

  const {
    isPro,
    messagesRemaining,
    currentPeriodEnd,
    billingAvailable,
  } = data

  const remaining = messagesRemaining ?? 0
  const usageRatio = isPro ? 1 : remaining / FREE_CREDITS_PER_DAY
  const atLimit = !isPro && remaining === 0

  const billingGuard = (event: React.FormEvent<HTMLFormElement>) => {
    if (!billingAvailable) {
      event.preventDefault()
      toast.error("Billing is not configured yet.")
    }
  }

  return (
    <div className="@container w-full min-w-0">
      <div className={cardSurfaceClass}>
        <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between gap-2.5 pr-1">
          <div className="min-w-0 space-y-1">
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-title font-semibold text-sidebar-foreground">
                {isPro ? "Pro Plan" : "Basic Plan"}
              </p>
              {!isPro && (
                <p className="truncate text-caption text-muted-foreground">
                  {remaining} / {FREE_CREDITS_PER_DAY} messages remaining
                </p>
              )}
            </div>

            <p className="text-caption leading-relaxed text-muted-foreground">
              {isPro
                ? "Unlimited AI questions across your inbox."
                : atLimit
                  ? "Daily limit reached. Upgrade for unlimited AI."
                  : "Upgrade to Pro for unlimited AI questions."}
            </p>

            {isPro && currentPeriodEnd && (
              <p className="text-label text-sidebar-muted">
                Renews {format(new Date(currentPeriodEnd), "MMM d, yyyy")}
              </p>
            )}
          </div>

          {!isPro && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500 ease-out",
                  atLimit ? "bg-amber-500" : "bg-primary",
                )}
                style={{ width: `${Math.max(usageRatio * 100, 4)}%` }}
              />
            </div>
          )}

          {isPro ? (
            <form action={createBillingPortalSession} onSubmit={billingGuard}>
              <PlanButton disabled={!billingAvailable} isPro={isPro} />
            </form>
          ) : (
            <form action={createCheckoutSession} onSubmit={billingGuard}>
              <PlanButton disabled={!billingAvailable} isPro={isPro} />
            </form>
          )}
        </div>

        <div className="relative hidden shrink-0 items-end self-stretch pl-1 @[240px]:flex">
          <Image
            src="/bot.webp"
            alt=""
            width={96}
            height={96}
            className="h-12 w-auto max-w-[3rem] object-contain object-bottom opacity-70"
            priority={false}
          />
        </div>
      </div>
    </div>
  )
}
