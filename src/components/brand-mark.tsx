import { Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  size?: "sm" | "md" | "lg"
  showWordmark?: boolean
  className?: string
}

const sizes = {
  sm: { icon: "h-4 w-4", box: "h-8 w-8 rounded-lg", text: "text-sm" },
  md: { icon: "h-5 w-5", box: "h-10 w-10 rounded-xl", text: "text-base" },
  lg: { icon: "h-7 w-7", box: "h-14 w-14 rounded-2xl", text: "text-2xl" },
} as const

export function BrandMark({
  size = "md",
  showWordmark = true,
  className,
}: BrandMarkProps) {
  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center bg-primary/10 text-primary shadow-token-xs",
          s.box,
        )}
      >
        <Mail className={s.icon} strokeWidth={2.25} />
      </div>
      {showWordmark && (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          Normal Human
        </span>
      )}
    </div>
  )
}
