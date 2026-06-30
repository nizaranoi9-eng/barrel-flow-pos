import { ApiError, getContext, handleApiError, jsonOk, uid } from '@/app/api/_lib/supabase-data'

function mapEmployee(row: any) {
  return {
    id: row.id,
    storeId: row.store_id,
    email: row.email,
    role: row.role,
    employeePin: row.employee_pin,
    name: row.name || row.email,
    phone: row.phone,
    isActive: row.is_active,
    lastLogin: row.last_login,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('store_id', storeId)
      .eq('role', 'cashier')
      .order('name')

    if (error) throw error
    return jsonOk((data || []).map(mapEmployee))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email =
      typeof body.email === 'string' && body.email.trim()
        ? body.email.trim().toLowerCase()
        : `cashier_${crypto.randomUUID().slice(0, 8)}@barrelflow.local`
    const employeePin = typeof body.pin === 'string' ? body.pin.trim() : body.employeePin || null

    if (!name) {
      throw new ApiError('Employee name is required.', 400)
    }

    const { data, error } = await supabase
      .from('app_users')
      .insert({
        id: uid('user_cashier'),
        store_id: storeId,
        email,
        role: 'cashier',
        employee_pin: employeePin || null,
        name,
        is_active: body.isActive ?? true,
      })
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapEmployee(data))
  } catch (error) {
    return handleApiError(error)
  }
}
