"use client"

import * as React from "react"
import { usePanelRef } from "react-resizable-panels"
import { ArrowLeft, Mail, Menu } from "lucide-react"
import { useMediaQuery } from "usehooks-ts"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import { SideBar } from "./components/sidebar"
import { useThreads } from "@/hooks/use-threads"
import { useThread } from "@/hooks/use-thread"
import { ThreadDisplay } from "./components/thread-display"
import SearchBar, { isSearchingAtom, searchResultsAtom } from "./components/search/SearchBar"
import { useAtom } from "jotai"
import { PanelHeader } from "@/components/mail/panel-header"
import { InboxDoneToggle } from "@/components/mail/inbox-done-toggle"
import { ThreadListItem } from "@/components/mail/thread-list-item"
import { EmptyState } from "@/components/mail/empty-state"
import { ThreadListSkeleton } from "@/components/mail/loading-skeleton"
import type { OramaEmailDocument, OramaSearchHit } from "@/types"
import { toast } from "sonner"
import { useAutoSync } from "@/hooks/use-auto-sync"

interface MailProps {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize?: number | string
  accountLimitReached?: boolean
}

const DEFAULT_LAYOUT: [number, number, number] = [20, 32, 48]

const VIEW_TITLES = {
  inbox: "Inbox",
  draft: "Drafts",
  sent: "Sent",
} as const

const getSafeLayoutValue = (layout: number[] | undefined, index: 0 | 1 | 2): number => {
  const value = layout?.[index]
  return typeof value === "number" && !Number.isNaN(value) ? value : DEFAULT_LAYOUT[index]
}

const normalizeSize = (size: number | string | undefined): number | string => {
  if (typeof size === "number") {
    return size > 0 && size <= 100 ? `${size}%` : size
  }
  return size ?? "auto"
}

const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })

