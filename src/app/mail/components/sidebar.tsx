"use client"

import React from "react"
import { useLocalStorage } from "usehooks-ts"
import { Inbox, File, Send } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { api } from "@/trpc/react"
import { useAccountSelection } from "@/hooks/use-account-selection"
import { Nav } from "./nav"
import AskAI from "./AskAI"
import { AccountSwitcher } from "./account-switcher"
import ThemeToggle from "@/components/theme-toggle"
import ComposeButton from "@/components/email-editor/compose-button"

interface SidebarProps {
  isCollapsed: boolean
}

export function SideBar({ isCollapsed }: SidebarProps) {
  const { accountId } = useAccountSelection()
  const [tab, setTab] = useLocalStorage<'inbox' | 'draft' | 'sent'>("normalhuman-tab", "inbox")

  const { data: inboxThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId ?? "", tab: "inbox" },
    { enabled: !!accountId }
  )
  const { data: draftThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId ?? "", tab: "draft" },
    { enabled: !!accountId }
  )
  const { data: sentThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId ?? "", tab: "sent" },
    { enabled: !!accountId }
  )

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden bg-white transition-colors duration-300 dark:bg-zinc-950">
      <div className="flex flex-1 min-h-0 flex-col px-3 pb-2 pt-3">
        <div className="shrink-0">
          <AccountSwitcher isCollapsed={isCollapsed} />
        </div>

        <div className="mt-3 flex-1 min-h-0 overflow-y-auto">
          <Nav
            isCollapsed={isCollapsed}
            onTabChange={(id: string) => setTab(id as 'inbox' | 'draft' | 'sent')}
            links={[
              {
                title: "Inbox",
                label: inboxThreads?.toString() ?? "0",
                icon: Inbox,
                variant: tab === "inbox" ? "default" : "ghost",
                id: "inbox"
              },
              {
                title: "Draft",
                label: draftThreads?.toString() ?? "0",
                icon: File,
                variant: tab === "draft" ? "default" : "ghost",
                id: "draft"
              },
              {
                title: "Sent",
                label: sentThreads?.toString() ?? "0",
                icon: Send,
                variant: tab === "sent" ? "default" : "ghost",
                id: "sent"
              }
            ]}
          />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200/80 px-3 pb-3 pt-3 dark:border-zinc-900/80">
        <AskAI isCollapsed={isCollapsed} />

        <div className="flex items-center justify-between gap-2 border-t border-slate-200/70 pt-3 dark:border-zinc-900/70">
          <UserButton />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ComposeButton />
          </div>
        </div>
      </div>
    </div>
  )
}