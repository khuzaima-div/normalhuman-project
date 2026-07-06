"use client"

import React from "react"
import { format } from "date-fns"
import {
  Archive,
  ArchiveX,
  Clock,
  MoreVertical,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
} from "../../../components/ui/avatar"
import { Button } from "../../../components/ui/button"
import { Separator } from "../../../components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip"

import { useThreads } from "../../../hooks/use-threads"
import EmailDisplay from "./email-display"
import ReplyBox from "@/components/email-editor/reply-box"

type ThreadDisplayProps = {
  threadId?: string | null
  emailId?: string | null
}

export function ThreadDisplay({
  threadId: threadIdProp,
  emailId: selectedEmailIdProp,
}: ThreadDisplayProps) {
  const threadId = threadIdProp ?? null
  const { threads, accountId } = useThreads()
  const [selectedEmailId, setSelectedEmailId] = React.useState<string | null>(selectedEmailIdProp ?? null)

  React.useEffect(() => {
    if (selectedEmailIdProp !== undefined) {
      setSelectedEmailId(selectedEmailIdProp)
      return
    }

    if (!selectedEmailId && threadId) {
      const thread = threads?.find((t) => t.id === threadId)
      const firstEmailId = thread?.emails?.[0]?.id ?? null

      if (firstEmailId !== selectedEmailId) {
        setSelectedEmailId(firstEmailId)
      }
    }
  }, [selectedEmailIdProp, threadId, selectedEmailId, threads])

  const thread = threads?.find((t) => t.id === threadId)

  console.log('DEBUG: ThreadDisplay render', { threadId, accountId, hasThread: !!thread })

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      
      {/* 1. Top Action Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 min-h-14">
        <div className="flex items-center gap-1">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread} className="h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <Archive className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread} className="h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <ArchiveX className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Junk</TooltipContent>
          </Tooltip>

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread} className="h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Trash</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-4 mx-2 bg-zinc-200 dark:bg-zinc-800" />

          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread} className="h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <Clock className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread} className="h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <DropdownMenuItem className="cursor-pointer">Mark as unread</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Star thread</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Main Body Content */}
      {thread ? (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          
          {/* Thread Subject & Primary Sender Block */}
          <div className="flex items-start justify-between p-6 border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 shrink-0">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <ShadcnAvatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm">
                <AvatarFallback className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 font-semibold text-sm">
                  {thread.emails?.[0]?.from?.name?.charAt(0) || "E"}
                </AvatarFallback>
              </ShadcnAvatar>
              
              <div className="space-y-1 min-w-0">
                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight line-clamp-1">
                  {thread.emails?.[0]?.subject || "No Subject"}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-900 dark:text-zinc-200 truncate">
                    {thread.emails?.[0]?.from?.name || "Unknown Sender"}
                  </span>
                  <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">•</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                    {thread.emails?.[0]?.from?.address}
                  </span>
                </div>
              </div>
            </div>

            {thread.emails?.[0]?.sentAt && (
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium whitespace-nowrap pl-4 pt-1.5">
                {format(new Date(thread.emails[0].sentAt), "MMM d, yyyy, h:mm a")}
              </div>
            )}
          </div>

          {/* 3. Core Scrollable Email Stack */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-50/40 dark:bg-zinc-900/10 px-6 py-4 space-y-4">
            {thread.emails.map((email, index) => (
              <div 
                key={email.id} 
                className={`w-full ${
                  index !== thread.emails.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-900 pb-4' : ''
                }`}
              >
                <EmailDisplay
                  email={{
                    ...email,
                    body: email.body ?? undefined,
                  }}
                />
              </div>
            ))}
          </div>

          {/* 4. Fixed Bottom Premium Reply Box */}
          <div className="w-full bg-white dark:bg-zinc-950 shrink-0 border-t border-zinc-200 dark:border-zinc-800 p-4">
            <ReplyBox />
          </div>

        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center text-zinc-400 dark:text-zinc-500 gap-2">
          <p className="text-sm font-medium tracking-tight">No conversation selected</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600 max-w-xs">
            Choose an email thread from the sidebar list to view the full message details.
          </p>
        </div>
      )}
    </div>
  )
}