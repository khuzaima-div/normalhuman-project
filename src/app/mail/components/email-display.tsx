'use client'

import React from 'react'
import Avatar from 'react-avatar'
import { Letter } from 'react-letter'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { useThreads } from '../../../hooks/use-threads'

type Props = {
  email: {
    id: string
    body?: string
    sentAt: string | Date
    from: {
      name?: string | null
      address: string
    }
  }
}

export default function EmailDisplay({ email }: Props) {
  const { account } = useThreads()
  const letterRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (letterRef.current) {
      // Elliot's original logic: Gmail specific repetitive thread quotes cleaning
      const gmailQuote = letterRef.current.querySelector('div[class*="_gmail_quote"]')
      if (gmailQuote) {
        gmailQuote.innerHTML = ''
      }
    }
  }, [email])

  const isMe = account?.emailAddress === email.from.address

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
      
      {/* Premium Rich Text Render Layer Box */}
      <div className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-900/60 p-1 bg-white">
        <Letter 
          className='bg-white text-zinc-900 rounded-md text-sm' 
          html={email?.body ?? ""} 
        />
      </div>
    </div>
  )
}