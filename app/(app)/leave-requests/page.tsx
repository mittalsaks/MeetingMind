"use client"
import { useEffect, useState } from "react"
import { PlaneTakeoff, Clock, CheckCircle2, XCircle, Loader2, Send } from "lucide-react"
import { Stagger, StaggerItem } from "@/components/motion"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { LeaveCard } from "@/components/leave/leave-card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/store/authStore"
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

// ---- Student-side: submit a new leave request ----
function StudentLeaveForm() {
  const [form, setForm] = useState({
    reason: "",
    fromDate: "",
    toDate: "",
    weekProgress: "",
    nextPlan: "",
  })
  const [myLeaves, setMyLeaves] = useState<BackendLeave[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function load() {
    try {
      const res = await api.get("/leave-requests")
      setMyLeaves(res.data?.leaves || [])
    } catch (err) {
      console.error("Failed to load leave requests", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSuccess(false)
    try {
      await api.post("/leave-requests", form)
      setForm({ reason: "", fromDate: "", toDate: "", weekProgress: "", nextPlan: "" })
      setSuccess(true)
      await load()
    } catch (err) {
      console.error("Failed to submit leave request", err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Leave Requests"
        subtitle="Submit a leave request with your weekly progress and next plan."
      />

      <div className="glass mb-6 rounded-2xl border border-border p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <input
                type="date"
                required
                value={form.fromDate}
                onChange={(e) => setForm((f) => ({ ...f, fromDate: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background/60 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <input
                type="date"
                required
                value={form.toDate}
                onChange={(e) => setForm((f) => ({ ...f, toDate: e.target.value }))}
                className="w-full rounded-xl border border-border bg-background/60 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Family function"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full rounded-xl border border-border bg-background/60 p-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">This week&apos;s progress</label>
            <textarea
              required
              rows={2}
              placeholder="What did you complete this week?"
              value={form.weekProgress}
              onChange={(e) => setForm((f) => ({ ...f, weekProgress: e.target.value }))}
              className="w-full resize-none rounded-xl border border-border bg-background/60 p-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Next week&apos;s plan</label>
            <textarea
              required
              rows={2}
              placeholder="What will you work on after returning?"
              value={form.nextPlan}
              onChange={(e) => setForm((f) => ({ ...f, nextPlan: e.target.value }))}
              className="w-full resize-none rounded-xl border border-border bg-background/60 p-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {success && (
            <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
              ✓ Leave request submitted successfully
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full gap-1.5">
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Submit Leave Request
          </Button>
        </form>
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-border">
        <div className="border-b border-border p-5">
          <h2 className="text-sm font-semibold">Your Requests</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : myLeaves.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {myLeaves.map((req) => (
              <LeaveCard
                key={req._id}
                compact
                readOnly
                req={{
                  id: req._id,
                  student: req.userId?.name || "You",
                  initials: getInitials(req.userId?.name || "U"),
                  team: "",
                  dates: formatDateRange(req.fromDate, req.toDate),
                  reason: req.reason,
                  weekProgress: req.weekProgress,
                  nextPlan: req.nextPlan,
                  status: req.status,
                  submitted: timeAgo(req.createdAt),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Admin-side: review all requests ----
function AdminLeaveReview() {
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
      setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)))
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
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return user.role === "admin" ? <AdminLeaveReview /> : <StudentLeaveForm />
}