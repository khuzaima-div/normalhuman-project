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
        'border rounded-xl p-5 bg-white dark:bg-zinc-900/40 cursor-pointer transition-all duration-200 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700',
        isMe 
          ? 'border-l-zinc-900 dark:border-l-zinc-100 border-l-4 border-zinc-200 dark:border-zinc-800' 
          : 'border-zinc-200 dark:border-zinc-800'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className='flex items-center gap-2.5'>
          {!isMe && (
            <Avatar 
              name={email.from.name ?? email.from.address} 
              email={email.from.address} 
              size='32' 
              textSizeRatio={2.5} 
              round={true}
              className="shadow-inner border dark:border-zinc-800"
            />
          )}
          <span className='font-semibold text-sm text-zinc-900 dark:text-zinc-100'>
            {isMe ? 'Me' : (email.from.name || email.from.address)}
          </span>
        </div>
        <p className='text-xs font-medium text-zinc-400 dark:text-zinc-500'>
          {formatDistanceToNow(new Date(email.sentAt ?? new Date()), {
            addSuffix: true,
          })}
        </p>
      </div>
      
      <div className="h-4"></div>
      
      <div className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-900/60 p-1 bg-white">
        <Letter 
          className='bg-white text-zinc-900 rounded-md text-sm' 
          html={email?.body ?? ""} 
        />
      </div>

      {attachments.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300"
            >
              <Paperclip className="size-3.5 shrink-0 text-zinc-400" />
              <span className="min-w-0 truncate font-medium">{attachment.name}</span>
              <span className="shrink-0 text-zinc-400">{formatBytes(attachment.size)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
