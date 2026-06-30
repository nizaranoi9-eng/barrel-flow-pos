import { getContext, handleApiError, jsonOk } from '@/app/api/_lib/supabase-data'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error
    return jsonOk(
      (data || []).map((row: any) => ({
        id: row.id,
        productId: row.product_id,
        oldQuantity: row.old_quantity,
        newQuantity: row.new_quantity,
        quantityDelta: row.quantity_delta,
        reason: row.reason,
        orderId: row.order_id,
        createdBy: row.created_by,
        createdAt: row.created_at,
      }))
    )
  } catch (error) {
    return handleApiError(error)
  }
}
