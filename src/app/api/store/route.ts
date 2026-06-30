import { getContext, handleApiError, jsonOk, mapStore } from '@/app/api/_lib/supabase-data'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase.from('stores').select('*').eq('id', storeId).single()
    if (error) throw error
    return jsonOk(mapStore(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('stores')
      .update({
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        logo_url: body.logoUrl || null,
      })
      .eq('id', storeId)
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapStore(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = PUT
