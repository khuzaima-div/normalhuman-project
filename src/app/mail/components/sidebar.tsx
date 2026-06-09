"use client"

import React from "react"
import { useLocalStorage } from "usehooks-ts"
import { Inbox, File, Send, Archive, Trash, AlertTriangle } from "lucide-react"
import { api } from "@/trpc/react"
import { Nav } from "./nav"

interface SidebarProps {
  isCollapsed: boolean
}

export function SideBar({ isCollapsed }: SidebarProps) {
  const [accountId] = useLocalStorage<string>("accountId", "")
  const [tab, setTab] = useLocalStorage<'inbox' | 'draft' | 'sent' | 'archive' | 'trash' | 'junk'>("normalhuman-tab", "inbox")

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
    <Nav
      isCollapsed={isCollapsed}
      onTabChange={(id: string) =>
        setTab(id as
          | 'inbox'
          | 'draft'
          | 'sent'
          | 'archive'
          | 'trash'
          | 'junk')
      }
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
        },
        {
          title: "Archive",
          label: "",
          icon: Archive,
          variant: tab === "archive" ? "default" : "ghost",
          id: "archive"
        },
        {
          title: "Junk",
          label: "",
          icon: AlertTriangle,
          variant: tab === "junk" ? "default" : "ghost",
          id: "junk"
        },
        {
          title: "Trash",
          label: "",
          icon: Trash,
          variant: tab === "trash" ? "default" : "ghost",
          id: "trash"
        }
      ]}
    />
  )
}