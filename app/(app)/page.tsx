"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/authStore"
import AdminDashboard from "./admin-dashboard"
import StudentDashboard from "./student-dashboard"
import { Loader2 } from "lucide-react"

export default function DashboardRouter() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    // Zustand store hydrate ho jaata hai client side pe
    // Thoda wait karo phir redirect karo
    const timer = setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace("/auth/login")
      }
    }, 300) // store hydration ke liye thoda time

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (user.role === "admin") {
    return <AdminDashboard />
  }

  return <StudentDashboard />
}