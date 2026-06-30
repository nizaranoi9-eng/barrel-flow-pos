import { ApiError, getContext, handleApiError, jsonMessage, jsonOk } from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ id: string }> }

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

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const employeePin = typeof body.pin === 'string' ? body.pin.trim() : body.employeePin

    if (!name) {
      throw new ApiError('Employee name is required.', 400)
    }

    const { data, error } = await supabase
      .from('app_users')
      .update({
        name,
        ...(typeof body.email === 'string' ? { email: body.email.trim().toLowerCase() } : {}),
        ...(employeePin !== undefined ? { employee_pin: employeePin || null } : {}),
        ...(typeof body.isActive === 'boolean' ? { is_active: body.isActive } : {}),
      })
      .eq('id', id)
      .eq('store_id', storeId)
      .eq('role', 'cashier')
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapEmployee(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id)
      .eq('store_id', storeId)
      .eq('role', 'cashier')

    if (error) throw error
    return jsonMessage('Employee removed')
  } catch (error) {
    return handleApiError(error)
  }
}
