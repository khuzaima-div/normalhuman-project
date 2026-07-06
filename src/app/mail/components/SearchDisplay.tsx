"use client"

import React from "react"
import { formatDistanceToNow } from "date-fns"
import { Search, Inbox, AlertCircle, Sparkles } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import { ScrollArea } from "../../../components/ui/scroll-area"

type SearchResultItem = {
  id: string
  subject: string
  snippet: string
  from: {
    name: string
    address: string
  }
  date: string
  isRead: boolean
  labels: string[]
}

type SearchDisplayProps = {
  query: string
  results: SearchResultItem[] | { hits?: SearchResultItem[] }
  isLoading: boolean
  onItemSelect: (id: string) => void
  selectedItemId?: string | null
}

export function SearchDisplay({
  query,
  results,
  isLoading,
  onItemSelect,
  selectedItemId,
}: SearchDisplayProps) {
  const normalizedResults = Array.isArray(results) ? results : results?.hits ?? []

  if (!query) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500 gap-3">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-full border border-zinc-200/50 dark:border-zinc-800/50">
          <Search className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-tight">Search Conversations</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-60">
            Type keywords, sender names, or email subjects to scan your inbox.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 space-y-4">
        <div className="relative w-10 h-10 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-zinc-200 dark:border-zinc-800 rounded-full" />
          <div className="absolute inset-0 border-2 border-t-zinc-900 dark:border-t-zinc-50 rounded-full animate-spin" />
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Scanning threads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      
      {/* Search Header / Status Counter */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shrink-0 min-h-12">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
            Search Results
          </span>
          <span className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-mono">
            {normalizedResults.length}
          </span>
        </div>
        
        {normalizedResults.length > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-900/50 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            AI Matched
          </div>
        )}
      </div>

      {/* Results Feed */}
      {normalizedResults.length > 0 ? (
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3 space-y-1">
            {normalizedResults.map((item) => {
              const isSelected = selectedItemId === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onItemSelect(item.id)}
                  className={`w-full text-left flex flex-col gap-1 p-3.5 rounded-xl transition-all duration-150 relative ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {/* Unread Indicator Bar */}
                  {!item.isRead && !isSelected && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 dark:bg-blue-400 rounded-full" />
                  )}

                  {/* Top Meta Row */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className={`truncate ${!item.isRead ? "font-bold text-zinc-950 dark:text-zinc-50" : "font-semibold"}`}>
                      {item.from.name || item.from.address}
                    </span>
                    <span className="text-zinc-400 dark:text-zinc-500 whitespace-nowrap font-medium">
                      {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Subject Title */}
                  <h4 className={`text-sm leading-tight truncate ${!item.isRead ? "font-semibold text-zinc-950 dark:text-zinc-50" : "text-zinc-900 dark:text-zinc-200"}`}>
                    {item.subject || "(No Subject)"}
                  </h4>

                  {/* Body Snippet */}
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 leading-normal">
                    {item.snippet}
                  </p>

                  {/* Labels List */}
                  {item.labels && item.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {item.labels.map((label) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 rounded font-medium bg-zinc-100 dark:bg-zinc-800 border-none text-zinc-600 dark:text-zinc-400"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500 gap-2">
          <AlertCircle className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm font-medium tracking-tight">No results found</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-50">
            We couldn't find matches for <span className="text-zinc-600 dark:text-zinc-400 font-mono">"{query}"</span>.
          </p>
        </div>
      )}
    </div>
  )
}