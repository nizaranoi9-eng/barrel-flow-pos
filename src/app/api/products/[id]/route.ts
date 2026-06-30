import {
  ApiError,
  getContext,
  handleApiError,
  jsonMessage,
  jsonOk,
  mapProduct,
  productPayload,
} from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('id', id)
      .eq('store_id', storeId)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new ApiError('Product not found', 404)
    return jsonOk(mapProduct(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('products')
      .update(productPayload(body, storeId, id))
      .eq('id', id)
      .eq('store_id', storeId)
      .select('*, categories(*)')
      .single()

    if (error) throw error
    return jsonOk(mapProduct(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('store_id', storeId)

    if (error) throw error
    return jsonMessage('Product deleted')
  } catch (error) {
    return handleApiError(error)
  }
}
