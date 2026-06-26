"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, CalendarCheck, Target, Activity, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { FadeIn } from "@/components/motion"
import { AdminOnly } from "@/components/auth/admin-only"
import { adminApi } from "@/lib/api/admin"
import api from "@/lib/api/axios"

const ACCENT = "oklch(0.7 0.13 233)"
const EMERALD = "oklch(0.7 0.15 162)"
const AMBER = "oklch(0.78 0.16 78)"

interface AttendanceRecord {
  userId: string
  meetingId: string
  date: string
  status: "present" | "absent" | "leave_approved"
  verbalUpdateGiven: boolean
  joinedMeeting: boolean
  createdAt: string
}

interface Task {
  _id: string
  status: "pending" | "waiting_verification" | "verified" | "rejected"
  createdAt: string
  verifiedAt?: string
}

interface DailyUpdate {
  _id: string
  date: string
  createdAt: string
}

interface MeetingRow {
  _id: string
  scheduledDate: string
  createdAt: string
}

interface Student {
  _id: string
  isActive: boolean
  inviteAccepted: boolean
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
      <p className="mb-1 font-medium text-foreground">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto font-medium text-foreground tabular-nums">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 12,
  tickLine: false,
  axisLine: false,
}

function ChartCard({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string
  subtitle?: string
  empty?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="h-64 w-full">
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Not enough data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string
  value: string
  icon: React.ElementType
  hint?: string
}) {
  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

// ISO week label like "Jun 16"
function weekLabel(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function startOfWeek(d: Date) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function AnalyticsContent() {
  const [loading, setLoading] = useState(true)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [meetings, setMeetings] = useState<MeetingRow[]>([])
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [attRes, taskRes, updRes, meetRes, stuRes] = await Promise.all([
          api.get("/attendance"),
          api.get("/tasks"),
          adminApi.getDailyUpdates(),
          adminApi.getMeetings(),
          adminApi.getStudents(),
        ])
        setAttendance(attRes.data?.records || [])
        setTasks(taskRes.data?.tasks || [])
        setUpdates(updRes.data?.updates || [])
        setMeetings(meetRes.data?.meetings || [])
        setStudents(stuRes.data?.students || [])
      } catch (err) {
        console.error("Failed to load analytics data", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ---- Attendance trend: % present per week (last 6 weeks with data) ----
  const attendanceTrend = useMemo(() => {
    const byWeek = new Map<string, { present: number; total: number; sortKey: number }>()
    attendance.forEach((r) => {
      const d = new Date(r.date)
      const wk = startOfWeek(d)
      const key = weekLabel(wk)
      const entry = byWeek.get(key) || { present: 0, total: 0, sortKey: wk.getTime() }
      entry.total += 1
      if (r.status === "present") entry.present += 1
      byWeek.set(key, entry)
    })
    return Array.from(byWeek.entries())
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .slice(-6)
      .map(([week, v]) => ({
        week,
        attendance: v.total ? Math.round((v.present / v.total) * 100) : 0,
      }))
  }, [attendance])

  // ---- Commitment completion: completed (verified) vs missed (rejected) per week ----
  const commitmentTrend = useMemo(() => {
    const byWeek = new Map<string, { completed: number; missed: number; sortKey: number }>()
    tasks.forEach((t) => {
      if (t.status !== "verified" && t.status !== "rejected") return
      const d = new Date(t.verifiedAt || t.createdAt)
      const wk = startOfWeek(d)
      const key = weekLabel(wk)
      const entry = byWeek.get(key) || { completed: 0, missed: 0, sortKey: wk.getTime() }
      if (t.status === "verified") entry.completed += 1
      else entry.missed += 1
      byWeek.set(key, entry)
    })
    return Array.from(byWeek.entries())
      .sort((a, b) => a[1].sortKey - b[1].sortKey)
      .slice(-6)
      .map(([week, v]) => ({ week, completed: v.completed, missed: v.missed }))
  }, [tasks])

  // ---- Weekly activity: updates + meetings per day (last 7 days) ----
  const weeklyActivity = useMemo(() => {
    const days: { day: string; updates: number; meetings: number; sortKey: number }[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        updates: 0,
        meetings: 0,
        sortKey: d.getTime(),
      })
    }
    const dayKey = (dt: Date) => {
      const d = new Date(dt)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }
    updates.forEach((u) => {
      const k = dayKey(new Date(u.createdAt))
      const row = days.find((r) => r.sortKey === k)
      if (row) row.updates += 1
    })
    meetings.forEach((m) => {
      const k = dayKey(new Date(m.scheduledDate))
      const row = days.find((r) => r.sortKey === k)
      if (row) row.meetings += 1
    })
    return days
  }, [updates, meetings])

  // ---- KPIs ----
  const kpis = useMemo(() => {
    const totalAtt = attendance.length
    const presentAtt = attendance.filter((r) => r.status === "present").length
    const avgAttendance = totalAtt ? Math.round((presentAtt / totalAtt) * 100) : null

    const verifiedOrRejected = tasks.filter((t) => t.status === "verified" || t.status === "rejected")
    const verified = tasks.filter((t) => t.status === "verified").length
    const completionRate = verifiedOrRejected.length
      ? Math.round((verified / verifiedOrRejected.length) * 100)
      : null

    const activeMembers = students.filter((s) => s.isActive && s.inviteAccepted).length

    return { avgAttendance, completionRate, activeMembers }
  }, [attendance, tasks, students])

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading analytics...</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Attendance, commitments, and activity trends across the workspace."
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <FadeIn>
          <StatCard
            label="Avg Attendance"
            value={kpis.avgAttendance === null ? "—" : `${kpis.avgAttendance}%`}
            icon={CalendarCheck}
            hint={kpis.avgAttendance === null ? "No attendance records yet" : "across all recorded meetings"}
          />
        </FadeIn>
        <FadeIn>
          <StatCard
            label="Commitment Completion"
            value={kpis.completionRate === null ? "—" : `${kpis.completionRate}%`}
            icon={Target}
            hint={kpis.completionRate === null ? "No verified/rejected tasks yet" : "verified vs rejected tasks"}
          />
        </FadeIn>
        <FadeIn>
          <StatCard
            label="Active Members"
            value={String(kpis.activeMembers)}
            icon={Users}
            hint="accepted invite, not deactivated"
          />
        </FadeIn>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FadeIn>
          <ChartCard
            title="Attendance Trend"
            subtitle="Weekly attendance rate (%)"
            empty={attendanceTrend.length === 0}
          >
            <AreaChart data={attendanceTrend} margin={{ left: -20, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis domain={[0, 100]} {...axisProps} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="attendance" stroke={ACCENT} strokeWidth={2} fill="url(#attGrad)" />
            </AreaChart>
          </ChartCard>
        </FadeIn>

        <FadeIn>
          <ChartCard
            title="Commitment Completion"
            subtitle="Verified vs. rejected per week"
            empty={commitmentTrend.length === 0}
          >
            <BarChart data={commitmentTrend} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
              <Bar dataKey="completed" stackId="a" fill={EMERALD} radius={[0, 0, 0, 0]} />
              <Bar dataKey="missed" stackId="a" fill={AMBER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        </FadeIn>

        <FadeIn className="lg:col-span-2">
          <ChartCard
            title="Weekly Activity"
            subtitle="Daily updates submitted and meetings held, last 7 days"
            empty={weeklyActivity.every((d) => d.updates === 0 && d.meetings === 0)}
          >
            <LineChart data={weeklyActivity} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" {...axisProps} />
              <YAxis {...axisProps} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="updates" stroke={ACCENT} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="meetings" stroke={EMERALD} strokeWidth={2} dot={false} />
            </LineChart>
          </ChartCard>
        </FadeIn>
      </div>

      {/* Honest placeholder for what's not built yet, instead of fake AI insights */}
      <div className="glass rounded-2xl border border-border p-5">
        <div className="mb-2 flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">AI Risk Insights</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Not available yet — needs Gemini integration to detect at-risk students from commitment and attendance
          patterns.
        </p>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AdminOnly>
      <AnalyticsContent />
    </AdminOnly>
  )
}