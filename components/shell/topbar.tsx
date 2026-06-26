"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  Bell,
  Sparkles,
  ChevronsUpDown,
  Check,
  Menu,
  UserRound,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/lib/store/authStore"
import api from "@/lib/api/axios"

const workspaces = ["Capstone 2026 · Cohort B", "Capstone 2026 · Cohort A", "Summer Interns"]

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const isStudent = user?.role === "user"

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

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?"

  return (
    <header className="glass-strong sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border px-3 sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenu}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* Workspace switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent">
            <span className="grid size-6 place-items-center rounded-md bg-primary/15 text-[11px] font-bold text-primary">
              CB
            </span>
            <span className="hidden max-w-[160px] truncate sm:inline">
              {user?.workspaceName || workspaces[0]}
            </span>
            <ChevronsUpDown className="size-3.5 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map((w, i) => (
              <DropdownMenuItem key={w} className="gap-2">
                {i === 0 ? <Check className="size-4 text-primary" /> : <span className="size-4" />}
                <span className="truncate">{w}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search */}
      <div className="relative ml-1 hidden flex-1 items-center md:flex">
        <Search className="absolute left-3 size-4 text-muted-foreground" />
        <input
          placeholder="Search students, commitments, meetings…"
          className="h-9 w-full max-w-md rounded-lg border border-border bg-card/50 pl-9 pr-16 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-card"
        />
        <kbd className="absolute right-3 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Role switch */}
        <div className="hidden items-center rounded-lg border border-border bg-card/60 p-0.5 sm:flex">
          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !isStudent ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserRound className="size-3.5" /> Mentor
          </Link>
          <Link
            href="/student"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isStudent ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="size-3.5" /> Student
          </Link>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="hidden gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary sm:inline-flex"
          onClick={() => router.push(isStudent ? "/student" : "/")}
        >
          <Sparkles className="size-4" />
          AI Insights
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-background" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="ml-1 flex items-center gap-2 rounded-lg p-0.5 pr-2 transition-colors hover:bg-accent">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/20 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-semibold">{user?.name || "Loading..."}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {user?.role === "admin" ? "Lead Mentor" : "Student"}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Sign out</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}