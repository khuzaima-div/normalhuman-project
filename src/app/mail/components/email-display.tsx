'use client'

import React from 'react'
import Avatar from 'react-avatar'
import { Letter } from 'react-letter'
import { Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useThreads } from '../../../hooks/use-threads'

type AttachmentInfo = {
  id: string
  name: string
  mimeType: string
  size: number
  inline: boolean
}

type Props = {
  email: {
    id: string
    body?: string
    sentAt: string | Date
    from: {
      name?: string | null
      address: string
    }
    attachments?: AttachmentInfo[]
  }
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function EmailDisplay({ email }: Props) {
  const { account } = useThreads()
  const letterRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (letterRef.current) {
      const gmailQuote = letterRef.current.querySelector('div[class*="_gmail_quote"]')
      if (gmailQuote) {
        gmailQuote.innerHTML = ''
      }
    }
  }, [email])

  const isMe = account?.emailAddress === email.from.address
  const attachments = (email.attachments ?? []).filter((a) => !a.inline)

  return (
    <div
      ref={letterRef}
      className={cn(
        'cursor-pointer rounded-lg border border-border bg-surface-1 p-4 transition-[border-color,box-shadow] duration-200 shadow-token-xs hover:border-border/80 hover:shadow-token-sm',
        isMe && 'border-l-[3px] border-l-primary',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {!isMe && (
            <Avatar
              name={email.from.name ?? email.from.address}
              email={email.from.address}
              size="32"
              textSizeRatio={2.5}
              round={true}
              className="ring-1 ring-border"
            />
          )}
          <span className="text-body font-semibold text-foreground">
            {isMe ? 'Me' : (email.from.name || email.from.address)}
          </span>
        </div>
        <p className="text-caption font-medium text-muted-foreground">
          {formatDistanceToNow(new Date(email.sentAt ?? new Date()), {
            addSuffix: true,
          })}
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-border/60 bg-background p-2">
        <Letter
          className="rounded-md bg-background text-body text-foreground"
          html={email?.body ?? ""}
        />
      </div>

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 text-caption text-muted-foreground"
            >
              <Paperclip className="size-3.5 shrink-0" />
              <span className="min-w-0 truncate font-medium text-foreground">{attachment.name}</span>
              <span className="shrink-0">{formatBytes(attachment.size)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
