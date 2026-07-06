"use client"

import { api } from "@/trpc/react"
import { useLocalStorage } from "usehooks-ts"
import { useEffect } from "react"

export function useAccountSelection(accountIdFromQuery?: string) {
  const { data: accounts, isLoading: accountsLoading } = api.account.getAccounts.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  const [storedAccountId, setStoredAccountId] = useLocalStorage<string>("accountId", "")
  const currentStoredId = String(storedAccountId || "")
  const effectiveAccountId = accounts?.some((acc) => String(acc.id) === currentStoredId)
    ? currentStoredId
    : String(accounts?.[0]?.id || "")

  useEffect(() => {
    if (!accounts || accounts.length === 0) return

    const queryId = accountIdFromQuery ? String(accountIdFromQuery).trim() : ""
    const queryAccountExists = queryId ? accounts.some((acc) => String(acc.id) === queryId) : false

    if (queryId && queryAccountExists && queryId !== currentStoredId) {
      setStoredAccountId(queryId)
      return
    }

    if (effectiveAccountId && effectiveAccountId !== currentStoredId) {
      setStoredAccountId(effectiveAccountId)
    }
  }, [accounts, accountIdFromQuery, currentStoredId, effectiveAccountId, setStoredAccountId])

  return {
    accounts: accounts || [],
    accountId: effectiveAccountId,
    setAccountId: setStoredAccountId,
    loading: accountsLoading,
  }
}
