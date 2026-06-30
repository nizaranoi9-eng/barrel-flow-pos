import { getContext, handleApiError, jsonOk, mapCustomer, uid } from '@/app/api/_lib/supabase-data'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return jsonOk((data || []).map(mapCustomer))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('customers')
      .insert({
        id: uid('cust'),
        store_id: storeId,
        name: body.name || 'Unknown Customer',
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
      })
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapCustomer(data))
  } catch (error) {
    return handleApiError(error)
  }
}
