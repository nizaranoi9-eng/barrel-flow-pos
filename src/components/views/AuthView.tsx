'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Store, Eye, EyeOff, Loader2, Chrome } from 'lucide-react'
import { toast } from 'sonner'
import { initMockFetch } from '@/lib/mock-fetch'
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/lib/firebase'
import { getRedirectResult, signInWithPopup, signInWithRedirect, type User as FirebaseUser } from 'firebase/auth'

function getGoogleAuthErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : ''

  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not allowed in Firebase Authentication. Add localhost and your Vercel domain in Firebase authorized domains.'
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is not enabled in Firebase Authentication.'
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Google sign-in was cancelled before it finished.'
  }

  if (code === 'auth/popup-blocked') {
    return 'The browser blocked the Google sign-in popup. Allow popups for this site and try again.'
  }

  if (code === 'auth/invalid-api-key' || code === 'auth/api-key-not-valid') {
    return 'The Firebase API key is not valid for this project.'
  }

  if (code === 'auth/internal-error') {
    return 'Firebase could not start Google sign-in. Make sure Google sign-in is enabled and localhost is added under Firebase authorized domains.'
  }

  return error instanceof Error ? error.message : 'Google login failed.'
}

// Helper to convert hex to rgb string
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `${r}, ${g}, ${b}`;
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '217, 119, 6'; // default amber-500
}

// Helper to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  let r = parseInt(cleanHex.slice(0, 2), 16);
  let g = parseInt(cleanHex.slice(2, 4), 16);
  let b = parseInt(cleanHex.slice(4, 6), 16);

  r = Math.min(255, Math.max(0, r + percent));
  g = Math.min(255, Math.max(0, g + percent));
  b = Math.min(255, Math.max(0, b + percent));

  const rr = r.toString(16).padStart(2, '0');
  const gg = g.toString(16).padStart(2, '0');
  const bb = b.toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
}

