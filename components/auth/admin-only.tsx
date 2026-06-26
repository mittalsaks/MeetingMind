"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2, ShieldAlert } from "lucide-react"
import { useAuthStore } from "@/lib/store/authStore"

/**
 * Wrap any admin-only page's content with this.
 * - While auth is hydrating: shows a loading state (prevents a flash of the
 *   real content before we know the role, and prevents firing admin API
 *   calls before we know the user is allowed to).
 * - If role !== 'admin': shows a blocked message and redirects to dashboard.
 * - If role === 'admin': renders children normally.
 *
 * Usage:
 *   export default function AnalyticsPage() {
 *     return (
 *       <AdminOnly>
 *         <AnalyticsPageContent />
 *       </AdminOnly>
 *     )
 *   }
 *
 * IMPORTANT: any data-fetching (api.get calls) must live in the wrapped
 * child component, not in AdminOnly itself — that way student users never
 * trigger the admin-only API calls at all, and never see the resulting 403.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (isAuthenticated && user && !isAdmin) {
      const timer = setTimeout(() => router.replace("/"), 1500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user, isAdmin, router])

  // Auth not hydrated yet — don't render children, don't redirect, just wait.
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <ShieldAlert className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">This page is for mentors/admins only.</p>
        <p className="mt-1 text-xs text-muted-foreground">Redirecting you to the dashboard…</p>
      </div>
    )
  }

  return <>{children}</>
}