import { ApiError, getContext, handleApiError, jsonOk, mapProduct } from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ barcode: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { barcode } = await params
    const { supabase, storeId } = await getContext()
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('store_id', storeId)
      .eq('barcode', decodeURIComponent(barcode))
      .eq('is_active', true)
      .maybeSingle()

    if (error) throw error
    if (!data) throw new ApiError('Product not found', 404)
    return jsonOk(mapProduct(data))
  } catch (error) {
    return handleApiError(error)
  }
}
