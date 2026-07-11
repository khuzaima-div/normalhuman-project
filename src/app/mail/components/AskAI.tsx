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
          'flex h-60 min-h-0 w-full max-w-full flex-col overflow-hidden rounded-2xl p-4 shadow-sm',
          'border border-slate-200/50 bg-slate-50/80',
          'dark:border-zinc-800/60 dark:bg-zinc-900/40 dark:shadow-[0_4px_30px_rgba(0,0,0,0.2)] dark:backdrop-blur-md',
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
              <div className="relative mb-3 flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-violet-500/15 shadow-[0_0_24px_rgba(59,130,246,0.15)] dark:from-blue-500/20 dark:via-indigo-500/15 dark:to-violet-500/20 dark:shadow-[0_0_28px_rgba(99,102,241,0.2)]">
                <Sparkles
                  className="size-4 text-blue-600 dark:text-indigo-400"
                  strokeWidth={2.25}
                />
              </div>

              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Ask about your emails
              </h3>
              <p className="mt-1 max-w-full text-xs leading-normal text-zinc-500 dark:text-zinc-400">
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
                      'max-w-full cursor-pointer truncate rounded-lg border px-2.5 py-1.5',
                      'text-[11px] font-medium text-slate-700 transition-all duration-200',
                      'border-slate-200/60 bg-white hover:bg-slate-100',
                      'dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900',
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
                    'min-w-0 max-w-[92%] break-words rounded-2xl px-3 py-2 text-xs leading-relaxed',
                    message.role === 'user'
                      ? 'self-end rounded-tr-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'self-start rounded-tl-md border border-slate-200/60 bg-white text-zinc-800 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-200',
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
            'relative mt-3 flex shrink-0 items-center gap-2 px-3 py-2',
            'rounded-xl border border-slate-200/80 bg-white transition-all',
            'focus-within:ring-1 focus-within:ring-zinc-400',
            'dark:border-zinc-800/80 dark:bg-zinc-950 dark:focus-within:ring-zinc-700',
          )}
        >
          <input
            type="text"
            onChange={handleInputChange}
            value={input}
            placeholder="Ask AI anything…"
            aria-label="Ask AI"
            className="min-w-0 flex-1 border-0 bg-transparent text-xs text-zinc-800 outline-none focus:ring-0 placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-lg p-1.5',
              'bg-zinc-900 text-white transition-opacity hover:opacity-90',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'dark:bg-zinc-100 dark:text-zinc-900',
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
