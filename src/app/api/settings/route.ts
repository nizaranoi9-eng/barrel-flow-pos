import {
  fetchSettings,
  getContext,
  handleApiError,
  jsonOk,
  mapSettings,
} from '@/app/api/_lib/supabase-data'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    return jsonOk(await fetchSettings(supabase, storeId))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, storeId } = await getContext()
    const body = await request.json()
    const { data, error } = await supabase
      .from('store_settings')
      .update({
        default_tax_rate: body.defaultTaxRate,
        max_discount_percent: body.maxDiscountPercent,
        return_window_hours: body.returnWindowHours,
        low_stock_threshold: body.lowStockThreshold,
        receipt_header: body.receiptHeader || null,
        receipt_footer: body.receiptFooter || null,
        currency_symbol: body.currencySymbol || '$',
        accent_color: body.accentColor || '#D97706',
        enable_age_verification: body.enableAgeVerification ?? false,
        min_legal_age: body.minLegalAge ?? 21,
        require_dob_before_checkout: body.requireDobBeforeCheckout ?? false,
        card_theme_mode: body.cardThemeMode || 'system',
      })
      .eq('store_id', storeId)
      .select('*')
      .single()

    if (error) throw error
    return jsonOk(mapSettings(data))
  } catch (error) {
    return handleApiError(error)
  }
}

export const POST = PUT
