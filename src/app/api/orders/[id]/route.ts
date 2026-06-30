import { ApiError, getContext, handleApiError, jsonOk, mapOrder } from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('orders')
      .select('*, app_users(name,email), order_items(*, products(*, categories(*))), payments(*)')
      .eq('id', id)
      .eq('store_id', storeId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new ApiError('Order not found', 404)
    return jsonOk(mapOrder(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', id)
      .eq('store_id', storeId)
      .select('*, app_users(name,email), order_items(*, products(*, categories(*))), payments(*)')
      .single()

    if (error) throw error
    return jsonOk(mapOrder(data))
  } catch (error) {
    return handleApiError(error)
  }
}
