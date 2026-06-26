import { cn } from "@/lib/utils"
import type { MemberStatus, UpdateStatus } from "@/lib/mock-data"

const dotBase = "size-1.5 rounded-full"

const memberStyles: Record<MemberStatus, { label: string; wrap: string; dot: string }> = {
  "on-track": {
    label: "On track",
    wrap: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
  },
  "at-risk": {
    label: "At risk",
    wrap: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  blocked: {
    label: "Blocked",
    wrap: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
}

const updateStyles: Record<UpdateStatus, { label: string; wrap: string; dot: string }> = {
  submitted: {
    label: "Submitted",
    wrap: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    dot: "bg-emerald-400",
  },
  late: {
    label: "Late",
    wrap: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    dot: "bg-amber-400",
  },
  missing: {
    label: "Missing",
    wrap: "border-destructive/30 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
}

function Pill({
  label,
  wrap,
  dot,
}: {
  label: string
  wrap: string
  dot: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        wrap
      )}
    >
      <span className={cn(dotBase, dot)} aria-hidden />
      {label}
    </span>
  )
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const s = memberStyles[status]
  return <Pill label={s.label} wrap={s.wrap} dot={s.dot} />
}

export function UpdateStatusBadge({ status }: { status: UpdateStatus }) {
  const s = updateStyles[status]
  return <Pill label={s.label} wrap={s.wrap} dot={s.dot} />
}

const riskStyles = {
  high: "border-destructive/30 bg-destructive/10 text-destructive",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-400",
}

export function RiskBadge({ level }: { level: "high" | "medium" | "low" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        riskStyles[level]
      )}
    >
      {level} risk
    </span>
  )
}
