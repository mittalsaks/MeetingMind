"use client"

import type { LucideIcon } from "lucide-react"
import { HoverCard, StaggerItem } from "@/components/motion"
import { toneClasses } from "@/lib/data"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
  icon: Icon,
  progress,
}: {
  label: string
  value: string | number
  hint?: string
  tone?: string
  icon?: LucideIcon
  progress?: number
}) {
  const t = toneClasses[tone] ?? toneClasses.primary
  return (
    <StaggerItem>
      <HoverCard className="glass group relative h-full overflow-hidden rounded-2xl border border-border p-4">
        <div className={cn("absolute -right-6 -top-6 size-20 rounded-full blur-2xl", t.bg)} />
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span className={cn("grid size-8 place-items-center rounded-lg ring-1", t.bg, t.ring, t.text)}>
              <Icon className="size-4" />
            </span>
          )}
        </div>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        {typeof progress === "number" && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", t.dot)} style={{ width: `${progress}%` }} />
          </div>
        )}
      </HoverCard>
    </StaggerItem>
  )
}
