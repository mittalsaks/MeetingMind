"use client"
import { useRouter } from "next/navigation"
import api from "@/lib/api/axios"
import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { BrainCircuit, ChevronRight, Sparkles, User2 } from "lucide-react"
import { navItems } from "@/lib/nav"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/store/authStore"

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const rawRole = (user?.role || "").toString().toLowerCase()
const role = (rawRole === "admin" ? "admin" : "student") as "admin" | "student"
  const visibleNavItems = navItems.filter(item => !item.roles || item.roles.includes(role))
  // ── original logout logic — untouched
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error("Logout failed on backend", error)
    } finally {
      logout()
      router.push('/login')
    }
  }

  return (
    <>
      <style>{`
        .sb-nav-link {
          position: relative;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 12px;
          padding: 9px 12px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          text-decoration: none;
          cursor: pointer;
        }
        .sb-nav-link:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .sb-nav-link.active {
          background: rgba(139,92,246,0.12);
          color: #c4b5fd;
          border: 1px solid rgba(139,92,246,0.18);
        }
        .sb-nav-link.inactive {
          color: #3a3a3a;
        }
        @keyframes sidebarIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .sb-user-btn {
          padding: 6px;
          border-radius: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: #333;
          display: grid;
          place-items: center;
          transition: all 0.2s;
        }
        .sb-user-btn:hover {
          background: rgba(239,68,68,0.1);
          color: #f87171;
        }
      `}</style>

      <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:0 }}>

        {/* ── BRAND ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"22px 18px 18px",
          borderBottom:"1px solid rgba(255,255,255,0.05)",
        }}>
          {/* Logo mark */}
          <div style={{
            width:36, height:36, borderRadius:11,
            background:"rgba(139,92,246,0.15)",
            border:"1px solid rgba(139,92,246,0.25)",
            display:"grid", placeItems:"center",
            boxShadow:"0 0 16px rgba(139,92,246,0.15)",
            flexShrink:0,
          }}>
            <BrainCircuit style={{ width:18, height:18, color:"#c4b5fd" }} />
          </div>
          <div style={{ lineHeight:1.3 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"#e2e2e2", letterSpacing:"-0.01em" }}>MeetingMind</p>
            <p style={{ fontSize:11, color:"#2d2d2d" }}>Mentor automation</p>
          </div>
        </div>

        {/* ── NAV ITEMS ── */}
        <nav style={{ flex:1, overflowY:"auto", padding:"10px 10px" }}>
          {visibleNavItems.map((item, idx) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn("sb-nav-link", isActive ? "active" : "inactive")}
                style={{ marginBottom:2, animation:`sidebarIn 0.3s ${idx * 0.04}s both` }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    style={{
                      position:"absolute", inset:0, borderRadius:12,
                      background:"rgba(139,92,246,0.1)",
                    }}
                    transition={{ type:"spring", duration:0.4 }}
                  />
                )}
                <Icon style={{
                  position:"relative", zIndex:1,
                  width:15, height:15, flexShrink:0,
                  color: isActive ? "#c4b5fd" : "#333",
                }} />
                <span style={{ position:"relative", zIndex:1, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {item.label}
                </span>
                {item.badge ? (
                  <Badge
                    variant="secondary"
                    style={{
                      position:"relative", zIndex:1,
                      height:18, minWidth:18, display:"flex", alignItems:"center",
                      justifyContent:"center", borderRadius:999, padding:"0 6px",
                      fontSize:10, background:"rgba(139,92,246,0.15)",
                      color:"#c4b5fd", border:"1px solid rgba(139,92,246,0.2)",
                    }}
                  >
                    {item.badge}
                  </Badge>
                ) : null}
                {!item.built && (
                  <ChevronRight style={{
                    position:"relative", zIndex:1,
                    width:12, height:12, flexShrink:0, color:"#222",
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ── AI PROMO ── */}
        <div style={{
          margin:"0 10px 10px",
          borderRadius:16,
          border:"1px solid rgba(139,92,246,0.15)",
          background:"linear-gradient(135deg,rgba(139,92,246,0.08) 0%,rgba(139,92,246,0.02) 100%)",
          padding:"14px 14px",
          position:"relative", overflow:"hidden",
        }}>
          {/* subtle glow */}
          <div style={{
            position:"absolute", top:-20, right:-20,
            width:80, height:80, borderRadius:"50%",
            background:"radial-gradient(circle,rgba(139,92,246,0.15) 0%,transparent 70%)",
            pointerEvents:"none",
          }} />
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <Sparkles style={{ width:14, height:14, color:"#a78bfa" }} />
            <p style={{ fontSize:12, fontWeight:700, color:"#c4b5fd" }}>AI Insights</p>
          </div>
          <p style={{ fontSize:11, lineHeight:1.6, color:"#2d2d2d" }}>
            Auto-extract meeting transcripts and surface at-risk students.
          </p>
        </div>

        {/* ── USER PROFILE ── */}
        <div style={{
          padding:"12px 14px",
          borderTop:"1px solid rgba(255,255,255,0.05)",
          background:"rgba(255,255,255,0.02)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {/* Avatar */}
            <div style={{
              width:32, height:32, borderRadius:"50%",
              background:"rgba(139,92,246,0.12)",
              border:"1px solid rgba(139,92,246,0.2)",
              display:"grid", placeItems:"center",
              fontSize:12, fontWeight:700, color:"#c4b5fd",
              flexShrink:0,
            }}>
              {user?.name?.charAt(0).toUpperCase() || <User2 style={{ width:14, height:14 }} />}
            </div>
            <div style={{ flex:1, overflow:"hidden", lineHeight:1.3 }}>
              <p style={{ fontSize:12, fontWeight:600, color:"#bbb", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {user?.name || "Loading..."}
              </p>
              <p style={{ fontSize:10, color:"#2a2a2a", textTransform:"capitalize" }}>
                {user?.role || "Member"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="sb-user-btn"
              title="Logout"
            >
              <LogOut style={{ width:14, height:14 }} />
            </button>
          </div>
        </div>

      </div>
    </>
  )
}

export function Sidebar() {
  return (
    <aside style={{
      width:232,
      flexShrink:0,
      borderRight:"1px solid rgba(255,255,255,0.05)",
      background:"rgba(5,5,8,0.85)",
      backdropFilter:"blur(24px)",
      WebkitBackdropFilter:"blur(24px)",
    }}
      className="hidden lg:block"
    >
      <div style={{ position:"sticky", top:0, height:"100dvh" }}>
        <SidebarContent />
      </div>
    </aside>
  )
}