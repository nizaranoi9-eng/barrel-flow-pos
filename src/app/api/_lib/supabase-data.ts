import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { APP_SESSION_COOKIE, decodeSession, type AppSession } from '@/app/api/auth/session-utils'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { DEFAULT_CATEGORIES } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createSupabaseServerClient>

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export async function getSession() {
  const sessionCookie = (await cookies()).get(APP_SESSION_COOKIE)?.value
  const session = sessionCookie ? decodeSession(sessionCookie) : null

  if (!session?.user?.id || !session?.store?.id) {
    throw new ApiError('Please sign in again.', 401)
  }

  return session
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init)
}

export function jsonMessage(message: string, init?: ResponseInit) {
  return NextResponse.json({ success: true, message }, init)
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status })
  }

  console.error(error)
  return NextResponse.json(
    { success: false, error: 'Something went wrong. Please try again.' },
    { status: 500 }
  )
}

export function uid(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 14)}`
}

function fail(error: unknown, fallback = 'Supabase request failed') {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message)
      : fallback
  throw new ApiError(message, 500)
}

export async function getContext() {
  const session = await getSession()
  const supabase = createSupabaseServerClient()
  await ensureSessionRows(supabase, session)
  return { supabase, session, storeId: session.store.id, userId: session.user.id }
}

export async function ensureSessionRows(supabase: SupabaseClient, session: AppSession) {
  const now = new Date().toISOString()

  const { error: storeError } = await supabase.from('stores').upsert(
    {
      id: session.store.id,
      name: session.store.name || 'RetailFlow Store',
      phone: session.store.phone,
      address: session.store.address,
      logo_url: session.store.logoUrl,
    },
    { onConflict: 'id' }
  )
  if (storeError) fail(storeError)

  const { error: userError } = await supabase.from('app_users').upsert(
    {
      id: session.user.id,
      store_id: session.store.id,
      email: session.user.email,
      role: session.user.role || 'admin',
      employee_pin: session.user.employeePin,
      name: session.user.name || session.user.email,
      phone: session.user.phone,
      is_active: session.user.isActive ?? true,
      last_login: now,
    },
    { onConflict: 'id' }
  )
  if (userError) fail(userError)

  const { error: settingsError } = await supabase.from('store_settings').upsert(
    {
      id: session.settings.id || `settings_${session.store.id}`,
      store_id: session.store.id,
      default_tax_rate: session.settings.defaultTaxRate ?? 8.5,
      max_discount_percent: session.settings.maxDiscountPercent ?? 20,
      return_window_hours: session.settings.returnWindowHours ?? 24,
      low_stock_threshold: session.settings.lowStockThreshold ?? 10,
      receipt_header: session.settings.receiptHeader,
      receipt_footer: session.settings.receiptFooter,
      currency_symbol: session.settings.currencySymbol || '$',
      accent_color: session.settings.accentColor || '#D97706',
      enable_age_verification: session.settings.enableAgeVerification ?? false,
      min_legal_age: session.settings.minLegalAge ?? 21,
      require_dob_before_checkout: session.settings.requireDobBeforeCheckout ?? false,
      card_theme_mode: session.settings.cardThemeMode || 'system',
    },
    { onConflict: 'store_id' }
  )
  if (settingsError) fail(settingsError)
}

export async function ensureDefaultCategories(supabase: SupabaseClient, storeId: string) {
  const { count, error: countError } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (countError) fail(countError)
  if ((count || 0) > 0) return

  const { error } = await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map((category) => ({
      id: uid('cat'),
      store_id: storeId,
      name: category.name,
      tax_rate: category.taxRate,
    }))
  )
  if (error) fail(error)
}

export function mapStore(row: any) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address,
    logoUrl: row.logo_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapSettings(row: any) {
  return {
    id: row.id,
    storeId: row.store_id,
    defaultTaxRate: Number(row.default_tax_rate || 0),
    maxDiscountPercent: Number(row.max_discount_percent || 0),
    returnWindowHours: row.return_window_hours,
    lowStockThreshold: row.low_stock_threshold,
    receiptHeader: row.receipt_header,
    receiptFooter: row.receipt_footer,
    currencySymbol: row.currency_symbol,
    accentColor: row.accent_color,
    enableAgeVerification: row.enable_age_verification,
    minLegalAge: row.min_legal_age,
    requireDobBeforeCheckout: row.require_dob_before_checkout,
    cardThemeMode: row.card_theme_mode,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCategory(row: any, productCount = 0) {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    taxRate: Number(row.tax_rate || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _count: { products: productCount },
  }
}

export function mapProduct(row: any) {
  const category = row.categories ? mapCategory(row.categories) : undefined
  return {
    id: row.id,
    storeId: row.store_id,
    categoryId: row.category_id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    costPrice: Number(row.cost_price || 0),
    sellingPrice: Number(row.selling_price || 0),
    measurementUnit: row.measurement_unit,
    packageType: row.package_type,
    packageSize: Number(row.package_size || 1),
    stockPackages: row.stock_packages,
    totalStockBaseUnit: Number(row.total_stock_base_unit || 0),
    brand: row.brand,
    abv: row.abv == null ? undefined : Number(row.abv),
    bottleSize: row.bottle_size,
    mrp: row.mrp == null ? undefined : Number(row.mrp),
    batchNumber: row.batch_number,
    expiryDate: row.expiry_date,
    supplier: row.supplier,
    stockQuantity: row.stock_quantity,
    unit: row.unit,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category,
  }
}

export function productPayload(body: any, storeId: string, existingId?: string) {
  const stockQuantity = Number(body.stockQuantity ?? body.stockPackages ?? 0)
  return {
    ...(existingId ? {} : { id: uid('prod') }),
    store_id: storeId,
    category_id: body.categoryId || null,
    name: body.name,
    sku: body.sku || null,
    barcode: body.barcode || null,
    cost_price: Number(body.costPrice || 0),
    selling_price: Number(body.sellingPrice || 0),
    measurement_unit: body.measurementUnit || 'piece',
    package_type: body.packageType || 'unit',
    package_size: Number(body.packageSize || 1),
    stock_packages: Number(body.stockPackages ?? stockQuantity),
    total_stock_base_unit: Number(body.totalStockBaseUnit ?? stockQuantity),
    brand: body.brand || null,
    abv: body.abv === '' || body.abv == null ? null : Number(body.abv),
    bottle_size: body.bottleSize || null,
    mrp: body.mrp === '' || body.mrp == null ? null : Number(body.mrp),
    batch_number: body.batchNumber || null,
    expiry_date: body.expiryDate || null,
    supplier: body.supplier || null,
    stock_quantity: stockQuantity,
    unit: body.unit || body.measurementUnit || 'piece',
    is_active: body.isActive ?? true,
  }
}

export function mapCustomer(row: any) {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    totalOrders: row.total_orders,
    totalSpent: Number(row.total_spent || 0),
    lastOrder: row.last_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapOrder(row: any) {
  return {
    id: row.id,
    storeId: row.store_id,
    cashierId: row.cashier_id,
    invoiceNumber: row.invoice_number,
    subtotal: Number(row.subtotal || 0),
    taxAmount: Number(row.tax_amount || 0),
    discountAmount: Number(row.discount_amount || 0),
    discountType: row.discount_type,
    discountValue: row.discount_value == null ? null : Number(row.discount_value),
    totalAmount: Number(row.total_amount || 0),
    paymentMethod: row.payment_method,
    status: row.status,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    notes: row.notes,
    createdAt: row.created_at,
    syncedAt: row.synced_at,
    cashier: row.app_users ? { name: row.app_users.name || row.app_users.email } : { name: 'Cashier Staff' },
    items: (row.order_items || []).map((item: any) => ({
      id: item.id,
      orderId: item.order_id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price || 0),
      taxRate: Number(item.tax_rate || 0),
      lineTotal: Number(item.line_total || 0),
      product: item.products ? mapProduct(item.products) : undefined,
    })),
    payments: (row.payments || []).map((payment: any) => ({
      id: payment.id,
      orderId: payment.order_id,
      paymentMethod: payment.payment_method,
      amount: Number(payment.amount || 0),
      createdAt: payment.created_at,
    })),
  }
}

export async function fetchOrders(supabase: SupabaseClient, storeId: string, limit?: number) {
  let query = supabase
    .from('orders')
    .select('*, app_users(name,email), order_items(*, products(*, categories(*))), payments(*)')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })

  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) fail(error)
  return (data || []).map(mapOrder)
}

export async function fetchSettings(supabase: SupabaseClient, storeId: string) {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', storeId)
    .single()

  if (error) fail(error)
  return mapSettings(data)
}
