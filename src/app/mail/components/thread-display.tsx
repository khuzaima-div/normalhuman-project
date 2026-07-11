"use client"

import React from "react"
import { format } from "date-fns"
import { Archive, ArchiveRestore, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { useLocalStorage } from "usehooks-ts"

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
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip"
import { cn } from "@/lib/utils"
import { api } from "@/trpc/react"

import { useThreads } from "../../../hooks/use-threads"
import EmailDisplay from "./email-display"
import ReplyBox from "@/components/email-editor/reply-box"

type ThreadDisplayProps = {
  threadId?: string | null
  emailId?: string | null
}

function ActionButton({
  label,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string
  disabled?: boolean
  onClick?: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full text-zinc-500",
            "transition-all duration-200 ease-out",
            "hover:bg-slate-100 hover:text-zinc-900",
            "disabled:pointer-events-none disabled:opacity-40",
            "dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100",
            className,
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ThreadDisplay({
  threadId: threadIdProp,
  emailId: selectedEmailIdProp,
}: ThreadDisplayProps) {
  const threadId = threadIdProp ?? null
  const { threads } = useThreads()
  const [accountId] = useLocalStorage("accountId", "")
  const utils = api.useUtils()
  const [selectedEmailId, setSelectedEmailId] = React.useState<string | null>(
    selectedEmailIdProp ?? null,
  )

  const listThread = threads?.find((t) => t.id === threadId)

  const { data: fullThread } = api.account.getThread.useQuery(
    { accountId, threadId: threadId! },
    { enabled: Boolean(accountId && threadId) },
  )

  const thread = fullThread ?? listThread
  const primaryEmail = thread?.emails?.[0]

  const setDone = api.account.setThreadDone.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.account.getThreads.invalidate(),
        utils.account.getNumThreads.invalidate(),
        utils.account.getThread.invalidate(),
      ])
      toast.success(result.done ? "Moved to Done" : "Moved back to Inbox")
    },
    onError: (error) => {
      toast.error(error.message || "Could not update thread")
    },
  })

  React.useEffect(() => {
    if (selectedEmailIdProp !== undefined) {
      setSelectedEmailId(selectedEmailIdProp)
      return
    }

    if (!selectedEmailId && threadId) {
      const firstEmailId = thread?.emails?.[0]?.id ?? null

      if (firstEmailId !== selectedEmailId) {
        setSelectedEmailId(firstEmailId)
      }
    }
  }, [selectedEmailIdProp, threadId, selectedEmailId, thread])

  const isDone = Boolean(fullThread?.done ?? (listThread as { done?: boolean } | undefined)?.done)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F1F5F9]/40 text-foreground dark:bg-zinc-950/90">
      <div className="flex shrink-0 items-center justify-between px-5 py-3">
        <div className="flex items-center gap-1">
          <ActionButton
            label={isDone ? "Move to Inbox" : "Archive (Done)"}
            disabled={!thread || !accountId || setDone.isPending}
            onClick={() => {
              if (!threadId || !accountId) return
              setDone.mutate({
                accountId,
                threadId,
                done: !isDone,
              })
            }}
          >
            {isDone ? (
              <ArchiveRestore className="size-4" />
            ) : (
              <Archive className="size-4" />
            )}
          </ActionButton>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={!thread || !accountId || setDone.isPending}
              aria-label="More actions"
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full text-zinc-500",
                "transition-all duration-200 ease-out",
                "hover:bg-slate-100 hover:text-zinc-900",
                "disabled:pointer-events-none disabled:opacity-40",
                "dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100",
              )}
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => {
                if (!threadId || !accountId) return
                setDone.mutate({
                  accountId,
                  threadId,
                  done: !isDone,
                })
              }}
            >
              {isDone ? "Move to Inbox" : "Mark as Done"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {thread ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:bg-zinc-900 dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]">
            <div className="shrink-0 border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800/60">
              <div className="flex min-w-0 items-start gap-2">
                <ShadcnAvatar className="size-8 shrink-0 ring-1 ring-zinc-200/70 dark:ring-zinc-700/60">
                  <AvatarFallback className="bg-slate-100 text-[11px] font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                    {primaryEmail?.from?.name?.charAt(0) || "E"}
                  </AvatarFallback>
                </ShadcnAvatar>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h1 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
                      {primaryEmail?.subject || "No Subject"}
                    </h1>
                    {primaryEmail?.sentAt && (
                      <time
                        dateTime={new Date(primaryEmail.sentAt).toISOString()}
                        className="shrink-0 font-mono text-[10px] leading-none tabular-nums text-zinc-400 dark:text-zinc-500"
                      >
                        {format(new Date(primaryEmail.sentAt), "MMM d, h:mm a")}
                      </time>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-xs leading-tight text-zinc-500 dark:text-zinc-400">
                    <span className="truncate font-medium text-zinc-600 dark:text-zinc-300">
                      {primaryEmail?.from?.name || "Unknown Sender"}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-600">•</span>
                    <span className="truncate">
                      {primaryEmail?.from?.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="scrollbar-elegant min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="mx-auto w-full max-w-[720px] space-y-6">
                {thread.emails.map((email) => (
                  <EmailDisplay
                    key={email.id}
                    email={{
                      ...email,
                      body:
                        "body" in email
                          ? (email.body as string | null | undefined) ?? undefined
                          : ("bodySnippet" in email
                              ? (email.bodySnippet as string | undefined)
                              : undefined),
                      attachments:
                        "attachments" in email
                          ? (email.attachments as
                              | {
                                  id: string
                                  name: string
                                  mimeType: string
                                  size: number
                                  inline: boolean
                                }[]
                              | undefined)
                          : undefined,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <ReplyBox />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm font-semibold">No conversation selected</p>
          <p className="max-w-xs text-xs leading-relaxed">
            Choose an email thread from the list to view the full message.
          </p>
        </div>
      )}
    </div>
  )
}
