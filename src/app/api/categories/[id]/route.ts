import { getContext, handleApiError, jsonMessage, jsonOk, mapCategory } from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('categories')
      .update({ name: body.name, tax_rate: Number(body.taxRate || 0) })
      .eq('id', id)
      .eq('store_id', storeId)
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapCategory(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    await supabase.from('products').update({ category_id: null }).eq('store_id', storeId).eq('category_id', id)
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('store_id', storeId)
    if (error) throw error
    return jsonMessage('Category deleted')
  } catch (error) {
    return handleApiError(error)
  }
}
