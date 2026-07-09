"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X, CalendarDays, ArrowRight } from "lucide-react"
import type { LeaveRequest } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const statusMeta = {
  pending: { label: "Pending", cls: "bg-warning/15 text-warning" },
  approved: { label: "Approved", cls: "bg-success/15 text-success" },
  rejected: { label: "Rejected", cls: "bg-danger/15 text-danger" },
}

export function LeaveCard({
  req,
  compact = false,
  readOnly = false,
  onApprove,
  onReject,
}: {
  req: LeaveRequest
  compact?: boolean
  readOnly?: boolean
  onApprove?: () => void
  onReject?: () => void
}) {
  const [localStatus, setLocalStatus] = useState(req.status)
  const controlled = Boolean(onApprove || onReject)
  const status = controlled ? req.status : localStatus
  const meta = statusMeta[status]

  const approve = () => (controlled ? onApprove?.() : setLocalStatus("approved"))
  const reject = () => (controlled ? onReject?.() : setLocalStatus("rejected"))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-border p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-leave/15 text-xs font-semibold text-leave">
              {req.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{req.student}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" /> {req.dates} · {req.team}
            </p>
          </div>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", meta.cls)}>{meta.label}</span>
      </div>

      <p className="mt-3 rounded-lg bg-card/50 px-3 py-2 text-sm">{req.reason}</p>

      {!compact && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card/30 p-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              This week&apos;s progress
            </p>
            <p className="text-xs text-foreground/90">{req.weekProgress}</p>
          </div>
          <div className="rounded-lg border border-border bg-card/30 p-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Next week&apos;s plan
            </p>
            <p className="text-xs text-foreground/90">{req.nextPlan}</p>
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Submitted {req.submitted}</span>
        {status === "pending" && !readOnly ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
              onClick={reject}
            >
              <X className="size-4" /> Reject
            </Button>
            <Button size="sm" className="gap-1.5" onClick={approve}>
              <Check className="size-4" /> Approve
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => !controlled && setLocalStatus("pending")}
          >
            Reset <ArrowRight className="size-3" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
