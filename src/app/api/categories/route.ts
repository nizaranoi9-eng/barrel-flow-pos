import {
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
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: uid('cat'),
        store_id: storeId,
        name: body.name,
        tax_rate: Number(body.taxRate || 0),
      })
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapCategory(data))
  } catch (error) {
    return handleApiError(error)
  }
}
