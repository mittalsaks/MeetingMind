"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarClock, Check, RotateCcw, X, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UpcomingMeeting() {
  const [status, setStatus] = useState<"idle" | "confirmed" | "cancelled">("idle")

  return (
    <div className="glass relative overflow-hidden rounded-2xl border border-border p-5">
      <div className="absolute -right-10 -top-10 size-32 rounded-full bg-primary/15 blur-3xl" />
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <CalendarClock className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Upcoming Weekly Meeting</h2>
            <p className="text-xs text-muted-foreground">Cohort B · Google Meet</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {status === "confirmed" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success"
            >
              Confirmed
            </motion.span>
          )}
          {status === "cancelled" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-danger/15 px-2.5 py-1 text-[11px] font-medium text-danger"
            >
              Cancelled
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <p className="text-3xl font-semibold tracking-tight">Thursday</p>
        <p className="pb-1 text-lg font-medium text-primary">6:00 PM</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">8 students invited · transcript auto-capture enabled</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => setStatus("confirmed")}>
          <Check className="size-4" /> Confirm Meeting
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setStatus("idle")}>
          <RotateCcw className="size-4" /> Reschedule
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="gap-1.5 text-danger hover:bg-danger/10 hover:text-danger"
          onClick={() => setStatus("cancelled")}
        >
          <X className="size-4" /> Cancel
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground">
        <Video className="size-4 text-primary" />
        Join link shared automatically 10 minutes before start.
      </div>
    </div>
  )
}
