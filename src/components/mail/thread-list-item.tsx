import Avatar from "react-avatar";
import { cn } from "@/lib/utils";

interface ThreadListItemProps {
  subject: string;
  senderName: string;
  preview: string;
  date: string;
  selected?: boolean;
  onClick: () => void;
}

export function ThreadListItem({
  subject,
  senderName,
  preview,
  date,
  selected = false,
  onClick,
}: ThreadListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={selected}
      className={cn(
        "thread-list-item group relative w-full rounded-xl p-4 text-left",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        selected && "thread-list-item-active",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          name={senderName}
          size="36"
          round="10px"
          className="shrink-0 ring-1 ring-zinc-200/70 dark:ring-zinc-700/60"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                selected
                  ? "font-semibold text-zinc-950 dark:text-zinc-50"
                  : "font-semibold text-zinc-900 dark:text-zinc-100",
              )}
            >
              {senderName}
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
              {date}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-sm",
              selected
                ? "font-medium text-zinc-900 dark:text-zinc-200"
                : "font-medium text-zinc-800 dark:text-zinc-300",
            )}
          >
            {subject || "No subject"}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-slate-400">
            {preview || "No preview available."}
          </p>
        </div>
      </div>
    </button>
  );
}
