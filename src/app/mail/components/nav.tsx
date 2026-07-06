"use client"

import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface NavProps {
  isCollapsed: boolean
  onTabChange: (id: string) => void
  links: {
    title: string
    label?: string
    icon: LucideIcon
    variant: "default" | "ghost"
    id: string
  }[]
}

export function Nav({ links, isCollapsed, onTabChange }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 min-h-0 w-full"
    >
      <nav className="grid gap-1.5 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-0 w-full">
        {links.map((link, index) => {
          const isDefault = link.variant === "default"
          
          return isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(link.id)}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "icon" }),
                    "h-9 w-9 rounded-xl transition-all duration-200 ease-in-out flex items-center justify-center group/btn relative",
                    isDefault 
                      ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 hover:bg-zinc-950 dark:hover:bg-zinc-50 shadow-md scale-100" 
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <link.icon className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200", 
                    !isDefault && "group-hover/btn:scale-110"
                  )} />
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              {/* Premium Adaptive Dark Tooltip Container */}
              <TooltipContent side="right" className="flex items-center gap-4 bg-zinc-950 text-white dark:bg-zinc-900 dark:text-zinc-100 dark:border dark:border-zinc-800 border-none text-xs font-medium py-1.5 px-3 rounded-lg shadow-lg">
                <span className="tracking-wide">{link.title}</span>
                {link.label && (
                  <span className="ml-auto text-zinc-400 dark:text-zinc-500 font-mono text-[10px] bg-white/10 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md">{link.label}</span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={index}
              onClick={() => onTabChange(link.id)}
              className={cn(
                buttonVariants({ variant: link.variant, size: "sm" }),
                "flex items-center justify-start h-10 w-full rounded-xl px-3.5 transition-all duration-200 ease-in-out text-sm font-medium tracking-wide group/btn border border-transparent",
                isDefault 
                  ? "bg-zinc-950 text-white hover:bg-zinc-950 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-50 shadow-md font-semibold border-zinc-950 dark:border-zinc-50" 
                  : "text-zinc-600 hover:bg-zinc-100/90 hover:text-zinc-950 hover:shadow-sm dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              )}
            >
              <link.icon className={cn(
                "mr-3 h-4 w-4 shrink-0 transition-all duration-200",
                isDefault 
                  ? "text-white dark:text-zinc-950" 
                  : "text-zinc-400 dark:text-zinc-500 group-hover/btn:text-zinc-900 dark:group-hover/btn:text-zinc-50 group-hover/btn:scale-105"
              )} />
              <span className="truncate flex-1 text-left">{link.title}</span>
              {link.label && (
                <span
                  className={cn(
                    "ml-auto text-[11px] font-bold font-mono tracking-tighter px-2 py-0.5 rounded-md transition-all duration-200",
                    isDefault 
                      ? "text-white bg-white/15 dark:text-zinc-950 dark:bg-zinc-950/10" 
                      : "text-zinc-600 bg-zinc-100 group-hover/btn:bg-zinc-200/80 group-hover/btn:text-zinc-950 dark:text-zinc-400 dark:bg-zinc-900 dark:group-hover/btn:bg-zinc-800 dark:group-hover/btn:text-zinc-50"
                  )}
                >
                  {link.label}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}