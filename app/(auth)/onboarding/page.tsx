"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuthStore } from "@/lib/store/authStore"

export const dynamic = 'force-dynamic'

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)

  const token = searchParams.get("token") || ""
  const name = searchParams.get("name") || ""

  const [workspaceName, setWorkspaceName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceName.trim()) {
      setError("Organization name is required")
      return
    }
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/backend/api/auth/complete-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ workspaceName }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong")
        setLoading(false)
        return
      }

      setAuth(data.user, data.accessToken)
      router.push("/")
    } catch (err) {
      setError("Could not reach server. Try again.")
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-500">
          Invalid or expired onboarding link. Please login again.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Welcome{name ? `, ${name}` : ""}</h1>
          <p className="text-sm text-muted-foreground">
            You're signing up for the first time. Set up your organization to continue as an Admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="workspaceName" className="text-sm font-medium">
              Organization / Workspace name
            </label>
            <input
              id="workspaceName"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. CSE Capstone 2026"
              className="w-full rounded-md border px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Creating workspace..." : "Continue as Admin"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}