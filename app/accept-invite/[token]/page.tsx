"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { BrainCircuit, Lock, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api/auth"

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams<{ token: string }>()
  const token = params.token

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      await authApi.acceptInvite(token, password)
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired invite link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute -right-16 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-leave/10 blur-3xl" />

      <div className="glass-strong relative w-full max-w-md rounded-3xl border border-border p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <BrainCircuit className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">MeetingMind</p>
            <p className="text-[11px] text-muted-foreground">Mentor automation</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircle2 className="mb-3 size-10 text-primary" />
            <h1 className="text-xl font-semibold tracking-tight">Account activated</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Redirecting you to login...
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Set your password</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ve been invited to join a workspace. Choose a password to activate your account.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-card/50 pl-10"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 bg-card/50 pl-10"
                />
              </div>

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Activate account"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already activated?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}