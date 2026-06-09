"use client"

import { api } from "@/trpc/react"
import { useLocalStorage } from "usehooks-ts"
import { useEffect } from "react"

export function useThreads() {
  // 1. Database se saare active accounts ki list fetch karein
  const { data: accounts } = api.account.getAccounts.useQuery()

  // Local storage states
  const [accountId, setAccountId] = useLocalStorage<string>("accountId", "")
  const [tab, setTab] = useLocalStorage<string>("normalhuman-tab", "inbox")
  const [selectedThreadId, setSelectedThreadId] = useLocalStorage<string>("selectedThreadId", "")

  // 2. Fallback Logic: Agar accountId khali hai ya database se match nahi ho rahi, to automatic auto-select karo
  useEffect(() => {
    if (accounts && accounts.length > 0) {
      const accountExists = accounts.some(acc => acc.id === accountId)
      
      if (!accountId || !accountExists) {
        // Jo 1 active account database mein pada hai (jaise 209825 ya 210344), use set kar do
        const firstId = accounts[0]?.id
        if (firstId) {
          setAccountId(firstId)
        }
      }
    }
  }, [accounts, accountId, setAccountId])

  // Live database se threads list fetch karna (tRPC query call)
  const { data: threads, isLoading, refetch } = api.account.getThreads.useQuery(
    {
      accountId: accountId ?? "",
      tab: tab ?? "inbox",
      done: tab === "done" // Agar done tab par hain to true, warna false
    },
    {
      // Sirf tabhi chalega jab valid accountId local storage/state mein set ho chuki ho
      enabled: !!accountId,
      placeholderData: (previousData) => previousData, // UI flicker ko rokne ke liye cache data hold rakhta ha
      refetchInterval: 5000 // Har 5 seconds baad auto background refresh
    }
  )

  // Jo thread user ne click kar ke select ki hui ha, uska poora data nikalna
  const thread = threads?.find((t) => t.id === selectedThreadId)

  return {
    threads,
    thread,              // Currently selected active single thread data
    isLoading,
    refetch,
    accountId,
    tab,
    setTab,
    selectedThreadId,
    setSelectedThreadId
  }
}