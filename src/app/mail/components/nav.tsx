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
      <nav className="grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-0 w-full">
        {links.map((link, index) => {
          const isDefault = link.variant === "default"
          
          return isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onTabChange(link.id)}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "icon" }),
                    "h-9 w-9 rounded-lg transition-all flex items-center justify-center",
                    isDefault 
                      ? "bg-slate-900 text-white hover:bg-slate-900 shadow-sm" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span className="sr-only">{link.title}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4 bg-slate-900 text-white border-none text-xs rounded-md shadow-md">
                {link.title}
                {link.label && (
                  <span className="ml-auto text-slate-400 font-mono scale-90">{link.label}</span>
                )}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              key={index}
              onClick={() => onTabChange(link.id)}
              className={cn(
                buttonVariants({ variant: link.variant, size: "sm" }),
                "flex items-center justify-start h-9 w-full rounded-lg px-3 transition-all text-xs font-medium",
                isDefault 
                  ? "bg-slate-900 text-white hover:bg-slate-900 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              )}
            >
              <link.icon className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate flex-1 text-left">{link.title}</span>
              {link.label && (
                <span
                  className={cn(
                    "ml-auto text-[10px] font-mono tracking-tight px-1.5 py-0.5 rounded-full scale-90",
                    isDefault ? "text-white bg-white/20" : "text-slate-500 bg-slate-100"
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