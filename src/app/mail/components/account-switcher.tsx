"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/trpc/react" 
import { useLocalStorage } from "usehooks-ts" 
import { ChevronDown, Plus } from "lucide-react"
import { getAurinkoAuthUrl } from "@/lib/aurinko" 

interface AccountSwitcherProps {
  isCollapsed: boolean
}

interface AccountType {
  id: string
  emailAddress: string
  name: string | null
}

export function AccountSwitcher({ isCollapsed }: AccountSwitcherProps) {
  const { data: accounts, isLoading } = api.account.getAccounts.useQuery()
  const [accountId, setAccountId] = useLocalStorage<string>("accountId", "")
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  React.useEffect(() => {
    if (accounts && accounts.length > 0) {
      const accountExists = accounts.some((a) => a.id === accountId)
      if (!accountId || !accountExists) {
        const firstId = accounts?.[0]?.id
        if (firstId) setAccountId(firstId)
      }
    }
  }, [accounts, accountId, setAccountId])

  const selectedAccount = accounts?.find((account: AccountType) => account.id === accountId)

  if (isLoading || !accounts) {
    return (
      <div className={cn(
        "bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg",
        isCollapsed ? "h-9 w-9" : "h-10 w-full"
      )} />
    )
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      <Select value={accountId} onValueChange={setAccountId}>
        <SelectTrigger
          className={cn(
            "flex items-center justify-between w-full transition-all duration-200 outline-none border-none focus:ring-0 focus:ring-offset-0 bg-transparent text-slate-700 dark:text-slate-200 group font-medium",
            isCollapsed 
              ? "h-9 w-9 p-0 justify-center mx-auto hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg" 
              : "h-10 px-2 hover:bg-slate-100/80 dark:hover:bg-slate-900/60 rounded-xl"
          )}
          aria-label="Select account"
        >
          <div className={cn("flex items-center gap-2 min-w-0", isCollapsed && "justify-center")}>
            <div className="h-5 w-5 rounded bg-indigo-50 dark:bg-teal-500/10 border border-indigo-100 dark:border-teal-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-teal-400 shrink-0">
              {selectedAccount?.name?.[0]?.toUpperCase() ?? "E"}
            </div>
            
            {!isCollapsed && (
              // 🌟 FIXED TS WARNING: mapped max-w bracket to tailwind variable safely cast type safely bypassing warnings
              <span className="text-xs truncate text-left font-medium text-slate-600 dark:text-slate-300 max-w-37.5">
                <SelectValue placeholder="Select account">
                  {selectedAccount?.emailAddress}
                </SelectValue>
              </span>
            )}
          </div>

          {!isCollapsed && (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0 ml-1" />
          )}
        </SelectTrigger>

        {/* 🌟 FIXED THEME MISMATCH: isolates dark variables within the content itself on dynamic render bypassing Root Layout limitations */}
        <SelectContent 
          side="bottom" 
          align={isCollapsed ? "center" : "start"}
          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 p-1 min-w-52.5 max-w-70 shadow-lg Backdrop-blur-md"
        >
          {accounts.map((account: AccountType) => (
            <SelectItem
              key={account.id}
              value={account.id}
              className="text-xs rounded-lg cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-slate-100 transition-colors py-2 pl-3 items-center gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  {account.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="font-medium truncate max-w-40">{account.emailAddress}</span>
              </div>
            </SelectItem>
          ))}

          <div 
            onClick={async () => {
              if (isRedirecting) return
              try {
                setIsRedirecting(true)
                const authUrl = await getAurinkoAuthUrl('Google')
                if (authUrl) {
                  window.location.href = authUrl
                }
              } catch (error) {
                console.error("Error generating auth url:", error)
                setIsRedirecting(false)
              }
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 mt-1 text-xs font-medium border-t border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-900/50 rounded-lg cursor-pointer transition-colors",
              isRedirecting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className={cn("h-3.5 w-3.5 stroke-[2.5]", isRedirecting && "animate-spin")} />
            <span>{isRedirecting ? "Connecting Google..." : "Add Account"}</span>
          </div>
        </SelectContent>
      </Select>
    </div>
  )  
}