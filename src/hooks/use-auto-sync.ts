"use client"

import * as React from "react"
import { toast } from "sonner"
import { api } from "@/trpc/react"

const POLL_INTERVAL_MS = 30_000
const AURINKO_GOOGLE_AUTH = "/api/aurinko/auth?serviceType=Google"

function isAurinkoBillingError(message: string | undefined): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return (
    lower.includes("payment required") ||
    lower.includes("aurinko payment") ||
    lower.includes("402")
  )
}

function isAurinkoAuthError(message: string | undefined): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return (
    lower.includes("authorization failed") ||
    lower.includes("reconnect your email") ||
    lower.includes("401") ||
    lower.includes("403")
  )
}

function isAurinkoNetworkError(message: string | undefined): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return (
    lower.includes("cannot reach aurinko") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("network/vpn")
  )
}

function showReconnectToast() {
  toast.error("Email connection expired. Reconnect to sync new mail.", {
    id: "aurinko-reconnect",
    duration: 12_000,
    action: {
      label: "Reconnect",
      onClick: () => {
        window.location.href = AURINKO_GOOGLE_AUTH
      },
    },
  })
}

/**
 * Runs email sync on mount and every 30s in the background.
 * Aurinko billing (402) errors are logged quietly — existing Postgres data keeps rendering.
 * Auth failures surface a reconnect CTA.
 */
export function useAutoSync(accountId: string | undefined) {
  const utils = api.useUtils()
  const inFlight = React.useRef(false)

  const syncNow = api.mail.syncNow.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.account.getAccounts.invalidate(),
        utils.account.getThreads.invalidate(),
        utils.account.getNumThreads.invalidate(),
      ])
    },
    onError: (error) => {
      if (isAurinkoBillingError(error.message)) {
        console.warn(
          "[auto-sync] Aurinko billing blocked sync; keeping existing inbox data.",
          error.message,
        )
        return
      }
      if (isAurinkoNetworkError(error.message)) {
        console.warn("[auto-sync] Aurinko unreachable:", error.message)
        toast.error(error.message, {
          id: "aurinko-network",
          duration: 10_000,
        })
        return
      }
      if (isAurinkoAuthError(error.message)) {
        console.warn("[auto-sync] Aurinko auth failed:", error.message)
        showReconnectToast()
        return
      }
      console.warn("[auto-sync] Background sync failed:", error.message)
    },
  })

  const mutateRef = React.useRef(syncNow.mutate)
  mutateRef.current = syncNow.mutate

  React.useEffect(() => {
    if (!accountId) return

    const runSync = () => {
      if (inFlight.current) return
      inFlight.current = true
      mutateRef.current(
        { accountId },
        {
          onSettled: () => {
            inFlight.current = false
          },
        },
      )
    }

    runSync()
    const timer = window.setInterval(runSync, POLL_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [accountId])
}
