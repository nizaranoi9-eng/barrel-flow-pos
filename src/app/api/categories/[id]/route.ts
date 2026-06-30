import { ApiError, getContext, handleApiError, jsonMessage, jsonOk, mapCategory } from '@/app/api/_lib/supabase-data'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const taxRate = Number(body.taxRate || 0)

    if (!name) {
      throw new ApiError('Category name is required.', 400)
    }

    const { data: duplicate, error: duplicateError } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('name', name)
      .neq('id', id)
      .maybeSingle()

    if (duplicateError) throw duplicateError

    if (duplicate) {
      const { error: moveProductsError } = await supabase
        .from('products')
        .update({ category_id: duplicate.id })
        .eq('store_id', storeId)
        .eq('category_id', id)

      if (moveProductsError) throw moveProductsError

      const { data: updatedDuplicate, error: updateDuplicateError } = await supabase
        .from('categories')
        .update({ tax_rate: taxRate })
        .eq('id', duplicate.id)
        .eq('store_id', storeId)
        .select('*')
        .single()

      if (updateDuplicateError) throw updateDuplicateError

      const { error: deleteOldError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('store_id', storeId)

      if (deleteOldError) throw deleteOldError

      return jsonOk(mapCategory(updatedDuplicate))
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name, tax_rate: taxRate })
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
