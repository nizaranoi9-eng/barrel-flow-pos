import {
  ApiError,
  ensureDefaultCategories,
  getContext,
  handleApiError,
  jsonOk,
  mapCategory,
  uid,
} from '@/app/api/_lib/supabase-data'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    await ensureDefaultCategories(supabase, storeId)

    const { data, error } = await supabase
      .from('categories')
      .select('*, products(id)')
      .eq('store_id', storeId)
      .order('name')

    if (error) throw error
    return jsonOk((data || []).map((row: any) => mapCategory(row, row.products?.length || 0)))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const taxRate = Number(body.taxRate || 0)

    if (!name) {
      throw new ApiError('Category name is required.', 400)
    }

    const { data: existing, error: existingError } = await supabase
      .from('categories')
      .select('id')
      .eq('store_id', storeId)
      .eq('name', name)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing) {
      throw new ApiError(`Category "${name}" already exists.`, 409)
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: uid('cat'),
        store_id: storeId,
        name,
        tax_rate: taxRate,
      })
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapCategory(data))
  } catch (error) {
    return handleApiError(error)
  }
}
