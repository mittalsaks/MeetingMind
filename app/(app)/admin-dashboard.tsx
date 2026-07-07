"use client"

import { useEffect, useState, useRef } from "react"
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  // ── Aurora canvas background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let w = window.innerWidth
    let h = window.innerHeight
    let t = 0
    canvas.width = w
    canvas.height = h

    const waves = [
      { y: 0.25, amp: 0.1,  freq: 0.8,  speed: 0.2,  color: "rgba(100,60,220,0.12)" },
      { y: 0.5,  amp: 0.08, freq: 1.1,  speed: 0.15, color: "rgba(40,100,200,0.09)" },
      { y: 0.7,  amp: 0.07, freq: 0.6,  speed: 0.25, color: "rgba(80,40,180,0.08)"  },
    ]

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      waves.forEach((wv) => {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 4) {
          const y =
            (wv.y +
              Math.sin(x * 0.005 * wv.freq + t * wv.speed) * wv.amp +
              Math.sin(x * 0.003 * wv.freq + t * wv.speed * 0.7 + 1) * wv.amp * 0.5) * h
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, wv.color); g.addColorStop(1, "transparent")
        ctx.fillStyle = g; ctx.fill()
      })
      t += 0.006
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w; canvas.height = h
    }
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", onResize) }
  }, [])

  // ── original data fetching — untouched
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
    <>
      <style>{`
        @keyframes heroIn {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes chipIn {
          from { opacity:0; transform:translateY(8px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes auroraLiveDot {
          0%,100% { opacity:0.5; box-shadow:0 0 0 0 rgba(34,197,94,0.4); }
          50%      { opacity:1;   box-shadow:0 0 0 6px rgba(34,197,94,0); }
        }
      `}</style>

      {/* Aurora canvas — fixed behind everything */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", inset: 0, zIndex: 0,
          pointerEvents: "none", opacity: 1,
        }}
      />

      <div className="relative mx-auto max-w-7xl" style={{ zIndex: 1 }}>

        {/* ── HERO ── */}
        <FadeIn>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              padding: "32px 36px",
              marginBottom: 20,
              animation: "heroIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {/* top glow line */}
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: "60%", height: 1,
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)",
            }} />
            {/* orbs */}
            <div style={{ position:"absolute", top:-80, right:-60, width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,rgba(139,92,246,0.12) 0%,transparent 65%)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:-60, left:"25%", width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle,rgba(59,130,246,0.09) 0%,transparent 65%)", pointerEvents:"none" }} />

            <div style={{ position:"relative", zIndex:1 }}>
              {/* workspace badge */}
              <span style={{
                display:"inline-flex", alignItems:"center", gap:7,
                background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)",
                borderRadius:999, padding:"5px 13px", fontSize:11, color:"#a78bfa",
                letterSpacing:"0.04em", marginBottom:16,
              }}>
                <Sparkles style={{ width:12, height:12 }} />
                {user?.workspaceName ?? "Workspace"}
              </span>

              <h1 style={{
                fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em",
                lineHeight: 1.05, marginBottom: 10,
                background: "linear-gradient(135deg,#fff 30%,rgba(255,255,255,0.55) 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Good Morning, {user?.name?.split(" ")[0] ?? "Mentor"} 👋
              </h1>

              <p style={{ fontSize:14, color:"#444", lineHeight:1.7, maxWidth:560 }}>
                {loading ? (
                  "Loading your team's activity…"
                ) : (
                  <>
                    Your student teams submitted{" "}
                    <strong style={{ color:"#888" }}>{stats?.weeklyUpdates ?? 0} updates</strong> this week.{" "}
                    <span style={{ color:"#f59e0b", fontWeight:600 }}>{stats?.pendingLeave ?? 0} pending leave requests</span> need your attention.
                  </>
                )}
              </p>

              {/* quick chips */}
              {!loading && stats && (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:16 }}>
                  {[
                    { label:`${stats.updatedToday} updated today`, color:"rgba(34,197,94,0.1)", border:"rgba(34,197,94,0.2)", text:"#4ade80" },
                    { label:`${stats.missingToday} missing`, color:"rgba(239,68,68,0.08)", border:"rgba(239,68,68,0.18)", text:"#f87171" },
                    { label:`${stats.pendingTasks} commitments`, color:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.18)", text:"#fbbf24" },
                  ].map((chip, i) => (
                    <span key={i} style={{
                      display:"inline-flex", alignItems:"center",
                      background:chip.color, border:`1px solid ${chip.border}`,
                      borderRadius:999, padding:"4px 12px",
                      fontSize:12, color:chip.text, fontWeight:500,
                      animation:`chipIn 0.4s ${0.1 + i * 0.08}s both`,
                    }}>{chip.label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* ── STAT CARDS ── */}
        {!loading && statCards.length > 0 && (
          <Stagger className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
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

        {/* ── MAIN GRID ── */}
        <div
          style={{
            display:"grid",
            gridTemplateColumns:"1fr 320px",
            gap:14,
            marginBottom:14,
          }}
          className="lg:grid-cols-[1fr_320px] grid-cols-1"
        >
          <div style={{
            borderRadius:20,
            border:"1px solid rgba(255,255,255,0.06)",
            background:"rgba(255,255,255,0.02)",
            backdropFilter:"blur(16px)",
            WebkitBackdropFilter:"blur(16px)",
            overflow:"hidden",
          }}>
            <ActivityFeed />
          </div>
          <div style={{
            borderRadius:20,
            border:"1px solid rgba(129,140,248,0.12)",
            background:"rgba(129,140,248,0.03)",
            backdropFilter:"blur(16px)",
            WebkitBackdropFilter:"blur(16px)",
            overflow:"hidden",
          }}>
            <UpcomingMeeting />
          </div>
        </div>

        {/* ── BOTTOM GRID ── */}
        <div
          style={{
            display:"grid",
            gridTemplateColumns:"1fr 320px",
            gap:14,
            marginBottom: leaveRequests.length > 0 ? 14 : 0,
          }}
          className="lg:grid-cols-[1fr_320px] grid-cols-1"
        >
          <div style={{
            borderRadius:20,
            border:"1px solid rgba(255,255,255,0.06)",
            background:"rgba(255,255,255,0.02)",
            backdropFilter:"blur(16px)",
            WebkitBackdropFilter:"blur(16px)",
            overflow:"hidden",
          }}>
            <MissingUpdates />
          </div>
          <div style={{
            borderRadius:20,
            border:"1px solid rgba(139,92,246,0.12)",
            background:"rgba(139,92,246,0.03)",
            backdropFilter:"blur(16px)",
            WebkitBackdropFilter:"blur(16px)",
            overflow:"hidden",
          }}>
            <AiInsights />
          </div>
        </div>

        {/* ── LEAVE PANEL ── */}
        {leaveRequests.length > 0 && (
          <div style={{
            borderRadius:20,
            border:"1px solid rgba(168,85,247,0.12)",
            background:"rgba(168,85,247,0.03)",
            backdropFilter:"blur(16px)",
            WebkitBackdropFilter:"blur(16px)",
            padding:"20px 24px",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div>
                <h2 style={{ fontSize:14, fontWeight:700, color:"#ddd", marginBottom:2 }}>Leave Requests</h2>
                <p style={{ fontSize:12, color:"#2a2a2a" }}>Pending approvals from your students</p>
              </div>
              <a href="/leave-requests" style={{
                fontSize:12, fontWeight:600, color:"#a78bfa", textDecoration:"none",
              }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration="underline")}
                onMouseLeave={e => (e.currentTarget.style.textDecoration="none")}
              >View all →</a>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {leaveRequests.map((req) => (
                <LeaveCard key={req._id} req={req} compact />
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}