"use client"

import React from "react"
import { Inbox, File, Send } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { api } from "@/trpc/react"
import { cn } from "@/lib/utils"
import { useAccountSelection } from "@/hooks/use-account-selection"
import { useMailNavigation, type MailView } from "@/hooks/use-mail-navigation"
import { Nav } from "./nav"
import AskAI from "./AskAI"
import { SubscriptionPlanCard } from "./subscription-plan-card"
import { AccountSwitcher } from "./account-switcher"
import ThemeToggle from "@/components/theme-toggle"
import ComposeButton from "@/components/email-editor/compose-button"

interface SidebarProps {
  isCollapsed: boolean
}

function SidebarRoot({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="flex h-full min-w-0 flex-col overflow-hidden bg-sidebar text-sidebar-foreground"
    >
      {children}
    </div>
  )
}

function SidebarHeader({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean
  children: React.ReactNode
}) {
  return (
    <header
      className={cn(
        "shrink-0 border-b border-sidebar-border px-3 py-3",
        isCollapsed && "px-2",
      )}
    >
      {children}
    </header>
  )
}

function SidebarContent({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-10",
        isCollapsed && "px-1.5 pb-8",
      )}
    >
      {children}
    </div>
  )
}

function SidebarFooter({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean
  children: React.ReactNode
}) {
  return (
    <footer
      className={cn(
        "flex w-full min-w-0 shrink-0 flex-col gap-2 border-t border-sidebar-border px-3 pb-3 pt-8",
        isCollapsed && "px-2 pt-6",
      )}
    >
      {children}
    </footer>
  )
}

export function SideBar({ isCollapsed }: SidebarProps) {
  const { accountId } = useAccountSelection()
  const { view, setView } = useMailNavigation()

  const { data: inboxThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId ?? "", tab: "inbox" },
    { enabled: !!accountId },
  )
  const { data: draftThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId ?? "", tab: "draft" },
    { enabled: !!accountId },
  )
  const { data: sentThreads } = api.account.getNumThreads.useQuery(
    { accountId: accountId ?? "", tab: "sent" },
    { enabled: !!accountId },
  )

  return (
    <SidebarRoot isCollapsed={isCollapsed}>
      <SidebarHeader isCollapsed={isCollapsed}>
        <AccountSwitcher isCollapsed={isCollapsed} />
      </SidebarHeader>

      <SidebarContent isCollapsed={isCollapsed}>
        <Nav
          isCollapsed={isCollapsed}
          onTabChange={(id) => setView(id as MailView)}
          links={[
            {
              title: "Inbox",
              label: inboxThreads?.toString() ?? "0",
              icon: Inbox,
              variant: view === "inbox" ? "default" : "ghost",
              id: "inbox",
            },
            {
              title: "Drafts",
              label: draftThreads?.toString() ?? "0",
              icon: File,
              variant: view === "draft" ? "default" : "ghost",
              id: "draft",
            },
            {
              title: "Sent",
              label: sentThreads?.toString() ?? "0",
              icon: Send,
              variant: view === "sent" ? "default" : "ghost",
              id: "sent",
            },
          ]}
        />
      </SidebarContent>

      <SidebarFooter isCollapsed={isCollapsed}>
        <SubscriptionPlanCard isCollapsed={isCollapsed} />

        <div className="w-full min-w-0">
          <AskAI isCollapsed={isCollapsed} />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-sidebar-border pt-3">
          <UserButton />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ComposeButton />
          </div>
        </div>
      </SidebarFooter>
    </SidebarRoot>
  )
}
