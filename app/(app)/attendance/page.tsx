"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, TrendingUp, UserX, PlaneTakeoff } from "lucide-react"
import { FadeIn, Stagger } from "@/components/motion"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { AttendanceHeatmap } from "@/components/attendance/heatmap"
import { Card } from "@/components/ui/card"
import api from "@/lib/api/axios"

interface AttendanceRecord {
  userId: string
  date: string
  status: "present" | "absent" | "leave_approved"
  verbalUpdateGiven: boolean
  joinedMeeting: boolean
}

interface Student {
  _id: string
  name: string
}

function startOfWeek() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [attRes, studentsRes] = await Promise.all([
          api.get("/attendance"),
          api.get("/workspace/students"),
        ])
        setRecords(attRes.data?.records || [])
        setStudents(studentsRes.data?.students || [])
      } catch (err) {
        console.error("Failed to load attendance", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const weekStart = startOfWeek()
  const thisWeekRecords = records.filter((r) => new Date(r.date) >= weekStart)

  const totalExpected = students.length * 5 // 5 working days, simple baseline
  const presentCount = records.filter((r) => r.status === "present").length
  const updateRate = totalExpected > 0 ? Math.round((presentCount / totalExpected) * 100) : 0

  const spokeThisWeekIds = new Set(
    thisWeekRecords.filter((r) => r.verbalUpdateGiven).map((r) => r.userId)
  )

  // Chronic missers: 3+ 'absent' records per student
  const absentCountByStudent: Record<string, number> = {}
  records.forEach((r) => {
    if (r.status === "absent") {
      absentCountByStudent[r.userId] = (absentCountByStudent[r.userId] || 0) + 1
    }
  })
  const chronicMissers = Object.values(absentCountByStudent).filter((c) => c >= 3).length

  const onLeaveIds = new Set(
    thisWeekRecords.filter((r) => r.status === "leave_approved").map((r) => r.userId)
  )

  const stats = [
    { key: "rate", label: "Update Rate", value: `${updateRate}%`, tone: "success", hint: "Last 4 weeks", icon: TrendingUp },
    { key: "spoke", label: "Spoke This Week", value: spokeThisWeekIds.size, total: students.length, tone: "primary", hint: "In weekly sync", icon: CalendarCheck },
    { key: "missing", label: "Chronic Missers", value: chronicMissers, tone: "danger", hint: "3+ missed days", icon: UserX },
    { key: "leave", label: "On Leave", value: onLeaveIds.size, tone: "leave", hint: "Approved this week", icon: PlaneTakeoff },
  ]

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading attendance...</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Attendance & Engagement"
        description="Auto-tracked from meeting transcripts and daily updates — no manual roll call."
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} hint={s.hint} tone={s.tone} icon={s.icon} />
        ))}
      </Stagger>

      <FadeIn>
        <Card className="glass border-border p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold">Engagement Heatmap</h2>
            <p className="text-xs text-muted-foreground">
              Each cell is a weekday. Green = spoke in meeting, amber = daily update, red = missing.
            </p>
          </div>
          <AttendanceHeatmap records={records} students={students} />
        </Card>
      </FadeIn>
    </div>
  )
}