import AuthWrapper from '@/components/wrapper/auth-wrapper'
import React from 'react'

function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <AuthWrapper>
                {children}
            </AuthWrapper>
        </>
    )
}

export default AuthLayout
