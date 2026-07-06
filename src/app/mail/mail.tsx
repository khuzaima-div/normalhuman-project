"use client"

import * as React from "react"
import { usePanelRef } from "react-resizable-panels"
import { cn } from "../../lib/utils"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../components/ui/resizable"
import { Separator } from "../../components/ui/separator"
import { TooltipProvider } from "../../components/ui/tooltip"
import { SideBar } from "./components/sidebar"
import { useThreads } from "../../hooks/use-threads"
import { ThreadDisplay } from "./components/thread-display"

// ✨ Orama aur Search Bar ki integration ke liye imports
import SearchBar, { isSearchingAtom, searchResultsAtom } from "./SearchBar"
import { useAtom } from "jotai"


interface MailProps {
  defaultLayout?: number[]
  defaultCollapsed?: boolean
  navCollapsedSize?: number | string
}

const DEFAULT_LAYOUT: [number, number, number] = [20, 32, 48]

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

export function Mail({ defaultLayout, defaultCollapsed = false, navCollapsedSize = 4 }: MailProps) {
  const { threads, isLoading, tab, setTab, selectedThreadId, setSelectedThreadId } = useThreads()
  const [selectedEmailId, setSelectedEmailId] = React.useState<string | null>(null)
  
  // ✨ Jotai States for Search
  const [isSearching] = useAtom(isSearchingAtom)
  const [searchResults] = useAtom(searchResultsAtom)

  const selectedThread = threads.find((thread) => thread.id === selectedThreadId) ?? null
  const selectedEmail = selectedThread?.emails?.find((email) => email.id === selectedEmailId) ?? null
  const [isMounted, setIsMounted] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const sidebarRef = usePanelRef()

  React.useEffect(() => setIsMounted(true), [])

  React.useEffect(() => {
    if (defaultCollapsed) sidebarRef.current?.collapse()
    setIsCollapsed(sidebarRef.current?.isCollapsed() ?? false)
  }, [defaultCollapsed, isMounted, sidebarRef])

  const layout = {
    sidebar: getSafeLayoutValue(defaultLayout, 0),
    threads: getSafeLayoutValue(defaultLayout, 1),
    preview: getSafeLayoutValue(defaultLayout, 2),
  }

  const collapsedSize = normalizeSize(navCollapsedSize)

  if (!isMounted) return null

  return (
    <TooltipProvider delayDuration={0}>
      <div className="fixed inset-0 flex h-screen w-screen items-stretch overflow-hidden bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50 select-none transition-colors duration-300">
        <ResizablePanelGroup
          direction="horizontal"
          defaultLayout={layout}
          onLayoutChanged={(nextLayout) => {
            const layoutValues = [nextLayout.sidebar, nextLayout.threads, nextLayout.preview]
            document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(layoutValues)}; path=/`
          }}
          className="items-stretch h-full w-full"
        >
          {/* 🌟 Panel 1: Sidebar Container */}
          <ResizablePanel
            id="sidebar"
            panelRef={sidebarRef}
            defaultSize={normalizeSize(layout.sidebar)}
            collapsedSize={collapsedSize}
            collapsible
            minSize="15%"
            maxSize="25%"
            onResize={() => setIsCollapsed(sidebarRef.current?.isCollapsed() ?? false)}
            className="border-r border-slate-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out"
          >
            <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-zinc-950">
              <SideBar isCollapsed={isCollapsed} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 dark:bg-zinc-900 w-px transition-colors" />

          {/* 🌟 Panel 2: Threads List & Search Wrapper */}
          <ResizablePanel id="threads" defaultSize={normalizeSize(layout.threads)} minSize="25%" maxSize="40%" className="bg-white dark:bg-zinc-950">
            <div className="flex h-14 items-center justify-between bg-white dark:bg-zinc-950 px-4 py-2 shrink-0">
              <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100">Inbox</h1>
              <div className="ml-auto flex items-center rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
                <button onClick={() => setTab("inbox")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", tab === "inbox" ? "bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400")}>Inbox</button>
                <button onClick={() => setTab("done")} className={cn("px-3 py-1.5 text-xs rounded-md transition-all", tab === "done" ? "bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-400")}>Done</button>
              </div>
            </div>
            <Separator className="dark:bg-zinc-900" />

            {/* ✨ SearchBar Injection */}
            <SearchBar />
            <Separator className="dark:bg-zinc-900" />

            {/* Main Content Area */}
            <div className="h-[calc(100vh-7rem)] overflow-y-auto p-4 bg-zinc-50/40 dark:bg-zinc-950/20 space-y-3">
              {isSearching ? (
                // 🔍 ORAMA SEARCH LIST VIEW
                searchResults && searchResults.hits && searchResults.hits.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground px-1 font-medium">Found {searchResults.hits.length} matching items</p>
                    {searchResults.hits.map((hit: any) => {
                      const email = hit.document
                      const selected = selectedThreadId === email.threadId

                      return (
                        <button
                          key={hit.id}
                          type="button"
                          onClick={() => setSelectedThreadId(email.threadId)}
                          className={cn(
                            "w-full rounded-xl border p-4 text-left transition-all duration-200",
                            selected 
                              ? "border-slate-300 bg-slate-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80" 
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 dark:hover:border-zinc-800"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                <span className="truncate">{email.title ?? "No subject"}</span>
                              </div>
                              <div className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">{email.from || "Unknown sender"}</div>
                            </div>
                            <div className="text-xs text-slate-400 dark:text-zinc-500">
                              {email.sentAt ? new Date(email.sentAt).toLocaleDateString() : "—"}
                            </div>
                          </div>
                          <p className="mt-2.5 text-sm leading-5 text-slate-600 dark:text-zinc-400 line-clamp-2">{email.body ?? "No preview available."}</p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-zinc-500">
                    No matching messages found in search index.
                  </div>
                )
              ) : (
                // 📥 STANDARD INBOX / DONE LISTS
                threads && threads.length > 0 ? (
                  <div className="space-y-3">
                    {threads.map((thread) => {
                      const latestEmail = thread.emails?.at(-1)
                      const selected = selectedThreadId === thread.id

                      return (
                        <button
                          key={thread.id}
                          type="button"
                          onClick={() => setSelectedThreadId(thread.id)}
                          className={cn(
                            "w-full rounded-xl border p-4 text-left transition-all duration-200",
                            selected 
                              ? "border-slate-300 bg-slate-50 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/80" 
                              : "border-slate-200 bg-white hover:border-slate-300 dark:border-zinc-900 dark:bg-zinc-900/30 dark:hover:bg-zinc-900/50 dark:hover:border-zinc-800"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                <span className="truncate">{thread.subject ?? "No subject"}</span>
                              </div>
                              <div className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">{latestEmail?.from?.name || latestEmail?.from?.address || "Unknown sender"}</div>
                            </div>
                            <div className="text-xs text-slate-400 dark:text-zinc-500">{latestEmail?.sentAt ? new Date(latestEmail.sentAt).toLocaleDateString() : "—"}</div>
                          </div>
                          <p className="mt-2.5 text-sm leading-5 text-slate-600 dark:text-zinc-400 line-clamp-2">{latestEmail?.bodySnippet ?? "No preview available."}</p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500 dark:text-zinc-500">No threads found.</div>
                )
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 dark:bg-zinc-900 w-px transition-colors" />

          {/* 🌟 Panel 3: Reading / Preview Pane */}
          <ResizablePanel id="preview" defaultSize={normalizeSize(layout.preview)} minSize="30%" className="bg-white dark:bg-zinc-950">
            <div className="flex min-w-0 h-full flex-col overflow-hidden bg-white dark:bg-zinc-950">
              {selectedThreadId && selectedThread ? (
                <div className="flex-1 overflow-hidden min-w-0">
                  <ThreadDisplay threadId={selectedThread.id} emailId={selectedEmail?.id ?? null} />
                </div>
              ) : (
                <div className="flex h-full flex-1 flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 text-center">
                  <div className="space-y-2 max-w-xs">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400 dark:border-zinc-900 dark:bg-zinc-900 dark:text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No message selected</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Choose a thread to view the conversation</p>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}

export default Mail