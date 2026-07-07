"use client"
import { AdminOnly } from "@/components/auth/admin-only"
import { useEffect, useState } from "react"
import { PlaneTakeoff, Clock, CheckCircle2, XCircle } from "lucide-react"
import { Stagger, StaggerItem } from "@/components/motion"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { LeaveCard } from "@/components/leave/leave-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import api from "@/lib/api/axios"

type Filter = "all" | "pending" | "approved" | "rejected"

interface BackendLeave {
  _id: string
  userId: { _id: string; name: string; email: string }
  reason: string
  fromDate: string
  toDate: string
  weekProgress: string
  nextPlan: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
}

function formatDateRange(from: string, to: string) {
  const f = new Date(from).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const t = new Date(to).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return f === t ? f : `${f} – ${t}`
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const hrs = Math.floor(diffMs / 3600000)
  if (hrs < 1) return "just now"
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function LeaveRequestsContent(){
  const [requests, setRequests] = useState<BackendLeave[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/leave-requests")
        setRequests(res.data?.leaves || [])
      } catch (err) {
        console.error("Failed to load leave requests", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const setStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/leave-requests/${id}`, { status })
      window.dispatchEvent(new CustomEvent("leave:updated"))
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      )
    } catch (err) {
      console.error("Failed to update leave request", err)
    }
  }

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }

  const visible = requests.filter((r) => filter === "all" || r.status === filter)

  const stats = [
    { key: "pending", label: "Pending", value: counts.pending, tone: "warning", hint: "Awaiting decision", icon: Clock },
    { key: "approved", label: "Approved", value: counts.approved, tone: "success", hint: "This cohort", icon: CheckCircle2 },
    { key: "rejected", label: "Rejected", value: counts.rejected, tone: "danger", hint: "This cohort", icon: XCircle },
    { key: "total", label: "Total Requests", value: requests.length, tone: "primary", hint: "All time", icon: PlaneTakeoff },
  ]

  if (loading) {
    return <div className="mx-auto max-w-7xl p-6 text-sm text-muted-foreground">Loading leave requests...</div>
  }

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Leave Requests"
        subtitle="Students submit leave with their weekly progress and next plan attached automatically."
      />

      <Stagger className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} hint={s.hint} tone={s.tone} icon={s.icon} />
        ))}
      </Stagger>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-5">
        <TabsList className="bg-card/60">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <div className="glass rounded-2xl border border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">{filter === "all" ? "No requests yet." : `No ${filter} requests.`}</p>
        </div>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2">
          {visible.map((req) => (
            <StaggerItem key={req._id}>
              <LeaveCard
                req={{
                  id: req._id,
                  student: req.userId?.name || "Unknown",
                  initials: getInitials(req.userId?.name || "U"),
                  team: "",
                  dates: formatDateRange(req.fromDate, req.toDate),
                  reason: req.reason,
                  weekProgress: req.weekProgress,
                  nextPlan: req.nextPlan,
                  status: req.status,
                  submitted: timeAgo(req.createdAt),
                }}
                onApprove={() => setStatus(req._id, "approved")}
                onReject={() => setStatus(req._id, "rejected")}
              />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
export default function LeaveRequestsPage() {
  return <AdminOnly><LeaveRequestsContent /></AdminOnly>
}