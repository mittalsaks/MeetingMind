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
    <div className="flex h-full flex-col gap-1">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <BrainCircuit className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">MeetingMind</p>
          <p className="text-[11px] text-muted-foreground">Mentor automation</p>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary/15"
                  transition={{ type: "spring", duration: 0.4 }}
                />
              )}
              <Icon className="relative z-10 size-4 shrink-0" />
              <span className="relative z-10 flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <Badge
                  variant="secondary"
                  className="relative z-10 h-5 min-w-5 justify-center rounded-full px-1.5 text-[11px]"
                >
                  {item.badge}
                </Badge>
              ) : null}
              {!item.built && (
                <ChevronRight className="relative z-10 size-3.5 shrink-0 text-muted-foreground/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* AI Promo */}
      <div className="mx-3 mb-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm font-semibold">AI Insights</p>
        </div>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Auto-extract meeting transcripts and surface at-risk students.
        </p>
      </div>

      {/* Dynamic User Profile with Real Logout Button */}
      <div className="px-4 py-3 border-t border-border/50 bg-sidebar-accent/30">
        <div className="flex items-center gap-3">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold">
            {user?.name?.charAt(0).toUpperCase() || <User2 className="size-4" />}
          </div>
          <div className="flex-1 overflow-hidden leading-tight">
            <p className="truncate text-sm font-medium">{user?.name || "Loading..."}</p>
            <p className="truncate text-[11px] text-muted-foreground capitalize">
              {user?.role || "Member"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar/70 backdrop-blur-xl lg:block">
      <div className="sticky top-0 h-dvh">
        <SidebarContent />
      </div>
    </aside>
  )
}