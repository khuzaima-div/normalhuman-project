import { cn } from "@/lib/utils";

interface PanelHeaderProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

export function PanelHeader({ title, children, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between px-4",
        className,
      )}
    >
      <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {title}
      </h1>
      {children && (
        <div className="ml-auto flex shrink-0 items-center">{children}</div>
      )}
    </div>
  );
}
