"use client"

import { useEffect, useMemo, useState } from "react"
import { PageHeader } from "@/components/features/page-header"
import { PageTransition, Stagger, HoverCard } from "@/components/features/motion"
import { UpdateStatusBadge } from "@/components/features/status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarCheck, Search, Sparkles, AlertTriangle, Bell } from "lucide-react"
import { adminApi } from "@/lib/api/admin"

const filters = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "missing", label: "Missing" },
]

function initials(name: string) {
  return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export default function DailyUpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    adminApi.getDailyUpdates()
      .then(res => setUpdates(res.data?.updates || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    return updates.filter((u) => {
      const name = u.userId?.name || ''
      const matchesQuery =
        name.toLowerCase().includes(query.toLowerCase()) ||
        u.today?.toLowerCase().includes(query.toLowerCase()) ||
        u.yesterday?.toLowerCase().includes(query.toLowerCase())
      return matchesQuery
    })
  }, [updates, query, filter])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={CalendarCheck}
        title="Daily Updates"
        description={`Your team's async standup for ${today}.`}
        actions={
          <Button size="sm" className="gap-1.5">
            <Bell className="size-4" />
            Nudge missing
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Feed */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search updates…"
                className="h-9 bg-card/50 pl-8 backdrop-blur-xl"
              />
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card/50 p-0.5 backdrop-blur-xl">
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
              No updates found.
            </div>
          ) : (
            <Stagger className="space-y-4">
              {visible.map((u) => {
                const name = u.userId?.name || 'Unknown'
                const email = u.userId?.email || ''
                return (
                  <HoverCard key={u._id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-secondary text-xs font-medium">
                            {initials(name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-tight">{name}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                      </div>
                      <UpdateStatusBadge status="submitted" />
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-border bg-background/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Yesterday</p>
                        <p className="mt-1 text-sm leading-relaxed">{u.yesterday}</p>
                      </div>
                      <div className="rounded-lg border border-border bg-background/40 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Today</p>
                        <p className="mt-1 text-sm leading-relaxed">{u.today}</p>
                      </div>
                    </div>

                    {u.blockers ? (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p className="text-sm leading-relaxed">{u.blockers}</p>
                      </div>
                    ) : null}
                  </HoverCard>
                )
              })}
            </Stagger>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                <Sparkles className="size-4" />
              </span>
              <h2 className="text-sm font-semibold">AI Summary</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {updates.length} updates submitted today.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">{updates.length} submitted</Badge>
              <Badge variant="destructive">
                {updates.filter(u => u.blockers).length} blockers
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
