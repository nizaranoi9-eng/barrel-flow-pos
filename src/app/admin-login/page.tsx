'use client'

import { Toaster } from '@/components/ui/sonner'
import { AuthView } from '@/components/views/AuthView'

export default function AdminLoginPage() {
  return (
    <>
      <AuthView showPasswordLogin />
      <Toaster />
    </>
  )
}
