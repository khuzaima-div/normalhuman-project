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
        "thread-list-item group relative w-full rounded-lg p-3.5 text-left sm:p-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        selected && "thread-list-item-active",
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar
          name={senderName}
          size="36"
          round="8px"
          className="shrink-0 ring-1 ring-border"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                "truncate text-body",
                selected ? "font-semibold text-foreground" : "font-medium text-foreground",
              )}
            >
              {senderName}
            </span>
            <span className="shrink-0 font-mono text-label tabular-nums text-muted-foreground">
              {date}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-body",
              selected ? "font-medium text-foreground" : "text-foreground/90",
            )}
          >
            {subject || "No subject"}
          </p>
          <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-muted-foreground">
            {preview || "No preview available."}
          </p>
        </div>
      </div>
    </button>
  );
}
