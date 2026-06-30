import { getContext, handleApiError, jsonMessage, jsonOk, mapCustomer } from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
      })
      .eq('id', id)
      .eq('store_id', storeId)
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapCustomer(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const { error } = await supabase.from('customers').delete().eq('id', id).eq('store_id', storeId)
    if (error) throw error
    return jsonMessage('Customer deleted')
  } catch (error) {
    return handleApiError(error)
  }
}
