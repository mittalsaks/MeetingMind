"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  BarChart3,
  CalendarCheck,
  ChevronsUpDown,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  Archive as ArchiveIcon,
  Check,
  X,
} from "lucide-react"

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-updates", label: "Daily Updates", icon: CalendarCheck },
  { href: "/team", label: "Team Members", icon: Users },
  { href: "/archive", label: "Meeting Archive", icon: ArchiveIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

const workspaces = ["Acme Inc.", "Northwind Labs", "Globex"]

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/" className="flex items-center gap-2.5 px-2" onClick={onNavigate}>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="font-heading text-base font-semibold tracking-tight">
          MeetingMind
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="rounded-xl border border-border bg-card/60 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">AI Insights</p>
            <p className="truncate text-xs text-muted-foreground">3 new signals</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(workspaces[0])
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-card/60 px-2.5 py-1.5 text-sm backdrop-blur-xl transition-colors hover:bg-card/80"
      >
        <span className="flex size-6 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {current.charAt(0)}
        </span>
        <span className="max-w-32 truncate font-medium">{current}</span>
        <ChevronsUpDown className="size-3.5 text-muted-foreground" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-border bg-popover p-1 shadow-xl backdrop-blur-xl">
            {workspaces.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setCurrent(w)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              >
                {w}
                {current === w ? <Check className="size-3.5" /> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

function RoleToggle() {
  const [role, setRole] = useState<"mentor" | "student">("mentor")
  return (
    <div className="flex items-center rounded-lg border border-border bg-card/60 p-0.5 backdrop-blur-xl">
      {(["mentor", "student"] as const).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
            role === r
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="dark relative min-h-screen bg-background text-foreground">
      {/* subtle ambient glow for premium depth */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 0%, color-mix(in oklab, var(--sidebar-primary) 12%, transparent), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-card/30 backdrop-blur-xl lg:block">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile sidebar */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card/90 backdrop-blur-xl">
              <div className="flex justify-end p-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="size-4" />
                  <span className="sr-only">Close menu</span>
                </Button>
              </div>
              <SidebarContent
                pathname={pathname}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top navigation */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-6">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>

            <div className="hidden sm:block">
              <WorkspaceSwitcher />
            </div>

            <div className="relative ml-auto w-full max-w-sm lg:ml-0">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search meetings, people, commitments…"
                className="h-9 bg-card/50 pl-8 backdrop-blur-xl"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden md:block">
                <RoleToggle />
              </div>
              <Button size="sm" className="gap-1.5">
                <Sparkles className="size-4" />
                <span className="hidden sm:inline">AI Insights</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
