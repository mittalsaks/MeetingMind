"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  UserX,
  CalendarClock,
  ListTodo,
  AlarmClockOff,
  PlaneTakeoff,
  Sparkles,
} from "lucide-react"
import { FadeIn, Stagger } from "@/components/motion"
import { StatCard } from "@/components/stat-card"
import { ActivityFeed } from "@/components/admin/activity-feed"
import { UpcomingMeeting } from "@/components/admin/upcoming-meeting"
import { AiInsights } from "@/components/admin/ai-insights"
import { MissingUpdates } from "@/components/admin/missing-updates"
import { LeaveCard } from "@/components/leave/leave-card"
import { adminApi } from "@/lib/api/admin"
import { useAuthStore } from "@/lib/store/authStore"

interface Stats {
  updatedToday: number
  totalStudents: number
  missingToday: number
  pendingTasks: number
  overdueTasks: number
  pendingLeave: number
  weeklyUpdates: number
  upcomingMeeting: { title?: string; date?: string } | null
}

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<Stats | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getStats(),
      adminApi.getLeaveRequests(),
    ])
      .then(([statsRes, leaveRes]) => {
        setStats(statsRes.data?.stats ?? null)
        const all = leaveRes.data?.leaveRequests ?? leaveRes.data?.leaves ?? []
        setLeaveRequests(all.filter((l: any) => l.status === "pending"))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats
    ? [
        {
          key: "updated",
          label: "Students Updated Today",
          value: stats.updatedToday,
          hint: "Gave a real update",
          tone: "success" as const,
          icon: CheckCircle2,
          progress: stats.totalStudents > 0 ? Math.round((stats.updatedToday / stats.totalStudents) * 100) : 0,
        },
        {
          key: "missing",
          label: "Missing Daily Update",
          value: stats.missingToday,
          hint: "No update for 2+ days",
          tone: "danger" as const,
          icon: UserX,
          progress: stats.totalStudents > 0 ? Math.round((stats.missingToday / stats.totalStudents) * 100) : 0,
        },
        {
          key: "meeting",
          label: "Upcoming Meeting",
          value: stats.upcomingMeeting
            ? new Date(stats.upcomingMeeting.date!).toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })
            : "None",
          hint: stats.upcomingMeeting?.title ?? "Check meetings tab",
          tone: "primary" as const,
          icon: CalendarClock,
        },
        {
          key: "pending",
          label: "Pending Commitments",
          value: stats.pendingTasks,
          hint: "Promised, in progress",
          tone: "warning" as const,
          icon: ListTodo,
        },
        {
          key: "overdue",
          label: "Overdue Commitments",
          value: stats.overdueTasks,
          hint: "Past deadline",
          tone: "danger" as const,
          icon: AlarmClockOff,
        },
        {
          key: "leave",
          label: "Pending Leave Requests",
          value: stats.pendingLeave,
          hint: "Awaiting approval",
          tone: "leave" as const,
          icon: PlaneTakeoff,
        },
      ]
    : []

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero */}
      <FadeIn className="glass-strong relative mb-6 overflow-hidden rounded-3xl border border-border p-6 sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-leave/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            {user?.workspaceName ?? "Workspace"}
          </span>
          <h1 className="mt-4 text-pretty text-3xl font-semibold tracking-tight sm:text-4xl">
            Good Morning, {user?.name?.split(" ")[0] ?? "Mentor"}
          </h1>
          <p className="mt-2 max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            {loading ? (
              "Loading your team's activity…"
            ) : (
              <>
                Your student teams submitted{" "}
                <span className="font-semibold text-foreground">{stats?.weeklyUpdates ?? 0} updates</span> this week.{" "}
                <span className="font-semibold text-warning">{stats?.pendingLeave ?? 0} pending leave requests</span> need your attention.
              </>
            )}
          </p>
        </div>
      </FadeIn>

      {/* Stat cards */}
      {!loading && statCards.length > 0 && (
        <Stagger className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {statCards.map((s) => (
            <StatCard
              key={s.key}
              label={s.label}
              value={s.value}
              hint={s.hint}
              tone={s.tone}
              icon={s.icon}
              progress={"progress" in s ? s.progress : undefined}
            />
          ))}
        </Stagger>
      )}

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div className="space-y-4">
          <UpcomingMeeting />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MissingUpdates />
        </div>
        <AiInsights />
      </div>

      {/* Leave panel */}
      {leaveRequests.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Leave Requests</h2>
              <p className="text-xs text-muted-foreground">Pending approvals from your students</p>
            </div>
            <a href="/leave-requests" className="text-xs font-medium text-primary hover:underline">
              View all
            </a>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {leaveRequests.map((req) => (
              <LeaveCard key={req._id} req={req} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}