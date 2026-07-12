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

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  if (isCollapsed) return null

  return (
    <div className="w-full min-w-0 max-w-full">
      <div
        className={cn(
          'flex h-56 min-h-0 w-full max-w-full flex-col overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-surface p-3 shadow-token-xs',
        )}
      >
        <div
          ref={containerRef}
          className="scrollbar-none flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain"
          role="log"
          aria-live="polite"
          aria-label="AI chat messages"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-1 py-2 text-center">
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" strokeWidth={2.25} />
              </div>

              <h3 className="text-body font-semibold tracking-tight text-foreground">
                Ask about your emails
              </h3>
              <p className="mt-1 max-w-full text-caption leading-normal text-muted-foreground">
                Summaries, meeting times, order tracking — all from your inbox.
              </p>

              <div className="mt-3 flex max-w-full flex-wrap justify-center gap-1.5">
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
                      'max-w-full cursor-pointer truncate rounded-md border border-border bg-background px-2.5 py-1.5',
                      'text-label font-medium text-foreground transition-colors duration-150',
                      'hover:bg-muted',
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
            'relative mt-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2',
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
