"use client"

import * as React from "react"
import { api } from "@/trpc/react"

const POLL_INTERVAL_MS = 30_000

function isAurinkoBillingError(message: string | undefined): boolean {
  if (!message) return false
  const lower = message.toLowerCase()
  return (
    lower.includes("payment required") ||
    lower.includes("aurinko payment") ||
    lower.includes("402")
  )
}

/**
 * Runs email sync on mount and every 30s in the background.
 * Aurinko billing (402) errors are logged quietly — existing Postgres data keeps rendering.
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
