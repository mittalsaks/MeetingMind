"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CalendarClock, Check, Loader2, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api/axios"

interface Meeting {
  _id: string
  scheduledDate: string
  scheduledTime: string
  googleMeetLink?: string
  status: "scheduled" | "confirmed" | "rescheduled" | "completed" | "cancelled"
  totalInvited: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long" })
}

function meetingDateTime(m: Meeting) {
  return new Date(`${new Date(m.scheduledDate).toISOString().slice(0, 10)}T${m.scheduledTime}`).getTime()
}

export function UpcomingMeeting() {
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  async function load() {
    try {
      const res = await api.get("/meetings")
      const meetings: Meeting[] = res.data?.meetings || []
      const now = Date.now()
      const upcoming = meetings
        .filter((m) => (m.status === "scheduled" || m.status === "confirmed") && meetingDateTime(m) >= now)
        .sort((a, b) => meetingDateTime(a) - meetingDateTime(b))[0]
      setMeeting(upcoming || null)
    } catch (err) {
      console.error("Failed to load upcoming meeting", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleConfirm() {
    if (!meeting) return
    setConfirming(true)
    try {
      await api.put(`/meetings/${meeting._id}/confirm`)
      await load()
    } catch (err) {
      console.error("Failed to confirm meeting", err)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="glass relative overflow-hidden rounded-2xl border border-border p-5">
        <p className="text-sm text-muted-foreground">Loading meeting...</p>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="glass relative overflow-hidden rounded-2xl border border-border p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <CalendarClock className="size-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Upcoming Weekly Meeting</h2>
            <p className="text-xs text-muted-foreground">No meeting scheduled</p>
          </div>
        </div>
      </div>
    )
  }

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
            <p className="text-xs text-muted-foreground">{meeting.totalInvited} students invited</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          {meeting.status === "confirmed" && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success"
            >
              Confirmed
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <p className="text-3xl font-semibold tracking-tight">{formatDate(meeting.scheduledDate)}</p>
        <p className="pb-1 text-lg font-medium text-primary">{meeting.scheduledTime}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {meeting.status === "scheduled" && (
          <Button size="sm" className="gap-1.5" onClick={handleConfirm} disabled={confirming}>
            {confirming ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Confirm Meeting
          </Button>
        )}
      </div>

      {meeting.googleMeetLink && (
        <a
          href={meeting.googleMeetLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card/40 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent"
        >
          <Video className="size-4 text-primary" />
          Join link
        </a>
      )}
    </div>
  )
}