import ForgotPasswordVerificationPage from '@/components/rms/reset-password/forgot-password-verification-page'
import { Suspense } from 'react'

function page() {
  return <Suspense fallback={<div>Loading verification details...</div>}>
    <ForgotPasswordVerificationPage />
  </Suspense>

}

export default page
