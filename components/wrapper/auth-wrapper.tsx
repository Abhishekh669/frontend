"use client"

import { useGetUserFromToken } from '@/utils/hooks/tanstack-query/query-hook/user/use-get-user-from-token'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useGetUserFromToken(true)
  const router = useRouter()
  const pathname = usePathname()

  const user = data?.user
  const isLoginPage = pathname === "/login"

  useEffect(() => {
    if (isLoading) return

    if (!user && !isLoginPage) {
      router.replace("/login")
    }

    if (user && isLoginPage) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, isLoginPage, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    )
  }

  if ((!user && !isLoginPage) || (user && isLoginPage)) {
    return null
  }

  return <>{children}</>
}

export default AuthWrapper
