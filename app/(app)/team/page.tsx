"use client"
import { AdminOnly } from "@/components/auth/admin-only"
import { useEffect, useMemo, useState } from "react"
import { Loader2, Search, Users } from "lucide-react"
import { PageHeader } from "@/components/features/page-header"
import { PageTransition, Stagger, HoverCard } from "@/components/features/motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { workspaceApi } from "@/lib/api/workspace"

type Student = {
  _id: string
  name: string
  email: string
  isActive: boolean
  inviteAccepted: boolean
  createdAt: string
}

type StatusFilter = "all" | "active" | "pending" | "deactivated"

function getStatus(s: Student): { key: StatusFilter; label: string; className: string } {
  if (!s.isActive) {
    return { key: "deactivated", label: "Deactivated", className: "bg-danger/10 text-danger" }
  }
  if (s.inviteAccepted) {
    return { key: "active", label: "Active", className: "bg-primary/10 text-primary" }
  }
  return { key: "pending", label: "Pending", className: "bg-orange-500/10 text-orange-400" }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "deactivated", label: "Deactivated" },
]

function TeamContent() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await workspaceApi.getStudents()
        setStudents(data.students)
      } catch (err) {
        console.error("Failed to load team members", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchesQuery =
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.email.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === "all" || getStatus(s).key === status
      return matchesQuery && matchesStatus
    })
  }, [students, query, status])

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Users}
        title="Team Members"
        description={`${students.length} ${students.length === 1 ? "member" : "members"} in this workspace.`}
      />

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-9 bg-card/50 pl-8 backdrop-blur-xl"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-0.5 backdrop-blur-xl">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatus(f.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                status === f.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
          No members match your filters.
        </div>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const st = getStatus(s)
            return (
              <HoverCard key={s._id} className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-secondary text-sm font-medium">
                        {initials(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-tight">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${st.className}`}
                  >
                    {st.label}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Joined {new Date(s.createdAt).toLocaleDateString()}</span>
                  <span className="italic">Activity stats not tracked yet</span>
                </div>
              </HoverCard>
            )
          })}
        </Stagger>
      )}
    </PageTransition>
  )
}
export default function TeamPage() {
  return <AdminOnly><TeamContent /></AdminOnly>
}