"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { BrainCircuit, Mail, Lock, Loader2, CheckCircle2 } from "lucide-react"
import { authApi } from "@/lib/api/auth"

export default function ForgotPasswordPage() {
  // ── original state ──
  const [step, setStep] = useState<"email" | "otp" | "reset" | "done">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // ── ui state ──
  const [cardReady, setCardReady] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

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
    let w = window.innerWidth, h = window.innerHeight, t = 0
    canvas.width = w; canvas.height = h
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
          const y = (wv.y + Math.sin(x * 0.005 * wv.freq + t * wv.speed) * wv.amp +
            Math.sin(x * 0.003 * wv.freq + t * wv.speed * 0.7 + 1) * wv.amp * 0.5) * h
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
        const g = ctx.createLinearGradient(0, 0, 0, h)
        g.addColorStop(0, wv.color); g.addColorStop(1, "transparent")
        ctx.fillStyle = g; ctx.fill()
      })
      t += 0.008; rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    const onResize = () => { w = window.innerWidth; h = window.innerHeight; canvas.width = w; canvas.height = h }
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

  // OTP box handlers
  const handleOtpChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const arr = otp.split("")
    arr[i] = val.slice(-1)
    const next = arr.join("").padEnd(6, "").slice(0, 6)
    setOtp(next)
    if (val && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  // ── original handlers ──
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { await authApi.forgotPassword(email); setStep("otp") }
    catch (err: any) { setError(err.response?.data?.message || "Something went wrong") }
    finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { await authApi.verifyOtp(email, otp); setStep("reset") }
    catch (err: any) { setError(err.response?.data?.message || "Invalid OTP") }
    finally { setLoading(false) }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true)
    try { await authApi.resetPassword(email, otp, newPassword); setStep("done") }
    catch (err: any) { setError(err.response?.data?.message || "Something went wrong") }
    finally { setLoading(false) }
  }

  // step index for progress track
  const stepIndex = { email: 0, otp: 1, reset: 2, done: 3 }[step]
  const trackSteps = ["Email", "OTP", "Reset"]

  return (
    <>
      <style>{`
        @keyframes scan {
          0%{top:-60px;opacity:0;}5%{opacity:1;}95%{opacity:0.4;}100%{top:110%;opacity:0;}
        }
        @keyframes fu {
          from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}
        }
        @keyframes stepSlide {
          from{opacity:0;transform:translateX(16px);}to{opacity:1;transform:translateX(0);}
        }
        @keyframes cardIn {
          from{opacity:0;transform:translateY(28px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}
        }
        @keyframes successPop {
          0%{transform:scale(0.5);opacity:0;}60%{transform:scale(1.15);}100%{transform:scale(1);opacity:1;}
        }
        @keyframes checkDraw {
          from{stroke-dashoffset:60;}to{stroke-dashoffset:0;}
        }

        .fp-inp {
          display:block; width:100%; height:48px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:13px; color:#fff; font-size:14px;
          padding:0 16px 0 44px; outline:none;
          transition:border-color 0.2s,background 0.2s,box-shadow 0.2s;
          font-family:inherit; box-sizing:border-box; -webkit-appearance:none;
        }
        .fp-inp::placeholder{color:#222;}
        .fp-inp:focus{
          border-color:rgba(255,255,255,0.28);
          background:rgba(255,255,255,0.06);
          box-shadow:0 0 0 3px rgba(255,255,255,0.05);
        }

        .fp-otp-box {
          flex:1; height:52px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          border-radius:12px; color:#fff;
          font-size:20px; font-weight:700; text-align:center;
          outline:none; transition:all 0.2s; font-family:inherit;
          -webkit-appearance:none;
        }
        .fp-otp-box:focus{
          border-color:rgba(255,255,255,0.35);
          background:rgba(255,255,255,0.07);
          box-shadow:0 0 0 3px rgba(255,255,255,0.06);
        }
        .fp-otp-box.filled{
          border-color:rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.06);
        }

        .fp-sbtn {
          width:100%; height:48px; margin-top:4px;
          background:#fff; border:none; border-radius:13px;
          color:#000; font-size:15px; font-weight:800;
          cursor:pointer; transition:all 0.2s; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .fp-sbtn:hover:not(:disabled){
          background:#ececec; transform:translateY(-2px);
          box-shadow:0 14px 36px rgba(255,255,255,0.14);
        }
        .fp-sbtn:active:not(:disabled){transform:scale(0.99) translateY(0);}
        .fp-sbtn:disabled{opacity:0.6;cursor:not-allowed;}

        .fp-hint {
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:11px; padding:10px 13px;
          display:flex; gap:9px; align-items:flex-start;
          margin-bottom:10px;
        }
        .fp-hint p{font-size:12px;color:#3a3a3a;line-height:1.5;}

        .fp-step-content{animation:stepSlide 0.4s cubic-bezier(0.16,1,0.3,1) both;}
      `}</style>

      {/* Aurora canvas */}
      <canvas ref={canvasRef} style={{ position:"fixed", inset:0, zIndex:0, background:"#000", pointerEvents:"none" }} />

      {/* Page */}
      <div style={{
        position:"relative", zIndex:2, minHeight:"100vh",
        display:"flex", alignItems:"center", justifyContent:"center",
        padding:"24px 16px",
      }}>
        {/* Gradient border */}
        <div style={{
          width:"100%", maxWidth:420,
          background:"linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.04) 50%,rgba(255,255,255,0.12) 100%)",
          padding:"1px", borderRadius:28,
          boxShadow:"0 50px 100px rgba(0,0,0,0.95)",
          opacity:cardReady ? 1 : 0,
          animation:cardReady ? "cardIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
        }}>
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              background:"rgba(5,5,5,0.95)",
              backdropFilter:"blur(40px)", WebkitBackdropFilter:"blur(40px)",
              borderRadius:27, padding:"40px 38px",
              position:"relative", overflow:"hidden",
              cursor:"default", willChange:"transform",
            }}
          >
            {/* Top glow */}
            <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:"65%", height:1, background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent)" }} />
            {/* Scanline */}
            <div style={{ position:"absolute", left:0, right:0, height:60, top:-60, background:"linear-gradient(180deg,transparent,rgba(255,255,255,0.025),transparent)", animation:"scan 7s ease-in-out infinite", pointerEvents:"none" }} />

            <div style={{ position:"relative", zIndex:1 }}>

              {/* Logo pill */}
              <div style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:999, padding:"6px 14px",
                animation:"fu 0.4s 0.1s both", marginBottom:22,
              }}>
                <BrainCircuit style={{ width:13, height:13, color:"#fff" }} />
                <span style={{ fontSize:12, color:"#666", letterSpacing:"0.04em" }}>MeetingMind</span>
              </div>

              {/* Progress track — hide on done */}
              {step !== "done" && (
                <div style={{ display:"flex", alignItems:"center", marginBottom:28, animation:"fu 0.4s 0.15s both" }}>
                  {trackSteps.map((label, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", flex: i < 2 ? 1 : "none" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                        <div style={{
                          width:32, height:32, borderRadius:"50%",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, fontWeight:700,
                          background: i < stepIndex ? "rgba(255,255,255,0.12)" : i === stepIndex ? "#fff" : "rgba(255,255,255,0.04)",
                          color: i < stepIndex ? "#fff" : i === stepIndex ? "#000" : "#333",
                          border: i < stepIndex ? "1px solid rgba(255,255,255,0.2)" : i === stepIndex ? "none" : "1px solid rgba(255,255,255,0.07)",
                          boxShadow: i === stepIndex ? "0 0 20px rgba(255,255,255,0.2)" : "none",
                          transition:"all 0.4s",
                        }}>
                          {i < stepIndex ? "✓" : i + 1}
                        </div>
                        <span style={{
                          fontSize:10, textTransform:"uppercase", letterSpacing:"0.05em",
                          color: i < stepIndex ? "#555" : i === stepIndex ? "#888" : "#2a2a2a",
                          transition:"color 0.4s",
                        }}>{label}</span>
                      </div>
                      {i < 2 && (
                        <div style={{
                          flex:1, height:1, margin:"0 6px 16px",
                          background: i < stepIndex ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
                          transition:"background 0.4s",
                        }} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── STEP: EMAIL ── */}
              {step === "email" && (
                <div className="fp-step-content">
                  <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}>Forgot password?</h1>
                  <p style={{ fontSize:14, color:"#444", marginBottom:18 }}>We'll send a 6-digit OTP to your email</p>
                  <div className="fp-hint">
                    <CheckCircle2 style={{ width:13, height:13, color:"rgba(255,255,255,0.2)", flexShrink:0, marginTop:1 }} />
                    <p>Enter the email address associated with your MeetingMind workspace.</p>
                  </div>
                  <form onSubmit={handleSendOtp} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ position:"relative" }}>
                      <Mail style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.22)", pointerEvents:"none" }} />
                      <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="fp-inp" />
                    </div>
                    {error && <p style={{ fontSize:13, color:"#ef4444", margin:0 }}>{error}</p>}
                    <button type="submit" disabled={loading} className="fp-sbtn">
                      {loading ? <Loader2 style={{ width:18, height:18, animation:"spin 1s linear infinite" }} /> : "Send OTP →"}
                    </button>
                  </form>
                </div>
              )}

              {/* ── STEP: OTP ── */}
              {step === "otp" && (
                <div className="fp-step-content">
                  <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}>Enter OTP</h1>
                  <p style={{ fontSize:14, color:"#444", marginBottom:18 }}>We sent a 6-digit code to <span style={{ color:"#777" }}>{email}</span></p>
                  <form onSubmit={handleVerifyOtp} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {/* OTP boxes */}
                    <div style={{ display:"flex", gap:8, marginBottom:4 }}>
                      {[0,1,2,3,4,5].map(i => (
                        <input
                          key={i}
                          ref={el => { otpRefs.current[i] = el }}
                          type="text" inputMode="numeric" maxLength={1}
                          value={otp[i] || ""}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          className={`fp-otp-box${otp[i] ? " filled" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="fp-hint">
                      <CheckCircle2 style={{ width:13, height:13, color:"rgba(255,255,255,0.2)", flexShrink:0, marginTop:1 }} />
                      <p>OTP expires in <strong style={{ color:"#666" }}>15 minutes</strong>. Check spam if not received.</p>
                    </div>
                    {error && <p style={{ fontSize:13, color:"#ef4444", margin:0 }}>{error}</p>}
                    <button type="submit" disabled={loading || otp.length < 6} className="fp-sbtn">
                      {loading ? <Loader2 style={{ width:18, height:18, animation:"spin 1s linear infinite" }} /> : "Verify OTP →"}
                    </button>
                  </form>
                </div>
              )}

              {/* ── STEP: RESET ── */}
              {step === "reset" && (
                <div className="fp-step-content">
                  <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:6 }}>New password</h1>
                  <p style={{ fontSize:14, color:"#444", marginBottom:18 }}>Choose a strong password</p>
                  <form onSubmit={handleResetPassword} style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    <div style={{ position:"relative" }}>
                      <Lock style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.22)", pointerEvents:"none" }} />
                      <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="fp-inp" />
                    </div>
                    <div style={{ position:"relative" }}>
                      <Lock style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.22)", pointerEvents:"none" }} />
                      <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="fp-inp" />
                    </div>
                    {error && <p style={{ fontSize:13, color:"#ef4444", margin:0 }}>{error}</p>}
                    <button type="submit" disabled={loading} className="fp-sbtn">
                      {loading ? <Loader2 style={{ width:18, height:18, animation:"spin 1s linear infinite" }} /> : "Reset password →"}
                    </button>
                  </form>
                </div>
              )}

              {/* ── STEP: DONE ── */}
              {step === "done" && (
                <div className="fp-step-content" style={{ textAlign:"center", padding:"12px 0" }}>
                  <div style={{
                    width:72, height:72, borderRadius:"50%",
                    background:"rgba(255,255,255,0.05)",
                    border:"1px solid rgba(255,255,255,0.12)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    margin:"0 auto 20px",
                    animation:"successPop 0.6s cubic-bezier(0.16,1,0.3,1) both",
                  }}>
                    <svg width="36" height="36" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2"/>
                      <polyline points="14,24 21,31 34,17" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray="60" strokeDashoffset="60"
                        style={{ animation:"checkDraw 0.5s 0.4s cubic-bezier(0.4,0,0.2,1) forwards" }} />
                    </svg>
                  </div>
                  <h1 style={{ fontSize:26, fontWeight:800, color:"#fff", letterSpacing:"-0.03em", marginBottom:8 }}>Password reset!</h1>
                  <p style={{ fontSize:14, color:"#444", marginBottom:24 }}>You can now sign in with your new password</p>
                  <Link href="/login">
                    <button className="fp-sbtn" style={{ maxWidth:280, margin:"0 auto" }}>Go to login →</button>
                  </Link>
                </div>
              )}

              {/* Bottom link */}
              {step !== "done" && (
                <p style={{ marginTop:20, textAlign:"center", fontSize:14, color:"#333" }}>
                  Remember your password?{" "}
                  <Link href="/login" style={{ color:"#fff", fontWeight:700, textDecoration:"none" }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration="underline")}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration="none")}
                  >Login</Link>
                </p>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  )
}