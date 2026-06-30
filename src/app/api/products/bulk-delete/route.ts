import { getContext, handleApiError, jsonOk } from '@/app/api/_lib/supabase-data'

export async function POST(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const productIds = body.productIds || body.ids || []

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return jsonOk({ deletedCount: 0 })
    }

    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('store_id', storeId)
      .in('id', productIds)

    if (error) throw error
    return jsonOk({ deletedCount: productIds.length })
  } catch (error) {
    return handleApiError(error)
  }
}
