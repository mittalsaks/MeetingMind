"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, Clock, CalendarDays, GitCommitVertical, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { studentApi } from "@/lib/api/student"

interface Task {
  _id: string
  title: string
  source: "meeting" | "manual"
  deadline?: string
  status: "pending" | "waiting_verification" | "verified" | "rejected"
  priority: "Low" | "Medium" | "High"
}

const priorityCls: Record<string, string> = {
  High: "bg-danger/15 text-danger",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-muted text-muted-foreground",
}

function formatDeadline(d?: string) {
  if (!d) return "No deadline"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function CommitmentRow({ task, onComplete }: { task: Task; onComplete: (id: string) => void }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleComplete() {
    setSubmitting(true)
    setError("")
    try {
      await studentApi.markTaskComplete(task._id)
      onComplete(task._id)
    } catch (e: any) {
      setError(e.response?.data?.message || "Failed to mark complete")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      layout
      className="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-3.5 transition-colors hover:bg-card/70 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border",
            task.status === "verified" ? "border-success bg-success text-success-foreground" : "border-border",
          )}
        >
          {task.status === "verified" && <Check className="size-3.5" />}
        </span>
        <div className="min-w-0">
          <p className={cn("text-sm font-medium", task.status === "verified" && "text-muted-foreground line-through")}>
            {task.title}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3" /> {formatDeadline(task.deadline)}
            </span>
            <span className="flex items-center gap-1">
              <GitCommitVertical className="size-3" /> {task.source}
            </span>
          </div>
          {error && <p className="mt-1 text-[11px] text-danger">{error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 pl-8 sm:pl-0">
        <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", priorityCls[task.priority])}>
          {task.priority}
        </span>
        {task.status === "waiting_verification" ? (
          <span className="flex items-center gap-1 rounded-md bg-warning/12 px-2 py-0.5 text-[11px] font-medium text-warning">
            <Clock className="size-3" /> Verifying
          </span>
        ) : task.status === "verified" ? (
          <span className="flex items-center gap-1 rounded-md bg-success/12 px-2 py-0.5 text-[11px] font-medium text-success">
            <Check className="size-3" /> Verified
          </span>
        ) : task.status === "rejected" ? (
          <span className="rounded-md bg-danger/12 px-2 py-0.5 text-[11px] font-medium text-danger">
            Rejected
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={submitting}
            onClick={handleComplete}
          >
            {submitting ? <Loader2 className="size-3 animate-spin" /> : "Mark Complete"}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

export function Commitments() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await studentApi.getTasks()
      setTasks(res.data?.tasks || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleComplete(id: string) {
    setTasks((prev) => prev.map((t) => (t._id === id ? { ...t, status: "waiting_verification" } : t)))
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
        Loading commitments...
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Your Commitments</h2>
          <p className="text-xs text-muted-foreground">Auto-extracted from your weekly meetings</p>
        </div>
        <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-medium text-primary">
          {tasks.length} tasks
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No commitments yet.</p>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((t) => (
            <CommitmentRow key={t._id} task={t} onComplete={handleComplete} />
          ))}
        </div>
      )}
    </div>
  )
}
