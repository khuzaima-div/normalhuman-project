"use client"

import { useThread } from "@/hooks/use-thread"

type ThreadItem = {
  id: string
  subject: string
  fromName?: string
}

type MailListProps = {
  threads: ThreadItem[]
}

export function MailList({ threads }: MailListProps) {
  const [threadId, setThreadId] = useThread()

  return (
    <div className="space-y-2">
      {threads.map((item) => {
        const isActive = item.id === threadId

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setThreadId(item.id)}
            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
              isActive
                ? "border-slate-300 bg-slate-100 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                : "border-slate-200 bg-white dark:border-zinc-950"
            }`}
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.subject}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{item.fromName ?? item.id}</div>
          </button>
        )
      })}
    </div>
  )
}
