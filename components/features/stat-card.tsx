import { cn } from "@/lib/utils"
import { TrendingDown, TrendingUp } from "lucide-react"
import { HoverCard } from "@/components/features/motion"

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  delta?: number
  hint?: string
}) {
  const positive = (delta ?? 0) >= 0
  return (
    <HoverCard className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-background/40">
          <Icon className="size-4 text-muted-foreground" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="font-heading text-2xl font-semibold tracking-tight">
          {value}
        </span>
        {typeof delta === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium",
              positive ? "text-emerald-400" : "text-destructive"
            )}
          >
            {positive ? (
              <TrendingUp className="size-3.5" />
            ) : (
              <TrendingDown className="size-3.5" />
            )}
            {positive ? "+" : ""}
            {delta}%
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </HoverCard>
  )
}
