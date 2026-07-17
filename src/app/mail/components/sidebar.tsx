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
import { BrandMark } from "@/components/brand-mark"

interface SidebarProps {
  isCollapsed: boolean
  onNavigate?: () => void
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

function SidebarNav({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "w-full min-w-0 shrink-0 px-2 pt-2 pb-3",
        isCollapsed && "px-1.5",
      )}
    >
      {children}
    </div>
  )
}

function SidebarLower({
  isCollapsed,
  children,
}: {
  isCollapsed: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden border-t border-sidebar-border px-3 pt-4",
        isCollapsed && "px-2 pt-3",
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
        "flex w-full min-w-0 shrink-0 flex-col border-t border-sidebar-border px-3 pb-3 pt-3",
        isCollapsed && "px-2",
      )}
    >
      {children}
    </footer>
  )
}

export function SideBar({ isCollapsed, onNavigate }: SidebarProps) {
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

  const handleTabChange = (id: string) => {
    setView(id as MailView)
    onNavigate?.()
  }

  return (
    <SidebarRoot isCollapsed={isCollapsed}>
      <SidebarHeader isCollapsed={isCollapsed}>
        {!isCollapsed ? (
          <div className="mb-3">
            <BrandMark size="sm" />
          </div>
        ) : null}
        <AccountSwitcher isCollapsed={isCollapsed} />
      </SidebarHeader>

      <SidebarNav isCollapsed={isCollapsed}>
        <Nav
          isCollapsed={isCollapsed}
          onTabChange={handleTabChange}
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
      </SidebarNav>

      <SidebarLower isCollapsed={isCollapsed}>
        {!isCollapsed ? (
          <>
            <div className="w-full min-w-0 shrink-0">
              <SubscriptionPlanCard isCollapsed={isCollapsed} />
            </div>

            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
              <AskAI isCollapsed={isCollapsed} />
            </div>
          </>
        ) : null}
      </SidebarLower>

      <SidebarFooter isCollapsed={isCollapsed}>
        <div className="flex items-center justify-between gap-2">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-9 w-9",
              },
            }}
          />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <ComposeButton />
          </div>
        </div>
      </SidebarFooter>
    </SidebarRoot>
  )
}
