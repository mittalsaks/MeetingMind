"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toneClasses } from "@/lib/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { adminApi } from "@/lib/api/admin"

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function initials(name: string) {
  return name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

export function ActivityFeed() {
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getDailyUpdates()
      .then(res => setUpdates(res.data?.updates || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="glass flex h-full flex-col rounded-2xl border border-border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Team Activity Feed</h2>
          <p className="text-xs text-muted-foreground">Live updates from your student teams</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading...</p>
      ) : updates.length === 0 ? (
        <p className="text-xs text-muted-foreground">No updates today.</p>
      ) : (
        <ol className="relative space-y-1">
          <span className="absolute bottom-2 left-[19px] top-2 w-px bg-border" aria-hidden />
          {updates.map((u, i) => {
            const name = u.userId?.name || 'Unknown'
            const t = toneClasses['primary']
            return (
              <motion.li
                key={u._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="relative flex gap-3 rounded-xl p-2 transition-colors hover:bg-accent/50"
              >
                <div className="relative z-10">
                  <Avatar className="size-10 ring-2 ring-card">
                    <AvatarFallback className={cn("text-xs font-semibold", t.bg, t.text)}>
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    <span className="font-semibold">{name}</span>{" "}
                    <span className="font-medium text-success">submitted daily update</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.today}</p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
              </motion.li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
