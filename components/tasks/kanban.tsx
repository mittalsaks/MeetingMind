"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CalendarDays,
  GitCommitVertical,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Clock4,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import api from "@/lib/api/axios"
function getRoleFromToken(): string | null {
  try {
    const user = sessionStorage.getItem("user")
    if (!user) return null
    return JSON.parse(user).role || null
  } catch {
    return null
  }
}
type Priority = "High" | "Medium" | "Low"
type Status = "pending" | "waiting_verification" | "verified" | "rejected"

interface Task {
  _id: string
  title: string
  userId: { _id: string; name: string } | null
  priority: Priority
  deadline?: string
  status: Status
  meetingId?: string
}

const columns: { key: Status; label: string; tone: string; desc: string }[] = [
  { key: "pending", label: "Pending", tone: "text-muted-foreground", desc: "Promised, in progress" },
  { key: "waiting_verification", label: "Waiting Verification", tone: "text-warning", desc: "Marked done by student" },
  { key: "verified", label: "Verified", tone: "text-success", desc: "Mentor confirmed" },
]

const priorityCls: Record<Priority, string> = {
  High: "bg-danger/15 text-danger",
  Medium: "bg-warning/15 text-warning",
  Low: "bg-muted text-muted-foreground",
}

const dotCls: Record<Status, string> = {
  pending: "bg-muted-foreground",
  waiting_verification: "bg-warning",
  verified: "bg-success",
  rejected: "bg-danger",
}

function initials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"
}

function TaskCard({
  task,
  onVerify,
  onReject,
  onComplete,
  isAdmin,
  busy,
}: {
  task: Task
  onVerify: () => void
  onReject: () => void
  onComplete: () => void
  isAdmin: boolean
  busy: boolean
}) {
  const name = task.userId?.name || "Unknown"
  const canVerify = task.status === "waiting_verification"

  return (
    <motion.div
      layout
      layoutId={task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="glass group rounded-xl border border-border p-3.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-muted-foreground">{name}</span>
        </div>
        {task.priority && (
          <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-medium", priorityCls[task.priority])}>
            {task.priority}
          </span>
        )}
      </div>

      <p className="mt-2.5 text-sm font-medium leading-snug">{task.title}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        {task.deadline && (
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {new Date(task.deadline).toLocaleDateString()}
          </span>
        )}
        {task.meetingId && (
          <span className="flex items-center gap-1">
            <GitCommitVertical className="size-3" /> Meeting
          </span>
        )}
      </div>

      {task.status === "waiting_verification" && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-warning/12 px-1.5 py-0.5 text-[10px] font-medium text-warning">
            <CheckCircle2 className="size-3" /> Marked completed
          </span>
        </div>
      )}
      {task.status === "verified" && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-success/12 px-1.5 py-0.5 text-[10px] font-medium text-success">
            <ShieldCheck className="size-3" /> Verified
          </span>
        </div>
      )}
      {task.status === "rejected" && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-danger/12 px-1.5 py-0.5 text-[10px] font-medium text-danger">
            Rejected
          </span>
        </div>
      )}

      {canVerify && isAdmin && (
  <div className="mt-3 flex gap-2 opacity-0 transition-all group-hover:opacity-100">
    <button
      onClick={onVerify}
      disabled={busy}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/10 py-1.5 text-[11px] font-medium text-success transition-all hover:bg-success/20 disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <>Verify <ArrowRight className="size-3" /></>}
    </button>
    <button
      onClick={onReject}
      disabled={busy}
      className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card/40 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-all hover:border-danger/40 hover:text-danger disabled:opacity-50"
    >
      Reject
    </button>
  </div>
)}

{task.status === "pending" && !isAdmin && (
  <div className="mt-3 flex gap-2 opacity-0 transition-all group-hover:opacity-100">
    <button
      onClick={onComplete}
      disabled={busy}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-1.5 text-[11px] font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <>Mark Complete <ArrowRight className="size-3" /></>}
    </button>
  </div>
)}
    </motion.div>
  )
}

export function Kanban() {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const isAdmin = getRoleFromToken() === "admin"
  useEffect(() => {
    api.get("/tasks")
      .then((res) => setItems(res.data?.tasks || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function verify(id: string) {
    const task = items.find((t) => t._id === id)
    if (!task) return

    setBusyId(id)
    try {
      const res = await api.put(`/tasks/${id}/verify`)
      const updated = res.data?.task
      setItems((prev) => prev.map((t) => (t._id === id ? { ...t, status: updated?.status || "verified" } : t)))
    } catch (err) {
      console.error("Failed to verify task", err)
    } finally {
      setBusyId(null)
    }
  }

  async function reject(id: string) {
  const task = items.find((t) => t._id === id)
  if (!task) return

  setBusyId(id)
  try {
    const res = await api.put(`/tasks/${id}/reject`)
    const updated = res.data?.task
    setItems((prev) => prev.map((t) => (t._id === id ? { ...t, status: updated?.status || "rejected" } : t)))
  } catch (err) {
    console.error("Failed to reject task", err)
  } finally {
    setBusyId(null)
  }
}

async function complete(id: string) {
  const task = items.find((t) => t._id === id)
  if (!task) return

  setBusyId(id)
  try {
    const res = await api.put(`/tasks/${id}/complete`)
    const updated = res.data?.task
    setItems((prev) => prev.map((t) => (t._id === id ? { ...t, status: updated?.status || "waiting_verification" } : t)))
  } catch (err) {
    console.error("Failed to mark task complete", err)
  } finally {
    setBusyId(null)
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => {
        const colTasks = items.filter((t) => t.status === col.key)
        return (
          <div key={col.key} className="flex flex-col rounded-2xl border border-border bg-card/30 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn("size-2 rounded-full", dotCls[col.key])} />
                <h2 className={cn("text-sm font-semibold", col.tone)}>{col.label}</h2>
                <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>
            </div>
            <p className="mb-3 px-1 text-[11px] text-muted-foreground">{col.desc}</p>

            <div className="flex min-h-32 flex-1 flex-col gap-2.5">
              <AnimatePresence mode="popLayout">
                {colTasks.length ? (
                  colTasks.map((t) => (
                    <TaskCard
  key={t._id}
  task={t}
  onVerify={() => verify(t._id)}
  onReject={() => reject(t._id)}
  onComplete={() => complete(t._id)}
  isAdmin={isAdmin}
  busy={busyId === t._id}
/>
                  ))
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                    <Clock4 className="size-5 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">No tasks here</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}