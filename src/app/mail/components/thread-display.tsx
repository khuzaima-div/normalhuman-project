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
            "inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground",
            "transition-[background-color,color] duration-200 ease-out",
            "hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
    <div className="flex h-full flex-col overflow-hidden bg-preview text-foreground">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2 sm:px-5">
        <div className="flex items-center gap-0.5">
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
                "inline-flex size-10 items-center justify-center rounded-lg text-muted-foreground",
                "transition-[background-color,color] duration-200 ease-out",
                "hover:bg-muted hover:text-foreground",
                "disabled:pointer-events-none disabled:opacity-40",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-3 pb-3 pt-2 sm:px-5 sm:pb-5">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-token-sm">
            <div className="shrink-0 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-start gap-3">
                <ShadcnAvatar className="size-9 shrink-0 ring-1 ring-border">
                  <AvatarFallback className="bg-muted text-label font-semibold text-foreground">
                    {primaryEmail?.from?.name?.charAt(0) || "E"}
                  </AvatarFallback>
                </ShadcnAvatar>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h1 className="line-clamp-2 min-w-0 flex-1 text-title font-semibold leading-snug tracking-tight text-foreground">
                      {primaryEmail?.subject || "No Subject"}
                    </h1>
                    {primaryEmail?.sentAt && (
                      <time
                        dateTime={new Date(primaryEmail.sentAt).toISOString()}
                        className="shrink-0 font-mono text-label tabular-nums text-muted-foreground"
                      >
                        {format(new Date(primaryEmail.sentAt), "MMM d, h:mm a")}
                      </time>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0 text-caption text-muted-foreground">
                    <span className="truncate font-medium text-foreground/80">
                      {primaryEmail?.from?.name || "Unknown Sender"}
                    </span>
                    <span className="text-border">•</span>
                    <span className="truncate">
                      {primaryEmail?.from?.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="scrollbar-elegant min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
              <div className="mx-auto w-full max-w-[720px] space-y-4">
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
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
          <p className="text-body font-medium">No conversation selected</p>
          <p className="max-w-xs text-caption leading-relaxed">
            Choose an email thread from the list to view the full message.
          </p>
        </div>
      )}
    </div>
  )
}