export function AuthView() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { setUser, setStore, setSettings } = useAuthStore()

  // Dynamic branding state loaded before login
  const [storeData, setStoreData] = useState<{ name: string; logoUrl: string | null } | null>(null)
  const [settingsData, setSettingsData] = useState<{ accentColor: string | null } | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const createGoogleAppSession = async (firebaseUser: FirebaseUser) => {
    if (!firebaseUser.email) {
      throw new Error('Google did not return an email address.')
    }

    const response = await fetch('/api/auth/supabase-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email,
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
    toast.success('Welcome back!')
  }

  useEffect(() => {
    initMockFetch()
    const loadBranding = async () => {
      try {
        const storeRes = await fetch('/api/store')
        const storeJson = await storeRes.json()
        if (storeJson.success) {
          setStoreData(storeJson.data)
        }
        
        const settingsRes = await fetch('/api/settings')
        const settingsJson = await settingsRes.json()
        if (settingsJson.success) {
          setSettingsData(settingsJson.data)
        }
      } catch (e) {
        console.error('Failed to load branding in AuthView:', e)
      }
    }
    loadBranding()
  }, [])

  useEffect(() => {
    const finishGoogleRedirectSignIn = async () => {
      if (!isFirebaseConfigured()) return

      try {
        const result = await getRedirectResult(getFirebaseAuth())
        if (result?.user) {
          await createGoogleAppSession(result.user)
        }
      } catch (error) {
        toast.error(getGoogleAuthErrorMessage(error))
      }
    }

    finishGoogleRedirectSignIn()
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const appName = storeData?.name || 'BarrelFlow';
      document.title = `${appName} - POS Login`;
    }
  }, [storeData?.name])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        setStore(data.data.store)
        if (data.data.settings) setSettings(data.data.settings)
        toast.success('Welcome back!')
      } else {
        toast.error(response.status === 503 ? data.error : 'Invalid email or password.')
      }
    } catch (error) {
      toast.error('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      if (!isFirebaseConfigured()) {
        toast.error('Firebase Google login is not configured yet.')
        return
      }

      const auth = getFirebaseAuth()
      const provider = getGoogleProvider()

      try {
        const result = await signInWithPopup(auth, provider)
        await createGoogleAppSession(result.user)
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: unknown }).code)
          : ''

        if (code === 'auth/popup-blocked') {
          await signInWithRedirect(auth, provider)
          return
        }

        throw error
      }
    } catch (error) {
      toast.error(getGoogleAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordResetEmail = async () => {
    const email = loginEmail.trim()

    if (!email) {
      toast.error('Enter your email first.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/password-reset/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!data.success) throw new Error(data.error || 'Could not send reset email.')
      toast.success('If this email exists, a password reset link has been sent.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send reset email.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1322] via-[#080B14] to-[#0A0D1B] flex items-center justify-center p-4">
      {/* Dynamic Style Injection for Theme Accent Color */}
      {(() => {
        const accentColor = settingsData?.accentColor || '#D97706';
        const accentColorRgb = hexToRgb(accentColor);
        const accentColorLight = adjustBrightness(accentColor, 20);
        const accentColorDark = adjustBrightness(accentColor, -20);
        return (
          <style dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary-accent: ${accentColor};
                --primary-accent-rgb: ${accentColorRgb};
                --primary-accent-light: ${accentColorLight};
                --primary-accent-dark: ${accentColorDark};
              }
              
              /* Color text overrides */
              .text-amber-500 {
                color: var(--primary-accent) !important;
              }
              .text-amber-400 {
                color: var(--primary-accent-light) !important;
              }
              .text-amber-600 {
                color: var(--primary-accent-dark) !important;
              }
              .hover\\:text-amber-400:hover {
                color: var(--primary-accent-light) !important;
              }
              .hover\\:text-amber-500:hover {
                color: var(--primary-accent) !important;
              }

              /* Background overrides */
              .bg-amber-500 {
                background-color: var(--primary-accent) !important;
              }
              .bg-amber-600 {
                background-color: var(--primary-accent-dark) !important;
              }
              .hover\\:bg-amber-600:hover {
                background-color: var(--primary-accent-dark) !important;
              }
              .hover\\:bg-amber-500:hover {
                background-color: var(--primary-accent) !important;
              }
              .bg-amber-500\\/10 {
                background-color: rgba(var(--primary-accent-rgb), 0.1) !important;
              }
              .bg-amber-500\\/5 {
                background-color: rgba(var(--primary-accent-rgb), 0.05) !important;
              }

              /* Border overrides */
              .border-amber-500 {
                border-color: var(--primary-accent) !important;
              }
              .border-amber-500\\/20 {
                border-color: rgba(var(--primary-accent-rgb), 0.2) !important;
              }
              .border-amber-500\\/30 {
                border-color: rgba(var(--primary-accent-rgb), 0.3) !important;
              }
              .border-amber-600 {
                border-color: var(--primary-accent-dark) !important;
              }

              /* Ring & focus overrides */
              .focus-visible\\:ring-amber-500:focus-visible {
                --tw-ring-color: var(--primary-accent) !important;
                border-color: var(--primary-accent) !important;
              }
              .focus\\:ring-amber-500:focus {
                --tw-ring-color: var(--primary-accent) !important;
                border-color: var(--primary-accent) !important;
              }
              .focus\\:border-amber-500:focus {
                border-color: var(--primary-accent) !important;
              }

              /* Accent color */
              .accent-amber-500 {
                accent-color: var(--primary-accent) !important;
              }

              /* Gradient overrides */
              .from-amber-500 {
                --tw-gradient-from: var(--primary-accent) !important;
                --tw-gradient-to: rgba(var(--primary-accent-rgb), 0) !important;
                --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
              }
              .to-yellow-600 {
                --tw-gradient-to: var(--primary-accent-light) !important;
              }
              .hover\\:from-amber-600:hover {
                --tw-gradient-from: var(--primary-accent-dark) !important;
              }
              .hover\\:to-yellow-700:hover {
                --tw-gradient-to: var(--primary-accent) !important;
              }

              /* Shadows */
              .shadow-amber-500\\/10 {
                --tw-shadow-color: rgba(var(--primary-accent-rgb), 0.1) !important;
              }
              .shadow-amber-500\\/20 {
                --tw-shadow-color: rgba(var(--primary-accent-rgb), 0.2) !important;
              }
            `
          }} />
        );
      })()}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 bg-transparent">
          {storeData?.logoUrl ? (
            <img 
              src={storeData.logoUrl} 
              alt={storeData.name || 'Logo'} 
              className="inline-flex w-16 h-16 rounded-2xl mb-4 object-cover shadow-lg shadow-amber-500/20" 
            />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/20">
              <Store className="w-8 h-8 text-black" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{storeData?.name || 'BarrelFlow'}</h1>
          <p
            className="text-[11px] font-light uppercase cursor-default transition-all duration-300 select-none mt-2"
            style={{ color: 'rgba(148, 163, 184, 0.55)', letterSpacing: '0.3em' }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = 'rgba(251, 191, 36, 0.9)';
              (e.target as HTMLElement).style.textShadow = '0 0 12px rgba(251, 191, 36, 0.5)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = 'rgba(148, 163, 184, 0.55)';
              (e.target as HTMLElement).style.textShadow = 'none';
            }}
          >
            Powered by Andy Gogoi
          </p>
          <p className="text-amber-500/80 font-medium text-sm mt-2.5">Fast Billing for Liquor Stores</p>
        </div>

        {/* Auth Card */}
        <Card className="bg-[#151C2C]/90 border-slate-800 shadow-2xl backdrop-blur-md">
          <CardContent className="pt-6 text-slate-200">
            <form onSubmit={handleLogin} className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-700 bg-[#0B0F19] text-slate-100 hover:bg-slate-800 hover:text-white"
                disabled={isLoading}
                onClick={() => handleGoogleSignIn()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Chrome className="w-4 h-4 mr-2" />
                )}
                Continue with Google
              </Button>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="h-px flex-1 bg-slate-800" />
                <span>or</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@demo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-[#0B0F19] border-slate-800 text-white placeholder-slate-600 focus-visible:ring-amber-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs text-amber-500 hover:text-amber-400"
                    disabled={isLoading}
                    onClick={handlePasswordResetEmail}
                  >
                    Send reset link
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-[#0B0F19] border-slate-800 text-white placeholder-slate-600 focus-visible:ring-amber-500"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-black" /> : null}
                Login
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6 font-medium">
          Licensed for Liquor Store POS Operation • Ver. 4.0
        </p>
      </div>
    </div>
  )
}
