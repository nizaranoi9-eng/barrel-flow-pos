'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { initMockFetch } from '@/lib/mock-fetch'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { setUser, setStore, setSettings } = useAuthStore()
  const [message, setMessage] = useState('Completing Google sign in...')
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isResetMode, setIsResetMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [resetAccessToken, setResetAccessToken] = useState('')

  useEffect(() => {
    const completeSignIn = async () => {
      initMockFetch()

      try {
        const url = new URL(window.location.href)
        const errorDescription = url.searchParams.get('error_description')
        const code = url.searchParams.get('code')
        const isPasswordReset = url.searchParams.get('mode') === 'password-reset'

        if (errorDescription) {
          throw new Error(errorDescription)
        }

        if (!code) {
          throw new Error('Missing OAuth callback code.')
        }

        const exchangeResponse = await fetch('/api/auth/supabase/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
        const exchange = await exchangeResponse.json()
        if (!exchange.success) {
          throw new Error(exchange.error || 'Could not complete Supabase sign in.')
        }

        const supabaseUser = exchange.data.user
        if (!supabaseUser?.email) {
          throw new Error('Google did not return an email address.')
        }

        const response = await fetch('/api/auth/supabase-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: supabaseUser.id,
            email: supabaseUser.email,
            name:
              supabaseUser.user_metadata?.full_name ||
              supabaseUser.user_metadata?.name ||
              supabaseUser.email,
          }),
          credentials: 'include',
        })
        const session = await response.json()

        if (!session.success) {
          throw new Error(session.error || 'Could not create app session.')
        }

        setUser(session.data.user)
        setStore(session.data.store)
        if (session.data.settings) setSettings(session.data.settings)

        if (isPasswordReset) {
          setVerifiedEmail(supabaseUser.email)
          setResetAccessToken(exchange.data.accessToken)
          setIsResetMode(true)
          setMessage('Email link verified. Set a new password.')
          return
        }

        router.replace('/')
      } catch (error) {
        const details = error instanceof Error ? error.message : 'Unknown auth error.'
        setMessage(details)
        window.setTimeout(() => router.replace('/'), 2400)
      }
    }

    completeSignIn()
  }, [router, setSettings, setStore, setUser])

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault()

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    setIsSaving(true)
    try {
      const updateResponse = await fetch('/api/auth/supabase/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: resetAccessToken, password: newPassword }),
      })
      const update = await updateResponse.json()
      if (!update.success) throw new Error(update.error || 'Could not update password.')

      const response = await fetch('/api/auth/google-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifiedEmail, password: newPassword }),
      })
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Could not reset password.')
      }

      setUser(data.data.user)
      setStore(data.data.store)
      if (data.data.settings) setSettings(data.data.settings)
      setMessage('Password updated. Redirecting...')
      window.setTimeout(() => router.replace('/'), 1200)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not reset password.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-[#090D1A] flex items-center justify-center text-slate-100 p-4">
        <form onSubmit={handlePasswordReset} className="w-full max-w-sm space-y-4 rounded-xl border border-slate-800 bg-[#151C2C] p-6 shadow-2xl">
          <div>
            <h1 className="text-lg font-bold text-white">Reset Password</h1>
            <p className="mt-1 text-xs text-slate-400">Verified with Google: {verifiedEmail}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-slate-300">New password</Label>
            <Input
              id="new-password"
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-slate-300">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500"
              required
            />
          </div>
          {message && <p className="text-xs text-slate-400">{message}</p>}
          <Button type="submit" disabled={isSaving} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2 text-black" /> : null}
            Save New Password
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#090D1A] flex items-center justify-center text-slate-100">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
        <span>{message}</span>
      </div>
    </div>
  )
}
