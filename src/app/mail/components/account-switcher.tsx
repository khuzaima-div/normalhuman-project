"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAccountSelection } from "@/hooks/use-account-selection"
import { ChevronDown, Plus } from "lucide-react"
import { getAurinkoAuthUrl } from "@/lib/aurinko" 

interface AccountSwitcherProps {
  isCollapsed: boolean
}

export function AccountSwitcher({ isCollapsed }: AccountSwitcherProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const accountIdFromUrl = searchParams.get("accountId") ?? undefined
  const { accounts, accountId, setAccountId, loading: isLoading } = useAccountSelection(accountIdFromUrl)
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  React.useEffect(() => {
    if (!accounts || accounts.length === 0) return
    if (!accountIdFromUrl) return

    const accountExists = accounts.some((a) => String(a.id) === accountIdFromUrl)
    if (accountExists && accountId === accountIdFromUrl) {
      router.replace("/mail")
    }
  }, [accounts, accountId, accountIdFromUrl, router])

  const selectedAccount = accounts?.find((account) => String(account.id) === String(accountId))

  if (isLoading || !accounts) {
    return <div className={cn("bg-slate-100 dark:bg-zinc-900 animate-pulse rounded-lg", isCollapsed ? "h-9 w-9" : "h-10 w-full")} />
  }

  return (
    <div className="w-full min-w-0">
      <Select value={accountId} onValueChange={setAccountId}>
        {/* 🌟 SelectTrigger: Slate/white boundaries transformed to crisp Zinc dark borders */}
        <SelectTrigger className="flex items-center justify-between w-full transition-all outline-none border border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 p-2 rounded-xl text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
          <div className="flex items-center gap-2 min-w-0">
            {/* Minimalist Indigo Badge Adaptation */}
            <div className="h-5 w-5 rounded bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
              {selectedAccount?.emailAddress?.[0]?.toUpperCase() ?? "E"}
            </div>
            {!isCollapsed && (
              <span className="truncate text-left max-w-35 font-medium">
                {selectedAccount?.emailAddress || "Select Account"}
              </span>
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500 shrink-0 ml-1" />
        </SelectTrigger>

        {/* 🌟 SelectContent: Elite Floating Dropdown Card styling */}
        <SelectContent className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-900 rounded-xl p-1 shadow-lg dark:shadow-zinc-950/50 min-w-50">
          {accounts.map((account) => (
            <SelectItem 
              key={account.id} 
              value={account.id} 
              className="text-xs rounded-lg cursor-pointer py-2 pl-3 text-zinc-700 dark:text-zinc-300 focus:bg-zinc-100 focus:text-zinc-950 dark:focus:bg-zinc-900 dark:focus:text-zinc-50"
            >
              {account.emailAddress}
            </SelectItem>
          ))}
          
          {/* Action Row: Add Account Link */}
          <div 
            onClick={async () => {
              if (isRedirecting) return
              try {
                setIsRedirecting(true)
                const authUrl = await getAurinkoAuthUrl('Google')
                if (authUrl) window.location.href = authUrl
              } catch (error) {
                console.error(error)
                setIsRedirecting(false)
              }
            }}
            className="flex items-center gap-2 px-3 py-2 mt-1 text-xs border-t border-slate-100 dark:border-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="font-medium">Add Account</span>
          </div>
        </SelectContent>
      </Select>
    </div>
  )  
}