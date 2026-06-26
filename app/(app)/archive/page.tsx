"use client"

import { useEffect, useMemo, useState } from "react"
import { Archive as ArchiveIcon, Search, Clock, Users, FileText, ListChecks, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { FadeIn } from "@/components/motion"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  createdAt: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export default function ArchivePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
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
    load()
  }, [])

  // Archive = past meetings only (anything already confirmed/completed/cancelled/rescheduled away)
  const past = useMemo(
    () => meetings.filter((m) => m.status !== "scheduled"),
    [meetings]
  )

  const filtered = useMemo(() => {
    if (!query.trim()) return past
    const q = query.toLowerCase()
    return past.filter((m) => (m.summary || "").toLowerCase().includes(q))
  }, [past, query])

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading archive...</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Meeting Archive"
        subtitle={`${past.length} past meeting${past.length === 1 ? "" : "s"} with attendance and summaries.`}
      />

      <FadeIn className="mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search summaries…"
            className="h-9 pl-8"
          />
        </div>
      </FadeIn>

      <FadeIn className="glass overflow-hidden rounded-2xl border border-border">
        {/* header row (desktop) */}
        <div className="hidden grid-cols-12 gap-4 border-b border-border px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid">
          <div className="col-span-3">Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Attendance</div>
          <div className="col-span-1">Commitments</div>
          <div className="col-span-4">Summary</div>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((m) => (
            <div
              key={m._id}
              className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-accent/40 lg:grid-cols-12 lg:items-center"
            >
              <div className="flex items-center gap-1.5 text-sm font-medium lg:col-span-3">
                <Clock className="size-3.5 text-muted-foreground" />
                {formatDate(m.scheduledDate)} · {m.scheduledTime}
              </div>

              <div className="lg:col-span-2">
                <Badge variant="outline" className="capitalize">
                  {m.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-sm lg:col-span-2">
                <Users className="size-3.5 text-muted-foreground" />
                <span className={m.attendanceCount < m.totalInvited ? "text-warning" : "text-success"}>
                  {m.attendanceCount}/{m.totalInvited}
                </span>
                <span className="text-xs text-muted-foreground">spoke</span>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground lg:col-span-1">
                <ListChecks className="size-3.5" />
                Not tracked yet
              </div>

              <div className="flex items-start gap-1.5 text-sm text-muted-foreground lg:col-span-4">
                <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/70" />
                <span className="line-clamp-2">{m.summary || "—"}</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              {past.length === 0 ? "No past meetings yet." : "No meetings match your search."}
            </div>
          ) : null}
        </div>
      </FadeIn>
    </div>
  )
}