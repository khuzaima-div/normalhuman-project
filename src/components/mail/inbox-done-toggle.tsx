"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useMailNavigation,
  type InboxFilter,
} from "@/hooks/use-mail-navigation";

const OPTIONS: { id: InboxFilter; label: string }[] = [
  { id: "active", label: "Inbox" },
  { id: "done", label: "Done" },
];

export function InboxDoneToggle() {
  const { inboxFilter, setInboxFilter } = useMailNavigation();

  return (
    <div
      className="relative inline-grid shrink-0 grid-cols-2 rounded-full bg-slate-100 p-[3px] dark:bg-zinc-800/40"
      role="group"
      aria-label="Inbox filter"
    >
      {OPTIONS.map((option) => {
        const isActive = inboxFilter === option.id;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setInboxFilter(option.id)}
            className={cn(
              "relative z-10 min-w-[3.75rem] rounded-full px-3.5 py-1 text-xs font-medium tracking-tight",
              "transition-colors duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
              isActive
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300",
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="inbox-done-pill"
                className={cn(
                  "absolute inset-0 rounded-full border border-zinc-200/40 bg-white shadow-sm",
                  "dark:border-zinc-600/40 dark:bg-zinc-700/60",
                )}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
