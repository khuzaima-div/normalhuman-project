"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { useAccountSelection } from "@/hooks/use-account-selection"
import { Plus } from "lucide-react"

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
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg bg-muted",
          isCollapsed ? "h-11 w-11" : "h-10 w-full",
        )}
      />
    )
  }

  return (
    <div className="w-full min-w-0">
      <Select value={accountId} onValueChange={setAccountId}>
        <SelectTrigger
          className={cn(
            "w-full border-border bg-sidebar-surface shadow-token-xs transition-[background-color,border-color,box-shadow] duration-200 hover:bg-muted/50",
            isCollapsed ? "h-11 justify-center px-2" : "h-10 px-2.5",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
              {selectedAccount?.emailAddress?.[0]?.toUpperCase() ?? "E"}
            </div>
            {!isCollapsed && (
              <span className="truncate text-left text-caption font-medium">
                {selectedAccount?.emailAddress || "Select Account"}
              </span>
            )}
          </div>
        </SelectTrigger>

        <SelectContent className="min-w-52">
          {accounts.map((account) => (
            <SelectItem
              key={account.id}
              value={account.id}
              className="cursor-pointer text-caption"
            >
              {account.emailAddress}
            </SelectItem>
          ))}

          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isRedirecting) return
              setIsRedirecting(true)
              window.location.href = "/api/aurinko/auth?serviceType=Google"
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                if (isRedirecting) return
                setIsRedirecting(true)
                window.location.href = "/api/aurinko/auth?serviceType=Google"
              }
            }}
            className="mt-1 flex cursor-pointer items-center gap-2 border-t border-border px-3 py-2.5 text-caption text-muted-foreground transition-colors duration-150 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="font-medium">
              {accounts.length > 0 ? "Reconnect / Add Gmail" : "Add Account"}
            </span>
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}
