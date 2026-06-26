"use client"

import { useEffect, useState } from "react"
import { ListTodo, ClipboardList, CalendarCheck2, CalendarClock, CheckCircle2, History } from "lucide-react"
import { FadeIn, Stagger } from "@/components/motion"
import { StatCard } from "@/components/stat-card"
import { DailyUpdateForm } from "@/components/student/daily-update-form"
import { Commitments } from "@/components/student/commitments"
import { useAuthStore } from "@/lib/store/authStore"
import { studentApi } from "@/lib/api/student"

const statIcons = {
  today: ListTodo,
  pending: ClipboardList,
  attendance: CalendarCheck2,
  meeting: CalendarClock,
  update: CheckCircle2,
} as const

export default function StudentDashboard() {
  const user = useAuthStore((s) => s.user)
  const [tasks, setTasks] = useState<any[]>([])
  const [meetings, setMeetings] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [todayUpdate, setTodayUpdate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [tasksRes, updatesRes, meetingsRes, attendanceRes] = await Promise.all([
          studentApi.getTasks(),
          studentApi.getDailyUpdates(),
          studentApi.getMeetings(),
          studentApi.getAttendance(),
        ])
        setTasks(tasksRes.data.tasks || [])
        setMeetings(meetingsRes.data.meetings || [])
        setAttendance(attendanceRes.data.records || [])

        const today = new Date().toDateString()
        const todayUpd = (updatesRes.data.updates || []).find(
          (u: any) => new Date(u.createdAt).toDateString() === today
        )
        setTodayUpdate(todayUpd || null)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const pendingCommitments = tasks.filter((t) => t.status !== "verified")
  const presentCount = attendance.filter((a) => a.status === "present").length
  const totalCount = attendance.length
  const attendanceLabel = totalCount === 0 ? "No data" : `${presentCount}/${totalCount}`

  // Upcoming meeting — nearest future scheduledDate
  const upcomingMeeting = meetings
    .filter((m) => new Date(m.scheduledDate) >= new Date())
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())[0] || null

  const stats = [
    { key: "today", label: "Today's Tasks", value: pendingTasks.length, tone: "primary", hint: "Pending / in progress" },
    { key: "pending", label: "Pending Commitments", value: pendingCommitments.length, tone: "warning", hint: "From weekly syncs" },
    { key: "attendance", label: "Attendance", value: attendanceLabel, tone: "success", hint: totalCount === 0 ? "No meetings yet" : "Present / Total" },
    { key: "meeting", label: "Upcoming Meeting", value: upcomingMeeting ? upcomingMeeting.scheduledTime : "None", tone: "primary", hint: upcomingMeeting ? new Date(upcomingMeeting.scheduledDate).toDateString() : "Check meetings tab" },
    { key: "update", label: "Daily Update", value: todayUpdate ? "Done" : "Pending", tone: todayUpdate ? "success" : "danger", hint: todayUpdate ? "Submitted today" : "Not submitted yet" },
  ]

  return (
    <div className="mx-auto max-w-7xl">
      <FadeIn className="glass-strong relative mb-6 overflow-hidden rounded-3xl border border-border p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
              {user?.workspaceName}
            </span>
            <h1 className="mt-4 text-pretty text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Log today&apos;s work to stay on track.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-center ${todayUpdate ? "border-success/25 bg-success/8" : "border-danger/25 bg-danger/8"}`}>
            <p className="text-xs text-muted-foreground">Today&apos;s status</p>
            <p className={`mt-0.5 text-sm font-semibold ${todayUpdate ? "text-success" : "text-danger"}`}>
              {todayUpdate ? "Update submitted" : "Not submitted"}
            </p>
          </div>
        </div>
      </FadeIn>

      <Stagger className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {stats.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={loading ? "..." : s.value}
            hint={s.hint}
            tone={s.tone}
            icon={statIcons[s.key as keyof typeof statIcons]}
          />
        ))}
      </Stagger>

      <div className="grid gap-4 lg:grid-cols-2">
        <DailyUpdateForm />
        <div className="glass rounded-2xl border border-border p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
              <History className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Meeting History</h2>
              <p className="text-xs text-muted-foreground">Your previous meetings</p>
            </div>
          </div>
          {meetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings yet.</p>
          ) : (
            <div className="relative space-y-1">
              <span className="absolute bottom-2 left-[7px] top-2 w-px bg-border" aria-hidden />
              {meetings.slice(0, 5).map((m: any) => (
                <div key={m._id} className="relative flex gap-4 rounded-lg p-2 transition-colors hover:bg-accent/40">
                  <span className="relative z-10 mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-success bg-background" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.title || "Weekly Sync"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.scheduledDate).toDateString()} {m.scheduledTime ? `at ${m.scheduledTime}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Commitments />
      </div>
    </div>
  )
}