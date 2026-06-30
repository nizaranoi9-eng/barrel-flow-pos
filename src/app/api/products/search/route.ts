import { getContext, handleApiError, jsonOk, mapProduct } from '@/app/api/_lib/supabase-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const { supabase, storeId } = await getContext()

    let query = supabase
      .from('products')
      .select('*, categories(*)')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name')

    if (q) {
      query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,barcode.ilike.%${q}%`)
    }

    const { data, error } = await query.limit(40)
    if (error) throw error
    return jsonOk((data || []).map(mapProduct))
  } catch (error) {
    return handleApiError(error)
  }
}
