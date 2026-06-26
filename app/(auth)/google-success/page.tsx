"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/store/authStore"
import { Loader2 } from "lucide-react"

export default function GoogleSuccessPage() {
  const router = useRouter()
  const params = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  useEffect(() => {
    const token = params.get("token")
    const name = params.get("name")
    const role = params.get("role") as "admin" | "user"
    const workspaceId = params.get("workspaceId")

    if (!token || !name || !role) {
      router.replace("/login?error=google_failed")
      return
    }

    // Store token in localStorage (same as normal login)
    localStorage.setItem("accessToken", token)

    setAuth(
  {
    id: "",
    name: decodeURIComponent(name),
    email: "",
    role,
    workspaceId: workspaceId || "",
    workspaceName: "",
  },
  token
)

    router.replace("/")
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}