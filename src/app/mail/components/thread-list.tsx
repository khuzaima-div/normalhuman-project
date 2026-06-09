"use client"

import * as React from "react"
import { formatDistanceToNow, format } from "date-fns"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useThreads } from "@/hooks/use-threads"

export function ThreadList() {
  const { threads, isLoading, selectedThreadId, setSelectedThreadId } = useThreads()

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4 pt-0 items-center justify-center h-40 text-muted-foreground text-sm">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        <span>Syncing live mailbox...</span>
      </div>
    )
  }

  if (!threads || threads.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        No threads found in this folder.
      </div>
    )
  }

  const groupedThreads = threads.reduce<Record<string, typeof threads[number][]>>((acc, thread) => {
    const date = format(thread.lastMessageDate ?? new Date(), "yyyy-MM-dd")
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(thread)
    return acc
  }, {})

  return (
    <div className="max-w-full overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {Object.entries(groupedThreads).map(([date, dateThreads]) => (
          <React.Fragment key={date}>
            <div className="text-xs font-medium text-muted-foreground mt-4 first:mt-0 px-1">
              {format(new Date(date), "MMMM d, yyyy")}
            </div>
            {dateThreads.map((item) => {
              const latestEmail = item.emails?.at(-1)
              const isSelected = selectedThreadId === item.id
              const labels = item.emails?.[0]?.sysLabels ?? []

              return (
                <button
                  id={`thread-${item.id}`}
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedThreadId(item.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all relative",
                    isSelected ? "bg-muted/50" : "bg-white",
                    !isSelected && "hover:border-slate-300"
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">
                        {latestEmail?.from?.name || latestEmail?.from?.address || "Unknown sender"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{item.subject || "No subject"}</div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(latestEmail?.sentAt ?? new Date(), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-xs line-clamp-2 text-muted-foreground">
                    {latestEmail?.bodySnippet ?? "No preview available."}
                  </p>
                  {labels.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {labels.map((label) => (
                        <Badge key={label} variant={getBadgeVariantFromLabel(label)} className="text-[10px] px-1.5 py-0">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function getBadgeVariantFromLabel(label: string): React.ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default"
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline"
  }

  return "secondary"
}