function ThreadListPanel({
  headerTitle,
  view,
  isSearching,
  searchResults,
  isLoading,
  isSyncing,
  threads,
  threadId,
  setThreadId,
  listRef,
}: {
  headerTitle: string
  view: string
  isSearching: boolean
  searchResults: { hits?: OramaSearchHit[] } | null
  isLoading: boolean
  isSyncing: boolean
  threads: ReturnType<typeof useThreads>["threads"]
  threadId: string | null
  setThreadId: (id: string | null) => void
  listRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <>
      <div className="shrink-0 border-b border-border bg-thread-list-header">
        <PanelHeader title={headerTitle}>
          <div className="flex items-center gap-2">
            {view === "inbox" && <InboxDoneToggle />}
          </div>
        </PanelHeader>
        <SearchBar />
      </div>

      <div
        ref={listRef}
        className="scrollbar-elegant flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4"
        role="listbox"
        aria-label="Thread list"
      >
        {isSearching ? (
          searchResults?.hits?.length ? (
            <div className="space-y-2">
              <p className="px-1 pb-1 text-caption font-medium text-muted-foreground">
                Found {searchResults.hits.length} results
              </p>
              {(searchResults.hits as OramaSearchHit[]).map((hit) => {
                const email = hit.document as OramaEmailDocument
                return (
                  <ThreadListItem
                    key={hit.id}
                    subject={email.title ?? "No subject"}
                    senderName={email.from ?? "Unknown sender"}
                    preview={email.body ?? ""}
                    date={email.sentAt ? formatDate(email.sentAt) : "—"}
                    selected={threadId === email.threadId}
                    onClick={() => setThreadId(email.threadId)}
                  />
                )
              })}
            </div>
          ) : (
            <EmptyState
              title="No results"
              description="Try a different search term."
            />
          )
        ) : isLoading ? (
          <ThreadListSkeleton />
        ) : isSyncing && threads.length === 0 ? (
          <EmptyState
            title="Syncing your inbox"
            description="Your emails are being imported. This may take a minute."
          />
        ) : threads.length > 0 ? (
          <div className="space-y-2">
            {threads.map((thread) => {
              const latestEmail = thread.emails?.at(-1)
              return (
                <ThreadListItem
                  key={thread.id}
                  subject={thread.subject ?? "No subject"}
                  senderName={
                    latestEmail?.from?.name ||
                    latestEmail?.from?.address ||
                    "Unknown sender"
                  }
                  preview={latestEmail?.bodySnippet ?? ""}
                  date={
                    latestEmail?.sentAt
                      ? formatDate(latestEmail.sentAt)
                      : "—"
                  }
                  selected={threadId === thread.id}
                  onClick={() => setThreadId(thread.id)}
                />
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={Mail}
            title={`No ${headerTitle.toLowerCase()} yet`}
            description="New messages will appear here once synced."
          />
        )}
      </div>
    </>
  )
}

export function MailShell({
  defaultLayout,
  defaultCollapsed = false,
  navCollapsedSize = 4,
  accountLimitReached = false,
}: MailProps) {
  const { threads, view, isLoading, account, accountId } = useThreads()
  const [threadId, setThreadId] = useThread()
  const [isSearching] = useAtom(isSearchingAtom)
  const [searchResults] = useAtom(searchResultsAtom)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useAutoSync(accountId)

  const selectedThread = threads.find((thread) => thread.id === threadId) ?? null
  const [isMounted, setIsMounted] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const sidebarRef = usePanelRef()
  const listRef = React.useRef<HTMLDivElement>(null)

  const headerTitle = VIEW_TITLES[view as keyof typeof VIEW_TITLES] ?? "Inbox"

  React.useEffect(() => setIsMounted(true), [])

  React.useEffect(() => {
    if (!accountLimitReached) return
    toast.error("Account limit reached. Upgrade your plan to link another inbox.")
  }, [accountLimitReached])

  React.useEffect(() => {
    if (defaultCollapsed) sidebarRef.current?.collapse()
    setIsCollapsed(sidebarRef.current?.isCollapsed() ?? false)
  }, [defaultCollapsed, isMounted, sidebarRef])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "")) {
        return
      }
      if (!threads.length) return

      const currentIndex = threads.findIndex((t) => t.id === threadId)

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault()
        const next = threads[Math.min(currentIndex + 1, threads.length - 1)]
        if (next) setThreadId(next.id)
      }
      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault()
        const prev = threads[Math.max(currentIndex - 1, 0)]
        if (prev) setThreadId(prev.id)
      }
      if (e.key === "Enter" && currentIndex >= 0) {
        e.preventDefault()
      }
      if (e.key === "Escape") {
        setThreadId(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [threads, threadId, setThreadId])

  const layout = {
    sidebar: getSafeLayoutValue(defaultLayout, 0),
    threads: getSafeLayoutValue(defaultLayout, 1),
    preview: getSafeLayoutValue(defaultLayout, 2),
  }

  const collapsedSize = normalizeSize(navCollapsedSize)

  if (!isMounted) return null

  const isSyncing = account?.syncStatus === "syncing"

  const threadListProps = {
    headerTitle,
    view,
    isSearching,
    searchResults,
    isLoading,
    isSyncing,
    threads,
    threadId,
    setThreadId,
    listRef,
  }

  if (isMobile) {
    const showDetail = Boolean(threadId && selectedThread)

    return (
      <TooltipProvider delayDuration={0}>
        <div className="fixed inset-0 flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DrawerContent className="max-h-[85vh] border-border bg-sidebar p-0">
              <DrawerTitle className="sr-only">Navigation</DrawerTitle>
              <div className="h-[min(80vh,640px)] overflow-hidden">
                <SideBar isCollapsed={false} onNavigate={() => setMobileNavOpen(false)} />
              </div>
            </DrawerContent>
          </Drawer>

          {!showDetail ? (
            <div className="flex h-full min-h-0 flex-col bg-thread-list">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-thread-list-header px-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" />
                </Button>
                <h1 className="text-title font-semibold tracking-tight text-foreground">
                  {headerTitle}
                </h1>
              </div>
              <ThreadListPanel {...threadListProps} />
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col bg-preview">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-surface-1 px-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  onClick={() => setThreadId(null)}
                  aria-label="Back to thread list"
                >
                  <ArrowLeft className="size-5" />
                </Button>
                <p className="min-w-0 truncate text-title font-medium text-foreground">
                  {selectedThread?.subject ?? "Message"}
                </p>
              </div>
              <div className="min-h-0 flex-1">
                <ThreadDisplay threadId={selectedThread!.id} />
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed inset-0 flex h-screen w-screen items-stretch overflow-hidden bg-background text-foreground">
        <ResizablePanelGroup
          direction="horizontal"
          defaultLayout={layout}
          onLayoutChanged={(nextLayout) => {
            const layoutValues = [nextLayout.sidebar, nextLayout.threads, nextLayout.preview]
            document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(layoutValues)}; path=/`
          }}
          className="h-full w-full items-stretch"
        >
          <ResizablePanel
            id="sidebar"
            panelRef={sidebarRef}
            defaultSize={normalizeSize(layout.sidebar)}
            collapsedSize={collapsedSize}
            collapsible
            minSize="15%"
            maxSize="25%"
            onResize={() => setIsCollapsed(sidebarRef.current?.isCollapsed() ?? false)}
            className="flex h-full flex-col overflow-hidden border-r border-border bg-sidebar"
          >
            <SideBar isCollapsed={isCollapsed} />
          </ResizablePanel>

          <ResizableHandle withHandle className="w-px bg-border transition-colors hover:bg-border/80" />

          <ResizablePanel
            id="threads"
            defaultSize={normalizeSize(layout.threads)}
            minSize="25%"
            maxSize="40%"
            className="flex h-full flex-col overflow-hidden border-r border-border bg-thread-list"
          >
            <ThreadListPanel {...threadListProps} />
          </ResizablePanel>

          <ResizableHandle className="relative w-0 bg-transparent after:w-2" />

          <ResizablePanel
            id="preview"
            defaultSize={normalizeSize(layout.preview)}
            minSize="30%"
            className="bg-preview"
          >
            {threadId && selectedThread ? (
              <ThreadDisplay threadId={selectedThread.id} />
            ) : (
              <EmptyState
                icon={Mail}
                title="No message selected"
                description="Choose a thread from the list, or press j/k to navigate."
                className="h-full"
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}

export default MailShell
