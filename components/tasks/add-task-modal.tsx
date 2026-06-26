"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import api from "@/lib/api/axios"
import { workspaceApi } from "@/lib/api/workspace"

type Student = {
  _id: string
  name: string
  email: string
  isActive: boolean
}

type Priority = "Low" | "Medium" | "High"

export function AddTaskModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [students, setStudents] = useState<Student[]>([])
  const [userId, setUserId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [deadline, setDeadline] = useState("")
  const [priority, setPriority] = useState<Priority>("Medium")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    workspaceApi
      .getStudents()
      .then(({ data }) => setStudents((data.students || []).filter((s: Student) => s.isActive)))
      .catch((err: any) => console.error("Failed to load students", err))
  }, [open])

  if (!open) return null

  const reset = () => {
    setUserId("")
    setTitle("")
    setDescription("")
    setDeadline("")
    setPriority("Medium")
    setError("")
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!userId) {
      setError("Select a student")
      return
    }
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    setSubmitting(true)
    try {
      await api.post("/tasks", {
        userId,
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        priority,
      })
      reset()
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create task")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-strong w-full max-w-md rounded-2xl border border-border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add Task</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Student</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card/50 px-3 text-sm"
              required
            >
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finish API integration"
              required
              className="h-10 bg-card/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more detail…"
              className="min-h-20 w-full rounded-lg border border-border bg-card/50 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Deadline (optional)
              </label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-10 bg-card/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="h-10 w-full rounded-lg border border-border bg-card/50 px-3 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}