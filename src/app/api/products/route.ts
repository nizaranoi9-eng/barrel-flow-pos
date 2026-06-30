import { getContext, handleApiError, jsonOk, mapProduct, productPayload } from '@/app/api/_lib/supabase-data'

const productSelect = '*, categories(*)'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('products')
      .select(productSelect)
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return jsonOk((data || []).map(mapProduct))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('products')
      .insert(productPayload(body, storeId))
      .select(productSelect)
      .single()

    if (error) throw error
    return jsonOk(mapProduct(data))
  } catch (error) {
    return handleApiError(error)
  }
}
