import { fetchOrders, getContext, handleApiError, jsonOk } from '@/app/api/_lib/supabase-data'

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const orders = (await fetchOrders(supabase, storeId)).filter((order: any) => order.status === 'completed')
    const breakdown: Record<string, number> = { cash: 0, card: 0, upi: 0 }

    orders.forEach((order: any) => {
      const method = String(order.paymentMethod || 'cash').toLowerCase()
      breakdown[method] = (breakdown[method] || 0) + order.totalAmount
    })

    return jsonOk({
      cash: Math.round(breakdown.cash || 0),
      card: Math.round(breakdown.card || 0),
      upi: Math.round(breakdown.upi || 0),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
