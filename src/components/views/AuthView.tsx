'use client'

import { useCallback, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Chrome,
  Eye,
  EyeOff,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Store,
} from 'lucide-react'
import { toast } from 'sonner'
import { initMockFetch } from '@/lib/mock-fetch'
import { getFirebaseAuth, getGoogleProvider, isFirebaseConfigured } from '@/lib/firebase'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  type User as FirebaseUser,
} from 'firebase/auth'

const EXPLICIT_LOGOUT_KEY = 'barrelflow-explicit-logout'

function safeSessionStorageGet(key: string) {
  try {
    return window.sessionStorage?.getItem(key) || null
  } catch {
    return null
  }
}

function safeSessionStorageRemove(key: string) {
  try {
    window.sessionStorage?.removeItem(key)
  } catch {
    // Some embedded browsers restrict sessionStorage.
  }
}

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
    return 'Firebase could not start Google sign-in. Make sure Google sign-in is enabled and localhost, 127.0.0.1, and barrel-flow-pos.vercel.app are added under Firebase authorized domains.'
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

type AuthViewProps = {
  showPasswordLogin?: boolean
}

export function AuthView({ showPasswordLogin = false }: AuthViewProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const { setUser, setStore, setSettings } = useAuthStore()

  // Dynamic branding state loaded before login
  const [storeData, setStoreData] = useState<{ name: string; logoUrl: string | null } | null>(null)
  const [settingsData, setSettingsData] = useState<{ accentColor: string | null } | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const createGoogleAppSession = useCallback(async (firebaseUser: FirebaseUser) => {
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
    router.push('/')
  }, [router, setSettings, setStore, setUser])

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
      if (safeSessionStorageGet(EXPLICIT_LOGOUT_KEY) === 'true') return

      const auth = getFirebaseAuth()
      let didCreateAppSession = false

      try {
        const result = await getRedirectResult(auth)
        if (result?.user) {
          didCreateAppSession = true
          setAuthError('')
          await createGoogleAppSession(result.user)
        }
      } catch (error) {
        const message = getGoogleAuthErrorMessage(error)
        setAuthError(message)
        toast.error(message)
      }

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser || didCreateAppSession) return

        didCreateAppSession = true
        try {
          setAuthError('')
          await createGoogleAppSession(firebaseUser)
        } catch (error) {
          const message = getGoogleAuthErrorMessage(error)
          setAuthError(message)
          toast.error(message)
        }
      })

      return unsubscribe
    }

    const cleanupPromise = finishGoogleRedirectSignIn()

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.()).catch(() => {})
    }
  }, [createGoogleAppSession])

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
        router.push('/')
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
    setAuthError('')
    try {
      if (!isFirebaseConfigured()) {
        const message = 'Firebase Google login is not configured yet.'
        setAuthError(message)
        toast.error(message)
        return
      }

      safeSessionStorageRemove(EXPLICIT_LOGOUT_KEY)
      const auth = getFirebaseAuth()
      const provider = getGoogleProvider()

      try {
        const result = await signInWithPopup(auth, provider)
        await createGoogleAppSession(result.user)
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: unknown }).code)
          : ''

        if (code === 'auth/popup-closed-by-user') {
          const message = getGoogleAuthErrorMessage(error)
          setAuthError(message)
          toast.error(message)
          return
        }

        await signInWithRedirect(auth, provider)
      }
    } catch (error) {
      const message = getGoogleAuthErrorMessage(error)
      setAuthError(message)
      toast.error(message)
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

  const brandName = storeData?.name || 'BarrelFlow'
  const loginCardTitle = showPasswordLogin ? 'Admin access' : 'Sign in to your POS'
  const loginCardDescription = showPasswordLogin
    ? 'Use your protected admin credential or continue with Google.'
    : 'Continue securely with Google to open your store workspace.'
  const heroBackground =
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=2200&q=85'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07080A] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-105 bg-cover bg-center opacity-55 blur-[2px]"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,9,0.96)_0%,rgba(15,9,9,0.88)_42%,rgba(8,7,9,0.62)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_22%_24%,rgba(180,84,20,0.28),transparent_34%),radial-gradient(circle_at_75%_70%,rgba(112,20,32,0.24),transparent_38%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#07080A] to-transparent"
      />
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

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-6 rounded-full border border-white/10 bg-black/20 px-4 py-3 backdrop-blur-md sm:px-5">
          <div className="flex items-center gap-3">
            {storeData?.logoUrl ? (
              <img
                src={storeData.logoUrl}
                alt={brandName}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-amber-300/30"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/30 bg-gradient-to-br from-[#E8A84C] to-[#7A2D18] shadow-lg shadow-amber-950/40">
                <Store className="h-5 w-5 text-[#120C08]" />
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-white">{brandName}</div>
              <div className="text-[10px] uppercase text-amber-100/55" style={{ letterSpacing: '0.18em' }}>
                Liquor POS
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-stone-200/80 md:flex">
            <a href="#features" className="transition hover:text-amber-200">Features</a>
            <a href="#pricing" className="transition hover:text-amber-200">Pricing</a>
            <a href="#contact" className="transition hover:text-amber-200">Contact</a>
          </nav>
        </header>

        <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:py-12">
          <section className="max-w-3xl pt-4 lg:pt-0">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-950/25 px-3 py-1.5 text-xs font-medium text-amber-100/85 shadow-sm shadow-black/30 backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5 text-amber-300" />
              POS and billing control for regulated liquor retail
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] text-white sm:text-5xl lg:text-6xl">
              Fast Billing. Smarter Stock. Built for Liquor Stores.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-stone-200/78 sm:text-lg">
              BarrelFlow helps liquor retailers manage billing, inventory, compliance, and daily operations with speed and control.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                className="h-12 rounded-full bg-[#D8892F] px-6 text-sm font-bold text-[#160B04] shadow-xl shadow-amber-950/35 hover:bg-[#E9A94A]"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full border-white/15 bg-white/5 px-6 text-sm font-semibold text-stone-100 backdrop-blur hover:bg-white/10 hover:text-white"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Continue with Google
              </Button>
            </div>

            <div id="features" className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                { icon: ReceiptText, title: 'Rapid billing', text: 'Move queues quickly with POS-first checkout.' },
                { icon: Boxes, title: 'Stock control', text: 'Track bottles, packs, low stock, and movement.' },
                { icon: ShieldCheck, title: 'Compliance ready', text: 'Age checks and audit-friendly operations.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-white/10 bg-black/24 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
                  <item.icon className="mb-3 h-5 w-5 text-amber-300" />
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <p className="mt-1 text-xs leading-5 text-stone-300/72">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <aside className="mx-auto w-full max-w-md lg:ml-auto">
            <Card className="overflow-hidden rounded-2xl border border-amber-100/16 bg-[#100D0C]/68 shadow-2xl shadow-black/45 backdrop-blur-xl">
              <div className="h-1 bg-gradient-to-r from-[#7B241C] via-[#D8892F] to-[#F2CA7A]" />
              <CardContent className="p-6 text-stone-100 sm:p-7">
                <div className="mb-6">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/20 bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-300" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">{loginCardTitle}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-300/76">{loginCardDescription}</p>
                </div>

                <form onSubmit={showPasswordLogin ? handleLogin : (event) => event.preventDefault()} className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-full border-white/12 bg-white/[0.06] text-stone-100 shadow-sm hover:bg-white/[0.11] hover:text-white"
                    disabled={isLoading}
                    onClick={() => handleGoogleSignIn()}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Chrome className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>

                  {authError ? (
                    <div className="rounded-lg border border-red-400/25 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-100">
                      {authError}
                    </div>
                  ) : null}

                  {showPasswordLogin ? (
                    <>
                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <div className="h-px flex-1 bg-white/10" />
                        <span>or</span>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-stone-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@barrelflow.local"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          disabled={isLoading}
                          className="h-11 rounded-lg border-white/10 bg-black/35 text-white placeholder:text-stone-500 focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="password" className="text-stone-300">Password</Label>
                          <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-xs text-amber-300 hover:text-amber-200"
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
                            placeholder="Enter admin password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-11 rounded-lg border-white/10 bg-black/35 pr-11 text-white placeholder:text-stone-500 focus-visible:ring-amber-500"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 h-9 w-9 rounded-full text-stone-400 hover:bg-white/10 hover:text-white"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="h-12 w-full rounded-full bg-[#D8892F] font-bold text-[#170C05] shadow-lg shadow-amber-950/35 hover:bg-[#E9A94A]"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#170C05]" /> : null}
                        Login
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-amber-200/10 bg-black/24 px-4 py-3 text-sm leading-6 text-stone-300/76">
                      Staff access is managed securely with Google sign-in.
                    </div>
                  )}
                </form>

                <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <div className="text-xs uppercase text-amber-200/72" style={{ letterSpacing: '0.16em' }}>
                    Operations snapshot
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-lg font-semibold text-white">200+</div>
                      <div className="text-[11px] text-stone-400">Bills/day</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">Live</div>
                      <div className="text-[11px] text-stone-400">Stock</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-white">POS</div>
                      <div className="text-[11px] text-stone-400">Ready</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="mt-5 text-center text-xs font-medium text-stone-400/80">
              Licensed for liquor store POS operation. Built for retail teams, not consumer delivery.
            </p>
          </aside>
        </main>
      </div>
    </div>
  )
}
