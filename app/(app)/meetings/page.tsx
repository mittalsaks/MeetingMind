"use client"

import { useEffect, useState } from "react"
import { CalendarClock, Video, Users, FileText, ListChecks, Loader2, Sparkles, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { FadeIn } from "@/components/motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LiveMonitor } from "@/components/meetings/live-monitor"
import api from "@/lib/api/axios"

interface Meeting {
  _id: string
  scheduledDate: string
  scheduledTime: string
  googleMeetLink?: string
  status: "scheduled" | "confirmed" | "rescheduled" | "completed" | "cancelled"
  attendanceCount: number
  totalInvited: number
  summary?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

// ---- Process Transcript Modal ----
function ProcessTranscriptModal({
  meeting,
  onClose,
  onSuccess,
}: {
  meeting: Meeting
  onClose: () => void
  onSuccess: () => void
}) {
  const [transcript, setTranscript] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!transcript.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const res = await api.post(`/meetings/${meeting._id}/process-transcript`, { transcript })
      setResult(res.data?.message || "Transcript processed")
      setTimeout(() => {
        onSuccess()
      }, 1200)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to process transcript. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <FadeIn className="glass-strong w-full max-w-lg rounded-2xl border border-border p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold">Process Transcript</h3>
              <p className="text-xs text-muted-foreground">
                {formatDate(meeting.scheduledDate)} · {meeting.scheduledTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {result ? (
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
            ✓ {result}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              required
              rows={8}
              placeholder="Paste the raw meeting transcript here. AI will identify each student's completed work and next commitment, and auto-create tasks."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-background/60 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="gap-1.5" disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Extract Commitments
              </Button>
            </div>
          </form>
        )}
      </FadeIn>
    </div>
  )
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ scheduledDate: "", scheduledTime: "", googleMeetLink: "" })
  const [submitting, setSubmitting] = useState(false)
  const [transcriptMeeting, setTranscriptMeeting] = useState<Meeting | null>(null)

  async function load() {
    try {
      const res = await api.get("/meetings")
      setMeetings(res.data?.meetings || [])
    } catch (err) {
      console.error("Failed to load meetings", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post("/meetings", form)
      setForm({ scheduledDate: "", scheduledTime: "", googleMeetLink: "" })
      setShowForm(false)
      await load()
    } catch (err) {
      console.error("Failed to schedule meeting", err)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirm(id: string) {
    try {
      await api.put(`/meetings/${id}/confirm`)
      await load()
    } catch (err) {
      console.error("Failed to confirm meeting", err)
    }
  }

  function meetingDateTime(m: Meeting) {
    return new Date(`${new Date(m.scheduledDate).toISOString().slice(0, 10)}T${m.scheduledTime}`).getTime()
  }

  function handleTranscriptSuccess() {
    setTranscriptMeeting(null)
    load()
  }

  const upcoming = meetings
    .filter((m) => m.status === "scheduled" || m.status === "confirmed")
    .sort((a, b) => meetingDateTime(a) - meetingDateTime(b))[0]
  const history = meetings.filter((m) => m._id !== upcoming?._id)

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading meetings...</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Weekly Meetings"
        subtitle="Schedule syncs, monitor live transcripts, and review auto-extracted commitments."
      >
        <Button variant="outline" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <CalendarClock className="size-4" /> Schedule Meeting
        </Button>
      </PageHeader>

      {showForm && (
        <FadeIn className="glass mb-4 rounded-2xl border border-border p-5">
          <form onSubmit={handleSchedule} className="grid gap-3 sm:grid-cols-3">
            <Input
              type="date"
              required
              value={form.scheduledDate}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
            />
            <Input
              type="time"
              required
              value={form.scheduledTime}
              onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
            />
            <Input
              type="url"
              placeholder="Google Meet link"
              required
              value={form.googleMeetLink}
              onChange={(e) => setForm((f) => ({ ...f, googleMeetLink: e.target.value }))}
            />
            <Button type="submit" disabled={submitting} className="sm:col-span-3 gap-1.5">
              {submitting && <Loader2 className="size-4 animate-spin" />} Confirm Schedule
            </Button>
          </form>
        </FadeIn>
      )}

      {/* Next sync card */}
      {upcoming ? (
        <FadeIn className="glass-strong relative mb-4 overflow-hidden rounded-2xl border border-border p-5 sm:p-6">
          <div className="absolute -right-12 -top-16 size-56 rounded-full bg-primary/12 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <CalendarClock className="size-7" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next sync</p>
                <p className="text-xl font-semibold tracking-tight">
                  {formatDate(upcoming.scheduledDate)} · {upcoming.scheduledTime}
                </p>
                <p className="text-sm text-muted-foreground">
                  {upcoming.totalInvited} students invited · {upcoming.status}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {upcoming.status === "scheduled" && (
                <Button size="sm" className="gap-1.5" onClick={() => handleConfirm(upcoming._id)}>
                  <Video className="size-4" /> Confirm & Send Reminders
                </Button>
              )}
              {upcoming.googleMeetLink && (
                <a
                  href={upcoming.googleMeetLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background/60 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Open Meet
                </a>
              )}
            </div>
          </div>
        </FadeIn>
      ) : (
        <FadeIn className="glass mb-4 rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
          No upcoming meeting scheduled.
        </FadeIn>
      )}

      <div className="mb-6">
        <LiveMonitor />
      </div>

      {/* History table */}
      <FadeIn className="glass overflow-hidden rounded-2xl border border-border">
        <div className="border-b border-border p-5">
          <h2 className="text-sm font-semibold">Meeting History</h2>
          <p className="text-xs text-muted-foreground">Past syncs with attendance and extracted commitments</p>
        </div>

        {history.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No past meetings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Students Present</th>
                  <th className="px-5 py-3 font-medium">Commitments</th>
                  <th className="px-5 py-3 font-medium">Summary</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((m) => (
                  <tr key={m._id} className="transition-colors hover:bg-accent/40">
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium">
                      {formatDate(m.scheduledDate)} · {m.scheduledTime}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="size-4 text-muted-foreground" />
                        <span className={m.attendanceCount < m.totalInvited ? "text-warning" : "text-success"}>
                          {m.attendanceCount}/{m.totalInvited}
                        </span>
                        <span className="text-xs text-muted-foreground">spoke</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <ListChecks className="size-4" /> Not tracked yet
                      </span>
                    </td>
                   <td className="max-w-sm px-5 py-3.5 text-muted-foreground">
                      <span className="flex items-start gap-1.5">
                        <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
                        <span className="line-clamp-1">{m.summary || "—"}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {m.status === "scheduled" && (
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleConfirm(m._id)}>
                            <Video className="size-4" /> Confirm & Send
                          </Button>
                        )}
                        {(m.status === "confirmed" || m.status === "completed" || m.status === "rescheduled") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => setTranscriptMeeting(m)}
                          >
                            <Sparkles className="size-4" /> Process Transcript
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FadeIn>

      {transcriptMeeting && (
        <ProcessTranscriptModal
          meeting={transcriptMeeting}
          onClose={() => setTranscriptMeeting(null)}
          onSuccess={handleTranscriptSuccess}
        />
      )}
    </div>
  )
}