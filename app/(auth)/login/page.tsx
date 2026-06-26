"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { BrainCircuit, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { useAuthStore } from "@/lib/store/authStore"

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loaderVisible, setLoaderVisible] = useState(true)
  const [loaderFading, setLoaderFading] = useState(false)
  const [cardReady, setCardReady] = useState(false)
  const [statusText, setStatusText] = useState("Initializing...")
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  // Loader sequence
  useEffect(() => {
    const msgs = ["Initializing...", "Loading workspace...", "Almost there...", "Ready ✓"]
    let mi = 0
    const si = setInterval(() => {
      mi++
      if (mi < msgs.length) setStatusText(msgs[mi])
      else clearInterval(si)
    }, 600)
    const t1 = setTimeout(() => setLoaderFading(true), 2400)
    const t2 = setTimeout(() => { setLoaderVisible(false); setCardReady(true) }, 3100)
    return () => { clearInterval(si); clearTimeout(t1); clearTimeout(t2) }
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
      { y: 0.3, amp: 0.12, freq: 0.8, speed: 0.3, color: "rgba(80,40,160,0.18)" },
      { y: 0.5, amp: 0.1,  freq: 1.2, speed: 0.2, color: "rgba(20,80,140,0.14)" },
      { y: 0.65,amp: 0.08, freq: 0.6, speed: 0.4, color: "rgba(60,20,120,0.12)" },
      { y: 0.2, amp: 0.06, freq: 1.5, speed: 0.15,color: "rgba(10,60,100,0.10)" },
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
    const rX = ((e.clientY - r.top - r.height / 2) / (r.height / 2)) * -10
    const rY = ((e.clientX - r.left - r.width / 2) / (r.width / 2)) * 10
    card.style.transition = "transform 0.08s ease"
    card.style.transform = `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale3d(1.01,1.01,1.01)`
  }, [])

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current
    if (!card) return
    card.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)"
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)"
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      setAuth(data.user, data.accessToken)
      router.push(data.user.role === "admin" ? "/" : "/student")
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes glitch1 {
          0%,90%,100% { transform:none; opacity:0; }
          92% { transform:translateX(-4px); opacity:0.8; }
          94% { transform:translateX(4px); opacity:0.8; }
          96% { transform:none; opacity:0; }
        }
        @keyframes glitch2 {
          0%,88%,100% { transform:none; opacity:0; }
          90% { transform:translateX(4px); opacity:0.7; }
          93% { transform:translateX(-4px); opacity:0.7; }
          96% { transform:none; opacity:0; }
        }
        @keyframes ringFill {
          to { stroke-dashoffset: 0; }
        }
        @keyframes dotPulse {
          0%,100% { opacity:0.3; transform:scale(0.8); }
          50% { opacity:1; transform:scale(1.2); }
        }
        @keyframes scan {
          0% { top:-60px; opacity:0; }
          5% { opacity:1; }
          95% { opacity:0.5; }
          100% { top:110%; opacity:0; }
        }
        @keyframes fu {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(28px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        .mm-glitch {
          font-size:28px; font-weight:800; color:#fff;
          letter-spacing:-0.02em; position:relative; margin-bottom:8px;
        }
        .mm-glitch::before, .mm-glitch::after {
          content: attr(data-text);
          position:absolute; inset:0;
          font-size:28px; font-weight:800; letter-spacing:-0.02em;
        }
        .mm-glitch::before {
          color:#0ff;
          clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);
          animation:glitch1 2.5s infinite steps(1);
        }
        .mm-glitch::after {
          color:#f0f;
          clip-path:polygon(0 60%,100% 60%,100% 80%,0 80%);
          animation:glitch2 2.5s infinite steps(1);
        }

        .mm-inp {
          width:100%; height:48px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:13px; color:#fff; font-size:14px;
          padding:0 14px 0 42px; outline:none;
          transition:all 0.2s; font-family:inherit;
          box-sizing:border-box;
        }
        .mm-inp::placeholder { color:#1e1e1e; }
        .mm-inp:focus {
          border-color:rgba(255,255,255,0.28);
          background:rgba(255,255,255,0.06);
          box-shadow:0 0 0 3px rgba(255,255,255,0.05);
        }
        .mm-inp-pr { padding-right:42px; }

        .mm-gbtn {
          width:100%; height:48px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:13px; color:#ccc; font-size:14px; font-weight:500;
          display:flex; align-items:center; justify-content:center; gap:10px;
          cursor:pointer; transition:all 0.2s; font-family:inherit;
        }
        .mm-gbtn:hover {
          background:rgba(255,255,255,0.09);
          border-color:rgba(255,255,255,0.2);
          transform:translateY(-1px);
        }

        .mm-sbtn {
          width:100%; height:48px; margin-top:6px;
          background:#fff; border:none; border-radius:13px;
          color:#000; font-size:15px; font-weight:800;
          cursor:pointer; transition:all 0.2s; font-family:inherit;
          display:flex; align-items:center; justify-content:center;
        }
        .mm-sbtn:hover:not(:disabled) {
          background:#ececec;
          transform:translateY(-2px);
          box-shadow:0 14px 36px rgba(255,255,255,0.14);
        }
        .mm-sbtn:active:not(:disabled) { transform:scale(0.99) translateY(0); }
        .mm-sbtn:disabled { opacity:0.6; cursor:not-allowed; }

        .mm-eye {
          position:absolute; right:14px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.2);
          padding:0; display:grid; place-items:center; transition:color 0.2s;
        }
        .mm-eye:hover { color:rgba(255,255,255,0.5); }

        .mm-forgot { font-size:13px; color:#333; text-decoration:none; transition:color 0.2s; }
        .mm-forgot:hover { color:#888; }
        .mm-create { color:#3a3a3a; font-size:14px; }
        .mm-create a { color:#fff; font-weight:700; text-decoration:none; }
        .mm-create a:hover { text-decoration:underline; }
      `}</style>

      {/* Aurora canvas */}
      <canvas
        ref={canvasRef}
        style={{ position:"fixed", inset:0, zIndex:0, background:"#000", pointerEvents:"none" }}
      />

      {/* Loader */}
      {loaderVisible && (
        <div style={{
          position:"fixed", inset:0, zIndex:9999, background:"#000",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          transition:"opacity 0.8s ease", opacity:loaderFading ? 0 : 1,
          pointerEvents:loaderFading ? "none" : "all",
        }}>
          <div className="mm-glitch" data-text="MeetingMind">MeetingMind</div>
          <p style={{ fontSize:11, color:"#444", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:32 }}>
            Mentor automation platform
          </p>

          {/* Ring */}
          <div style={{ position:"relative", width:64, height:64, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg style={{ transform:"rotate(-90deg)" }} width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
              <circle
                cx="32" cy="32" r="26" fill="none" stroke="#fff" strokeWidth="1.5"
                strokeLinecap="round" strokeDasharray="163" strokeDashoffset="163"
                style={{ animation:"ringFill 2.2s 0.3s cubic-bezier(0.4,0,0.2,1) forwards" }}
              />
            </svg>
            <div style={{
              position:"absolute", width:7, height:7, borderRadius:"50%", background:"#fff",
              animation:"dotPulse 1s ease-in-out infinite",
            }} />
          </div>

          <p style={{ marginTop:16, fontSize:11, color:"#333", letterSpacing:"0.1em", height:16 }}>
            {statusText}
          </p>
        </div>
      )}

      {/* Main page */}
      <div style={{
        position:"relative", zIndex:2, minHeight:"100vh",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"0 16px",
      }}>
        {/* Gradient border wrapper */}
        <div style={{
          width:"100%", maxWidth:420,
          background:"linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 50%,rgba(255,255,255,0.12) 100%)",
          padding:"1px", borderRadius:28,
          boxShadow:"0 50px 100px rgba(0,0,0,0.95)",
          opacity: cardReady ? 1 : 0,
          animation: cardReady ? "cardIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        }}>
          {/* Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              background:"rgba(5,5,5,0.95)",
              backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
              borderRadius:27, padding:"44px 40px",
              position:"relative", overflow:"hidden",
              cursor:"default", willChange:"transform",
            }}
          >
            {/* Top glow line */}
            <div style={{
              position:"absolute", top:0, left:"50%", transform:"translateX(-50%)",
              width:"65%", height:1,
              background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)",
            }} />

            {/* Scanline */}
            <div style={{
              position:"absolute", left:0, right:0, height:60, top:-60,
              background:"linear-gradient(180deg,transparent,rgba(255,255,255,0.025),transparent)",
              animation:"scan 7s ease-in-out infinite", pointerEvents:"none",
            }} />

            <div style={{ position:"relative", zIndex:1 }}>
              {/* Logo pill */}
              <div style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.05)",
                border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:999, padding:"7px 14px",
                animation:"fu 0.5s 0.1s both",
              }}>
                <BrainCircuit style={{ width:13, height:13, color:"#fff" }} />
                <span style={{ fontSize:12, color:"#666", letterSpacing:"0.04em" }}>MeetingMind</span>
              </div>

              {/* Heading */}
              <h1 style={{
                fontSize:36, fontWeight:800, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1.05,
                margin:"24px 0 8px",
                animation:"fu 0.5s 0.14s both",
              }}>
                Welcome back
              </h1>
              <p style={{ fontSize:14, color:"#444", animation:"fu 0.5s 0.18s both" }}>
                Sign in to continue to your workspace
              </p>

              {/* Google */}
              <div style={{ marginTop:28, animation:"fu 0.5s 0.24s both" }}>
                <button className="mm-gbtn" type="button" onClick={handleGoogleLogin}>
                  <svg width="17" height="17" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Divider */}
              <div style={{
                display:"flex", alignItems:"center", gap:12, margin:"18px 0",
                animation:"fu 0.5s 0.28s both",
              }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
                <span style={{ fontSize:11, color:"#2a2a2a" }}>or continue with email</span>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:10, animation:"fu 0.5s 0.32s both" }}>
                {/* Email */}
                <div style={{ position:"relative" }}>
                  <Mail style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.2)", pointerEvents:"none" }} />
                  <input
                    type="email" placeholder="you@workspace.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    required className="mm-inp"
                  />
                </div>

                {/* Password */}
                <div style={{ position:"relative" }}>
                  <Lock style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.2)", pointerEvents:"none" }} />
                  <input
                    type={showPassword ? "text" : "password"} placeholder="Password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    required className="mm-inp mm-inp-pr"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="mm-eye">
                    {showPassword ? <EyeOff style={{ width:15, height:15 }} /> : <Eye style={{ width:15, height:15 }} />}
                  </button>
                </div>

                {error && <p style={{ fontSize:13, color:"#ef4444", margin:0 }}>{error}</p>}

                <div style={{ textAlign:"right", marginTop:2 }}>
                  <Link href="/forgot-password" className="mm-forgot">Forgot password?</Link>
                </div>

                <button type="submit" disabled={loading} className="mm-sbtn">
                  {loading ? <Loader2 style={{ width:18, height:18, animation:"spin 1s linear infinite" }} /> : "Sign In"}
                </button>
              </form>

              {/* Register */}
              <p style={{ marginTop:22, textAlign:"center", animation:"fu 0.5s 0.4s both" }} className="mm-create">
                Don&apos;t have a workspace?{" "}
                <Link href="/register">Create one</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}