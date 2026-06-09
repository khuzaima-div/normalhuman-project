"use client"

import * as React from "react"
import { usePanelRef } from "react-resizable-panels"
import { cn } from "../../lib/utils"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../components/ui/resizable"
import { Separator } from "../../components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { TooltipProvider } from "../../components/ui/tooltip"
import { AccountSwitcher } from "./components/account-switcher"
import { SideBar } from "./components/sidebar"
import { useThreads } from "../../hooks/use-threads"

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
      <div className="fixed inset-0 flex h-screen w-screen items-stretch overflow-hidden bg-white select-none">
        <ResizablePanelGroup
          direction="horizontal"
          defaultLayout={layout}
          onLayoutChanged={(nextLayout) => {
            const layoutValues = [nextLayout.sidebar, nextLayout.threads, nextLayout.preview]
            document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(layoutValues)}; path=/`
          }}
          className="items-stretch h-full w-full"
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
            className="border-r border-slate-200 bg-white flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out"
          >
            <div className="flex h-full w-full flex-col bg-white">
              <div className={cn("flex h-14 items-center justify-center bg-white shrink-0", isCollapsed ? "px-0" : "px-4")}>
                <AccountSwitcher isCollapsed={isCollapsed} />
              </div>
              <Separator />
              <div className="flex-1 overflow-y-auto p-2 bg-white">
                <SideBar isCollapsed={isCollapsed} />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 w-px" />

          <ResizablePanel id="threads" defaultSize={normalizeSize(layout.threads)} minSize="25%" maxSize="40%" className="bg-white">
            <Tabs value={tab} onValueChange={(next) => setTab(next)} defaultValue={tab ?? "inbox"}>
              <div className="flex h-14 items-center justify-between bg-white px-4 py-2 shrink-0">
                <h1 className="text-xl font-bold text-slate-800">Inbox</h1>
                <TabsList className="ml-auto">
                  <TabsTrigger value="inbox" className="text-zinc-600 text-xs">
                    Inbox
                  </TabsTrigger>
                  <TabsTrigger value="done" className="text-zinc-600 text-xs">
                    Done
                  </TabsTrigger>
                </TabsList>
              </div>
              <Separator />

              <TabsContent value="inbox" className="m-0 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-500">Loading inbox threads...</div>
                ) : threads && threads.length > 0 ? (
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
                            "w-full rounded-xl border p-4 text-left transition-colors",
                            selected ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <span className="truncate">{thread.subject ?? "No subject"}</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{latestEmail?.from?.name || latestEmail?.from?.address || "Unknown sender"}</div>
                            </div>
                            <div className="text-xs text-slate-400">{latestEmail?.sentAt ? new Date(latestEmail.sentAt).toLocaleDateString() : "—"}</div>
                          </div>
                          <p className="mt-3 text-sm leading-5 text-slate-600 line-clamp-2">{latestEmail?.bodySnippet ?? "No preview available."}</p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">No threads found in the inbox.</div>
                )}
              </TabsContent>

              <TabsContent value="done" className="m-0 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-500">Loading done threads...</div>
                ) : threads && threads.length > 0 ? (
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
                            "w-full rounded-xl border p-4 text-left transition-colors",
                            selected ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <span className="truncate">{thread.subject ?? "No subject"}</span>
                              </div>
                              <div className="mt-2 text-xs text-slate-500">{latestEmail?.from?.name || latestEmail?.from?.address || "Unknown sender"}</div>
                            </div>
                            <div className="text-xs text-slate-400">{latestEmail?.sentAt ? new Date(latestEmail.sentAt).toLocaleDateString() : "—"}</div>
                          </div>
                          <p className="mt-3 text-sm leading-5 text-slate-600 line-clamp-2">{latestEmail?.bodySnippet ?? "No preview available."}</p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-slate-500">No done threads found.</div>
                )}
              </TabsContent>
            </Tabs>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-slate-200 w-px" />

          <ResizablePanel id="preview" defaultSize={normalizeSize(layout.preview)} minSize="30%" className="bg-white">
            <div className="flex min-w-0 h-full flex-col bg-white">
              <div className="flex h-14 items-center justify-between bg-white border-b border-slate-200 px-6 shrink-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Preview Mode</span>
              </div>
              <div className="flex h-full flex-1 flex-col items-center justify-center bg-white p-6 text-center">
                <div className="space-y-2 max-w-xs">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-700">Select an email to read</p>
                  <p className="text-xs leading-relaxed text-slate-400">Thread display module placeholder.</p>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </TooltipProvider>
  )
}

export default Mail
