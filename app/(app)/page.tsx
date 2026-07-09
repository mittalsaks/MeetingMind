"use client"

import { useAuthStore } from "@/lib/store/authStore"
import AdminDashboard from "./admin-dashboard"
import StudentDashboard from "./student-dashboard"

export default function DashboardRouter() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === "admin") {
    return <AdminDashboard />
  }

  return <StudentDashboard />
}