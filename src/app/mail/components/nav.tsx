"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
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

function NavCountBadge({
  count,
  isActive,
}: {
  count: string
  isActive: boolean
}) {
  return (
    <span
      className={cn(
        "ml-auto inline-flex min-w-[1.375rem] shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 font-mono text-caption tabular-nums",
        isActive
          ? "bg-primary/10 text-primary"
          : "bg-muted text-sidebar-muted",
      )}
    >
      {count}
    </span>
  )
}

function navItemClass(isActive: boolean, isCollapsed: boolean) {
  return cn(
    "sidebar-nav-item group/nav-item flex items-center justify-start outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
    isCollapsed
      ? "size-11 justify-center rounded-lg px-0"
      : "h-10 w-full rounded-lg px-3 text-body font-medium",
    isActive
      ? "sidebar-nav-item-active font-medium"
      : "border border-transparent text-sidebar-muted",
  )
}

export function Nav({ links, isCollapsed, onTabChange }: NavProps) {
  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex min-h-0 w-full flex-col data-[collapsed=true]:items-center"
    >
      <nav
        aria-label="Mailbox navigation"
        className={cn(
          "grid w-full gap-0.5",
          isCollapsed ? "justify-items-center px-0" : "px-1",
        )}
      >
        {links.map((link) => {
          const isActive = link.variant === "default"
          const Icon = link.icon

          if (isCollapsed) {
            return (
              <Tooltip key={link.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onTabChange(link.id)}
                    className={navItemClass(isActive, true)}
                    aria-label={link.title}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-200 ease-out",
                        isActive
                          ? "text-sidebar-active-foreground"
                          : "text-sidebar-muted group-hover/nav-item:text-sidebar-foreground",
                      )}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="flex items-center gap-3 text-xs"
                >
                  <span>{link.title}</span>
                  {link.label && (
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {link.label}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          }

          return (
            <button
              key={link.id}
              type="button"
              onClick={() => onTabChange(link.id)}
              className={navItemClass(isActive, false)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "mr-2.5 size-4 shrink-0 transition-transform duration-200 ease-out",
                  isActive
                    ? "text-sidebar-active-foreground"
                    : "text-sidebar-muted group-hover/nav-item:text-sidebar-foreground",
                )}
              />
              <span className="flex-1 truncate text-left">{link.title}</span>
              {link.label && (
                <NavCountBadge count={link.label} isActive={isActive} />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
