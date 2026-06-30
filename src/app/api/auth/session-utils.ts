import type { Settings, Store, User } from '@/lib/types'

export const APP_SESSION_COOKIE = 'retailflow-app-session'

type GoogleSessionInput = {
  id: string
  email: string
  name?: string | null
}

export type AppSession = {
  user: User
  store: Store
  settings: Settings
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_')
}

function nowIso() {
  return new Date().toISOString() as unknown as Date
}

export function createGoogleAppSession(input: GoogleSessionInput): AppSession {
  const userId = `firebase_${sanitizeId(input.id)}`
  const storeId = `store_${userId}`
  const timestamp = nowIso()

  const user: User = {
    id: userId,
    storeId,
    email: input.email,
    role: 'admin',
    employeePin: null,
    name: input.name || input.email,
    phone: null,
    isActive: true,
    lastLogin: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const store: Store = {
    id: storeId,
    name: 'RetailFlow Store',
    phone: null,
    address: null,
    logoUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const settings: Settings = {
    id: `settings_${storeId}`,
    storeId,
    defaultTaxRate: 8.5,
    maxDiscountPercent: 20,
    returnWindowHours: 24,
    lowStockThreshold: 10,
    receiptHeader: null,
    receiptFooter: null,
    currencySymbol: '$',
    createdAt: timestamp,
    updatedAt: timestamp,
    accentColor: '#D97706',
  }

  return { user, store, settings }
}

export function createPasswordAdminSession(email: string): AppSession {
  return createGoogleAppSession({
    id: `admin_${email.toLowerCase()}`,
    email,
    name: 'Admin',
  })
}

export function encodeSession(session: AppSession) {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
}

export function decodeSession(value: string): AppSession | null {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as AppSession
  } catch {
    return null
  }
}
