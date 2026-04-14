"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Key, Lock, Shield, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useGetForgetPasswordSession } from '@/utils/hooks/tanstack-query/query-hook/user/use-get-forget-pass-session'
import { checkForgetPasswordPin } from '@/utils/actions/auth/login.action'
import { toast } from 'sonner'

function ForgotPasswordVerificationPage() {
  const router = useRouter();
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const token = searchParams.get('token')
  
  const [pin, setPin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({
    pin: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)

  // Validate email and token parameters
  if (!email || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid reset link. Missing required parameters.
              <div className="mt-4">
                <Button onClick={() => router.replace('/login')} className="w-full">
                  Go to Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const { data, isLoading: isSessionLoading, isError, error } = useGetForgetPasswordSession(email, token)

  // Handle session validation
  useEffect(() => {
    if (!isSessionLoading) {
      if (isError || !data?.success) {
        toast.error(data?.message || error?.message || "Invalid or expired reset link")
        
        // Start countdown for redirect
        setRedirectCountdown(5)
        const timer = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              router.replace('/login')
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        return () => clearInterval(timer)
      }
    }
  }, [isSessionLoading, isError, data, error, router])

  // Show loading state
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Reset Link</h2>
          <p className="text-gray-600">Please wait while we verify your request...</p>
          <div className="mt-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // Show error state with redirect
  if (isError || !data?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="bg-red-50 border-red-200 mb-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-semibold text-red-900 mb-2">Invalid or Expired Reset Link</p>
              <p className="text-sm">
                {data?.message || error?.message || "This password reset link is invalid or has expired."}
              </p>
              <p className="text-sm mt-2">
                Please request a new password reset link from the login page.
              </p>
              {redirectCountdown > 0 && (
                <p className="text-sm mt-3 text-red-700">
                  Redirecting to login in {redirectCountdown} seconds...
                </p>
              )}
              <div className="mt-4">
                <Button onClick={() => router.replace('/login')} className="w-full">
                  Go to Login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          {/* Request New Link Option */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Need a new reset link?{" "}
              <button
                onClick={() => router.push('/forgot-password')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Click here
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  const validatePin = (value: string) => {
    if (!value) return 'PIN is required'
    if (value.length > 30) return 'PIN must be 30 characters or less'
    return ''
  }

  const validatePassword = (value: string) => {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Password must be at least 8 characters'
    if (value.length > 30) return 'Password must be 30 characters or less'
    if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter'
    if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter'
    if (!/(?=.*[0-9])/.test(value)) return 'Password must contain at least one number'
    if (!/(?=.*[!@#$%^&*])/.test(value)) return 'Password must contain at least one special character'
    return ''
  }

  const validateConfirmPassword = (value: string) => {
    if (!value) return 'Please confirm your password'
    if (value !== newPassword) return 'Passwords do not match'
    return ''
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 30)
    setPin(value)
    setErrors({ ...errors, pin: validatePin(value) })
  }

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 30)
    setNewPassword(value)
    setErrors({
      ...errors,
      newPassword: validatePassword(value),
      confirmPassword: confirmPassword ? validateConfirmPassword(confirmPassword) : ''
    })
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 30)
    setConfirmPassword(value)
    setErrors({ ...errors, confirmPassword: validateConfirmPassword(value) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const pinError = validatePin(pin)
    const passwordError = validatePassword(newPassword)
    const confirmError = validateConfirmPassword(confirmPassword)

    if (pinError || passwordError || confirmError) {
      setErrors({
        pin: pinError,
        newPassword: passwordError,
        confirmPassword: confirmError
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await checkForgetPasswordPin({
        pin,
        token,
        email,
        new_password: newPassword
      })

      if (res.success) {
        toast.success("Password reset successfully! Redirecting to login...")
        setTimeout(() => {
          router.replace('/login')
        }, 3000)
      } else {
        toast.error(res.message || "Failed to reset password")
        // If PIN is invalid, clear it
        if (res.message?.toLowerCase().includes('pin')) {
          setPin('')
        }
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (!newPassword) return { level: 0, text: '', color: '' }

    let strength = 0
    if (newPassword.length >= 8) strength++
    if (newPassword.length >= 12) strength++
    if (/(?=.*[a-z])/.test(newPassword)) strength++
    if (/(?=.*[A-Z])/.test(newPassword)) strength++
    if (/(?=.*[0-9])/.test(newPassword)) strength++
    if (/(?=.*[!@#$%^&*])/.test(newPassword)) strength++

    if (strength <= 2) return { level: 20, text: 'Weak', color: 'bg-red-500' }
    if (strength <= 4) return { level: 60, text: 'Medium', color: 'bg-yellow-500' }
    return { level: 100, text: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Password
          </h1>
          <p className="text-gray-600">
            Enter the verification PIN sent to {email} and set a new password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Input */}
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-gray-700 font-medium">
              Verification PIN <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="pin"
                type="text"
                placeholder="Enter verification PIN"
                value={pin}
                onChange={handlePinChange}
                className={`pl-10 ${errors.pin ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
                maxLength={30}
              />
            </div>
            {errors.pin && (
              <p className="text-sm text-red-500">{errors.pin}</p>
            )}
            <p className="text-xs text-gray-500">
              Max 30 characters • Enter the PIN sent to your email
            </p>
          </div>

          {/* New Password Input */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-gray-700 font-medium">
              New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={handleNewPasswordChange}
                className={`pl-10 pr-10 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
                maxLength={30}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span>Password strength:</span>
                  <span className={`font-medium ${passwordStrength.text === 'Strong' ? 'text-green-600' :
                      passwordStrength.text === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${passwordStrength.level}%` }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
            <div className="text-xs text-gray-500 space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>8-30 characters long</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
                <li>At least one special character (!@#$%^&*)</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
              Confirm New Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                disabled={isLoading}
                maxLength={30}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Resetting Password...</span>
              </div>
            ) : (
              'Reset Password'
            )}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Login
            </button>
          </div>
        </form>

        {/* Info Alert */}
        <Alert className="mt-6 bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm text-blue-800">
            <p className="font-medium mb-1">📧 Didn't receive a PIN?</p>
            <p>Check your spam folder or <button 
              onClick={() => router.push('/forgot-password')}
              className="text-blue-600 hover:underline font-medium"
            >
              request a new PIN
            </button></p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

export default ForgotPasswordVerificationPage