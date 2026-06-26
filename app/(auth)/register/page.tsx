"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BrainCircuit, Mail, Lock, User, Building2, Loader2, ArrowRight, Info } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { useAuthStore } from "@/lib/store/authStore"

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cardReady, setCardReady] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  // Card mount animation
  useEffect(() => {
    const t = setTimeout(() => setCardReady(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Aurora canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let w = window.innerWidth
    let h = window.innerHeight
    let t = 0
    canvas.width = w
    canvas.height = h

    const waves = [
      { y: 0.3,  amp: 0.12, freq: 0.8,  speed: 0.3,  color: "rgba(80,40,160,0.18)" },
      { y: 0.5,  amp: 0.1,  freq: 1.2,  speed: 0.2,  color: "rgba(20,80,140,0.14)" },
      { y: 0.65, amp: 0.08, freq: 0.6,  speed: 0.4,  color: "rgba(60,20,120,0.12)" },
      { y: 0.2,  amp: 0.06, freq: 1.5,  speed: 0.15, color: "rgba(10,60,100,0.10)" },
    ]

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      waves.forEach((wv) => {
        ctx.beginPath()
        for (let x = 0; x <= w; x += 4) {
          const y =
            (wv.y +
              Math.sin(x * 0.005 * wv.freq + t * wv.speed) * wv.amp +
              Math.sin(x * 0.003 * wv.freq + t * wv.speed * 0.7 + 1) * wv.amp * 0.5) * h
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, wv.color)
        g.addColorStop(1, "transparent")
        ctx.fillStyle = g
        ctx.fill()
      })
      t += 0.008
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    const onResize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = w; canvas.height = h
    }
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", onResize) }
  }, [])

  // 3D tilt
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card || window.matchMedia("(hover: none)").matches) return
    const r = card.getBoundingClientRect()
    const rX = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -8
    const rY = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 8
    card.style.transition = "transform 0.08s ease"
    card.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.01,1.01,1.01)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)"
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  }, [])

  // ── original logic untouched ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data } = await authApi.register(name, email, password, workspaceName)
      setAuth(data.user, data.accessToken)
      router.push("/")
      router.push(data.user.role === "admin" ? "/" : "/student")
      router.refresh()
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes scan {
          0%   { top: -60px; opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 0.5; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes fu {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .rg-inp {
          display: block;
          width: 100%;
          height: 48px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 13px;
          color: #fff;
          font-size: 14px;
          padding: 0 16px 0 44px;
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          font-family: inherit;
          box-sizing: border-box;
          -webkit-appearance: none;
        }
        .rg-inp::placeholder { color: #242424; }
        .rg-inp:focus {
          border-color: rgba(255,255,255,0.28);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }

        .rg-sbtn {
          width: 100%; height: 48px;
          background: #fff; border: none; border-radius: 13px;
          color: #000; font-size: 15px; font-weight: 800;
          cursor: pointer; transition: all 0.2s; font-family: inherit;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 4px;
        }
        .rg-sbtn:hover:not(:disabled) {
          background: #ececec;
          transform: translateY(-2px);
          box-shadow: 0 14px 36px rgba(255,255,255,0.14);
        }
        .rg-sbtn:active:not(:disabled) { transform: scale(0.99) translateY(0); }
        .rg-sbtn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Aurora canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, zIndex: 0, background: "#000", pointerEvents: "none" }}
      />

      {/* Page */}
      <div style={{
        position: "relative", zIndex: 2,
        minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
      }}>
        {/* Gradient border wrapper */}
        <div style={{
          width: "100%", maxWidth: 440,
          background: "linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 50%,rgba(255,255,255,0.12) 100%)",
          padding: "1px", borderRadius: 28,
          boxShadow: "0 50px 100px rgba(0,0,0,0.95)",
          opacity: cardReady ? 1 : 0,
          animation: cardReady ? "cardIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        }}>
          {/* Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              background: "rgba(5,5,5,0.95)",
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              borderRadius: 27, padding: "40px 38px",
              position: "relative", overflow: "hidden",
              cursor: "default", willChange: "transform",
            }}
          >
            {/* Top glow */}
            <div style={{
              position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
              width: "65%", height: 1,
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)",
            }} />
            {/* Scanline */}
            <div style={{
              position: "absolute", left: 0, right: 0, height: 60, top: -60,
              background: "linear-gradient(180deg,transparent,rgba(255,255,255,0.025),transparent)",
              animation: "scan 7s ease-in-out infinite", pointerEvents: "none",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>

              {/* Logo pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999, padding: "6px 14px",
                animation: "fu 0.5s 0.1s both",
              }}>
                <BrainCircuit style={{ width: 13, height: 13, color: "#fff" }} />
                <span style={{ fontSize: 12, color: "#666", letterSpacing: "0.04em" }}>MeetingMind</span>
              </div>

              {/* Steps */}
              <div style={{
                display: "flex", alignItems: "center",
                margin: "20px 0 24px",
                animation: "fu 0.5s 0.14s both",
              }}>
                {[
                  { n: "1", label: "Account", active: true },
                  { n: "2", label: "Workspace", active: false },
                  { n: "3", label: "Done", active: false },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700,
                        background: s.active ? "#fff" : "rgba(255,255,255,0.05)",
                        color: s.active ? "#000" : "#333",
                        border: s.active ? "none" : "1px solid rgba(255,255,255,0.08)",
                      }}>{s.n}</div>
                      <span style={{
                        fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em",
                        color: s.active ? "#888" : "#333",
                      }}>{s.label}</span>
                    </div>
                    {i < 2 && (
                      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)", margin: "0 8px 16px" }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Heading */}
              <h1 style={{
                fontSize: 28, fontWeight: 800, color: "#fff",
                letterSpacing: "-0.03em", lineHeight: 1.05,
                marginBottom: 6, animation: "fu 0.5s 0.18s both",
              }}>
                Create your workspace
              </h1>
              <p style={{ fontSize: 14, color: "#444", marginBottom: 22, animation: "fu 0.5s 0.2s both" }}>
                Set up your mentor account in seconds
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fu 0.5s 0.24s both" }}>

                {/* Name */}
                <div style={{ position: "relative" }}>
                  <User style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    width: 15, height: 15, color: "rgba(255,255,255,0.22)", pointerEvents: "none",
                    flexShrink: 0,
                  }} />
                  <input
                    type="text" placeholder="Your name"
                    value={name} onChange={(e) => setName(e.target.value)}
                    required className="rg-inp"
                  />
                </div>

                {/* Workspace */}
                <div style={{ position: "relative" }}>
                  <Building2 style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    width: 15, height: 15, color: "rgba(255,255,255,0.22)", pointerEvents: "none",
                    flexShrink: 0,
                  }} />
                  <input
                    type="text" placeholder="Workspace name (e.g. Capstone 2026)"
                    value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)}
                    required className="rg-inp"
                  />
                </div>

                {/* Email */}
                <div style={{ position: "relative" }}>
                  <Mail style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    width: 15, height: 15, color: "rgba(255,255,255,0.22)", pointerEvents: "none",
                    flexShrink: 0,
                  }} />
                  <input
                    type="email" placeholder="Email address"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required className="rg-inp"
                  />
                </div>

                {/* Password */}
                <div style={{ position: "relative" }}>
                  <Lock style={{
                    position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                    width: 15, height: 15, color: "rgba(255,255,255,0.22)", pointerEvents: "none",
                    flexShrink: 0,
                  }} />
                  <input
                    type="password" placeholder="Password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="rg-inp"
                  />
                </div>

                {/* Error */}
                {error && <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>}

                {/* Info box */}
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, padding: "11px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start",
                }}>
                  <Info style={{ width: 14, height: 14, color: "rgba(255,255,255,0.25)", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: "#444", lineHeight: 1.5 }}>
                    You'll be the admin of this workspace. Invite your team members after setup.
                  </p>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading} className="rg-sbtn">
                  {loading ? (
                    <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <p style={{
                marginTop: 20, textAlign: "center", fontSize: 14, color: "#3a3a3a",
                animation: "fu 0.5s 0.36s both",
              }}>
                Already have a workspace?{" "}
                <Link href="/login" style={{ color: "#fff", fontWeight: 700, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                >
                  Login
                </Link>
              </p>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}