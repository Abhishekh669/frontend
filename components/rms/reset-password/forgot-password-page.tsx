"use client"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Mail, ArrowRight, CheckCircle2, Loader2, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { createForgetPassword } from "@/utils/actions/auth/login.action"

const COOLDOWN_SECONDS = 60
const STORAGE_KEY = "forgot_pw_cooldown_until"

function getRemainingSeconds(): number {
  try {
    const until = localStorage.getItem(STORAGE_KEY)
    if (!until) return 0
    const remaining = Math.ceil((parseInt(until) - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  } catch {
    return 0
  }
}

function setCooldown() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + COOLDOWN_SECONDS * 1000))
  } catch {}
}

function clearCooldown() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldownState] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // On mount, restore any existing cooldown from localStorage
  useEffect(() => {
    const remaining = getRemainingSeconds()
    if (remaining > 0) {
      setSent(true)
      setCooldownState(remaining)
    }
  }, [])

  // Tick the countdown
  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      const remaining = getRemainingSeconds()
      setCooldownState(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current!)
        clearCooldown()
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [cooldown])

  const validate = (val: string) => {
    if (!val) return "Email address is required."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
      return "Enter a valid email address."
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const err = validate(email)
    if (err) {
      setError(err)
      return
    }

    setError("")
    setLoading(true)

    try {
      const res = await createForgetPassword(email)

      if (res.success && res.token) {
        setCooldown()
        setCooldownState(COOLDOWN_SECONDS)
        setSent(true)

        setTimeout(() => {
          router.push(`/forgot-password/verification?email=${email}&token=${res.token}`)
        }, 1000)
      } else {
        setError(res.message || "Failed to create forget password session")
      }
    } catch (error) {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleTryAgain = () => {
    if (cooldown > 0) return
    setSent(false)
    setEmail("")
    clearCooldown()
  }

  const progressPercent = Math.round((cooldown / COOLDOWN_SECONDS) * 100)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {!sent ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-6">
                <Mail className="w-4 h-4 text-white" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900 mb-1">Forgot your password?</h1>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                No worries. Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-600">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError("") }}
                      disabled={loading}
                      className={`pl-9 h-10 text-sm rounded-lg border transition-colors
                        ${error
                          ? "border-red-300 focus-visible:ring-red-200 bg-red-50"
                          : "border-gray-200 focus-visible:ring-gray-200 bg-white"
                        }`}
                    />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending link...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send Reset Request
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </Button>
              </form>

              <p className="text-xs text-center text-gray-400 mt-5">
                Remember it?{" "}
                <a href="/login" className="text-gray-700 font-medium hover:underline underline-offset-2">
                  Back to login
                </a>
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1.5">Check your inbox</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-1">We sent a reset link to</p>
              <p className="text-sm font-medium text-gray-800 mb-6">{email}</p>

              {/* Resend button with cooldown */}
              <Button
                onClick={handleTryAgain}
                disabled={cooldown > 0}
                variant="outline"
                className="w-full h-10 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Resend in {cooldown}s
                  </span>
                ) : (
                  "Didn't get it? Try again"
                )}
              </Button>

              {/* Progress bar */}
              {cooldown > 0 && (
                <div className="mt-3 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}