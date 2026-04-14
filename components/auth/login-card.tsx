"use client"

import { loginAction } from '@/utils/actions/auth/login.action'
import { getErrorMessage } from '@/utils/helper/get-error-message'
import { useState } from 'react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '../ui/card'
import { Eye, EyeOff, Mail, Lock, Loader2, KeyRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'

function LoginCard() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const loginHandler = async () => {
    setLoading(true)
    try {
      const res = await loginAction(email, password)
      if (res.success && res.message) {
        toast.success(res.message)
        queryClient.removeQueries({ queryKey: ["get-user-from-token"] })
        router.replace("/dashboard")
        router.refresh()
      } else if (res.error) {
        throw new Error(res.error)
      }
    } catch (error) {
      const msg = getErrorMessage(error)
      toast.error(String(msg))
      console.log("Login error:", msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return
    loginHandler()
  }

  return (
    <Card className="relative w-full max-w-md rounded-2xl border border-zinc-200/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl">
      
      {/* Glow */}
      <div className="absolute inset-0 -z-10 rounded-2xl bg-linear-to-r from-purple-500/20 to-blue-500/20 dark:from-purple-400/30 dark:to-blue-400/30 blur-2xl" />

      <CardHeader className="space-y-2">
        <CardTitle className="text-center text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Welcome Back
        </CardTitle>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Login to continue
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
          <Input
            disabled={loading}
            className="h-11 pl-10"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
          <Input
            disabled={loading}
            className="h-11 pl-10 pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            <KeyRound size={14} />
            Forgot password?
          </Link>
        </div>

        {/* Button */}
        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-linear-to-r from-purple-600 to-blue-600 text-white hover:opacity-90"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              Logging in...
            </span>
          ) : (
            "Login"
          )}
        </Button>
        </form>
      </CardContent>

     
    </Card>
  )
}

export default LoginCard