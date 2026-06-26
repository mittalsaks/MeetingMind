"use client"
import api from "@/lib/api/axios"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Check } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { adminApi } from "@/lib/api/admin"

interface Student {
  _id: string
  name: string
  email: string
  isActive: boolean
}

interface DailyUpdateRecord {
  _id: string
  userId?: { _id: string; name: string; email: string }
  createdAt: string
}

function initials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??"
}

function daysSince(date: Date) {
  const ms = Date.now() - date.getTime()
  return Math.floor(ms / 86400000)
}

function formatLastUpdate(date: Date | null) {
  if (!date) return "Never"
  const days = daysSince(date)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

export function MissingUpdates() {
  const [students, setStudents] = useState<Student[]>([])
  const [updates, setUpdates] = useState<DailyUpdateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sent, setSent] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([adminApi.getStudents(), adminApi.getDailyUpdates()])
      .then(([studentsRes, updatesRes]) => {
        setStudents(studentsRes.data?.students || [])
        setUpdates(updatesRes.data?.updates || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const missing = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return students
      .filter((s) => s.isActive)
      .map((s) => {
        const theirUpdates = updates
          .filter((u) => u.userId?._id === s._id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        const lastUpdate = theirUpdates[0] ? new Date(theirUpdates[0].createdAt) : null
        const updatedToday = lastUpdate ? lastUpdate >= today : false
        const missingDays = lastUpdate ? daysSince(lastUpdate) : null

        return { ...s, lastUpdate, updatedToday, missingDays }
      })
      .filter((s) => !s.updatedToday)
  }, [students, updates])

  if (loading) {
    return (
      <div className="glass rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
        Loading...
      </div>
    )
  }

  return (
    <div className="glass overflow-hidden rounded-2xl border border-border">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold">Students Missing Updates</h2>
          <p className="text-xs text-muted-foreground">Nudge students who haven&apos;t reported in</p>
        </div>
        <span className="rounded-full bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger">
          {missing.length} flagged
        </span>
      </div>

      <div className="divide-y divide-border">
        {missing.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            Everyone has submitted today&apos;s update. 🎉
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_auto] gap-3 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid">
              <span>Student</span>
              <span>Last Update</span>
              <span>Missing</span>
              <span className="text-right">Action</span>
            </div>

            {missing.map((s, i) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-2 items-center gap-3 px-5 py-3 transition-colors hover:bg-accent/40 sm:grid-cols-[1.6fr_1fr_0.8fr_auto]"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-danger/15 text-xs font-semibold text-danger">
                      {initials(s.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                  </div>
                </div>
                <span className="hidden text-sm text-muted-foreground sm:block">
                  {formatLastUpdate(s.lastUpdate)}
                </span>
                <span className="hidden sm:block">
                  <span className="rounded-md bg-danger/12 px-2 py-0.5 text-xs font-medium text-danger">
                    {s.missingDays === null ? "Never updated" : `${s.missingDays}d`}
                  </span>
                </span>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant={sent[s._id] ? "secondary" : "outline"}
                    disabled={sent[s._id]}
                    className={cn("gap-1.5", sent[s._id] && "text-success")}
                    onClick={async () => {
                            try {
                              await api.post(`/admin/send-reminder/${s._id}`)
                              setSent((p) => ({ ...p, [s._id]: true }))
                            } catch (err) {
                              console.error('Failed to send reminder', err)
                            }
                          }}
                  >
                    {sent[s._id] ? (
                      <>
                        <Check className="size-3.5" /> Sent
                      </>
                    ) : (
                      <>
                        <Bell className="size-3.5" /> Send Reminder
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
