import * as React from "react"

import { cn } from "@/lib/utils"

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative inline-flex shrink-0 overflow-hidden rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-200", className)} {...props} />
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("flex h-full w-full items-center justify-center text-xs font-semibold uppercase", className)} {...props} />
}
