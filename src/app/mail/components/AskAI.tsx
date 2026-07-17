'use client'

import { useChat } from 'ai/react'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useEffect, useRef } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { useLocalStorage } from 'usehooks-ts'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const springTransition = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 25,
}

const SUGGESTIONS = ['Any urgent emails?', 'Summarize this week'] as const

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const [accountId] = useLocalStorage('accountId', '')
  const containerRef = useRef<HTMLDivElement>(null)

  const { input, handleInputChange, handleSubmit, messages, isLoading } = useChat({
    api: '/api/chat',
    body: { accountId },
    onError: (error) => {
      if (error.message.includes('Limit reached')) {
        toast.error('You have reached your free daily limit.')
      } else {
        toast.error('Something went wrong. Please try again.')
      }
    },
  })

  const lastMessageContent = messages.at(-1)?.content ?? ''

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages.length, lastMessageContent, isLoading])

  if (isCollapsed) return null

  return (
    <div className="@container flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div
        className={cn(
          'flex h-56 min-h-0 w-full max-w-full shrink-0 flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-surface shadow-token-xs',
          'p-2 @[240px]:p-3',
        )}
      >
        <div
          ref={containerRef}
          className="scrollbar-elegant flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain"
          role="log"
          aria-live="polite"
          aria-label="AI chat messages"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0.5 py-1 text-center @[240px]:px-1 @[240px]:py-2">
              <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary @[240px]:mb-3 @[240px]:size-9">
                <Sparkles className="size-3.5 @[240px]:size-4" strokeWidth={2.25} />
              </div>

              <h3 className="text-body font-semibold tracking-tight text-foreground">
                Ask about your emails
              </h3>
              <p className="mt-1 hidden max-w-full text-caption leading-normal text-muted-foreground @[240px]:block">
                Summaries, meeting times, order tracking — all from your inbox.
              </p>

              <div className="mt-2 flex w-full max-w-full flex-row flex-wrap justify-center gap-1.5 @[240px]:mt-3">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() =>
                      handleInputChange({
                        target: { value: suggestion },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    className={cn(
                      'min-w-0 flex-1 basis-0 cursor-pointer truncate rounded-full border border-primary/20 bg-primary/5 px-2 py-1',
                      'text-label font-medium text-foreground transition-[background-color,border-color,color] duration-150',
                      'hover:border-primary/30 hover:bg-primary/10 hover:text-primary',
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={springTransition}
                  className={cn(
                    'min-w-0 max-w-[92%] break-words rounded-lg px-3 py-2 text-caption leading-relaxed',
                    message.role === 'user'
                      ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
                      : 'self-start rounded-bl-sm border border-border bg-background text-foreground',
                  )}
                >
                  <span className="whitespace-pre-wrap break-words">{message.content}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className={cn(
            'relative mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 @[240px]:px-3 @[240px]:py-2',
            'transition-[border-color,box-shadow] duration-200',
            'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
          )}
        >
          <input
            type="text"
            onChange={handleInputChange}
            value={input}
            placeholder="Ask AI anything…"
            aria-label="Ask AI"
            className="min-w-0 flex-1 border-0 bg-transparent text-caption text-foreground outline-none focus:ring-0 placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-md bg-primary p-1.5 text-primary-foreground',
              'transition-opacity duration-150 hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-40',
            )}
          >
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default AskAI
