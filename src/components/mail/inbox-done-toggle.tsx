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
      className="relative inline-grid shrink-0 grid-cols-2 rounded-lg bg-muted p-0.5"
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
              "relative z-10 min-w-[3.75rem] rounded-md px-3 py-1.5 text-caption font-medium",
              "transition-colors duration-200 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="inbox-done-pill"
                className="absolute inset-0 rounded-md border border-border bg-background shadow-token-xs"
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
