"use client"

import { useEffect, useState } from "react"
import { Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react"
import api from "@/lib/api/axios"

interface MissedTask {
  taskId: string
  title: string
  deadline: string
}

interface StudentMissed {
  userId: string
  name: string
  email: string
  missedCount: number
  tasks: MissedTask[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AiInsights() {
  const [students, setStudents] = useState<StudentMissed[]>([])
  const [totalMissed, setTotalMissed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get("/admin/missed-commitments")
      .then((res) => {
        setStudents(res.data?.students || [])
        setTotalMissed(res.data?.totalMissed || 0)
      })
      .catch((err) => console.error("Failed to load missed commitments", err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="glass relative h-full overflow-hidden rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
          <Sparkles className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">AI Insights Panel</h2>
          <p className="text-xs text-muted-foreground">Missed commitments detected from meetings</p>
        </div>
      </div>

      {loading ? (
        <p className="px-1 py-8 text-center text-xs text-muted-foreground">Loading insights…</p>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-3 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-success/10 text-success ring-1 ring-success/25">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="text-sm font-medium">All caught up</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            No overdue meeting commitments right now. Every promise made in a weekly sync is still
            within its deadline.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="mb-1 text-xs text-muted-foreground">
            <span className="font-semibold text-warning">{totalMissed}</span> overdue commitment
            {totalMissed === 1 ? "" : "s"} across <span className="font-semibold text-foreground">{students.length}</span> student
            {students.length === 1 ? "" : "s"}
          </p>
          {students.map((s) => (
            <div
              key={s.userId}
              className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-destructive/15 text-[11px] font-semibold text-destructive ring-1 ring-destructive/25">
                {initials(s.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <AlertTriangle className="size-3.5 shrink-0 text-destructive" />
                </div>
                <p className="text-xs text-destructive">
                  Missed {s.missedCount} commitment{s.missedCount === 1 ? "" : "s"}
                  {s.missedCount >= 3 ? " in a row" : ""}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  Latest: "{s.tasks[0]?.title}" · was due {formatDate(s.tasks[0]?.deadline)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}