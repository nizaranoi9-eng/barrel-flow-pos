import { fetchOrders, getContext, handleApiError, jsonOk } from '@/app/api/_lib/supabase-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = Number(searchParams.get('days') || 7)
    const { supabase, storeId } = await getContext()
    const orders = (await fetchOrders(supabase, storeId)).filter((order: any) => order.status === 'completed')
    const salesByDate: Record<string, { revenue: number; transactions: number; profit: number }> = {}

    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      salesByDate[date.toISOString().slice(0, 10)] = { revenue: 0, transactions: 0, profit: 0 }
    }

    orders.forEach((order: any) => {
      const date = order.createdAt.slice(0, 10)
      if (!salesByDate[date]) return
      salesByDate[date].revenue += order.totalAmount
      salesByDate[date].transactions += 1
      const itemCost = order.items.reduce(
        (sum: number, item: any) => sum + (item.product?.costPrice || item.unitPrice * 0.6) * item.quantity,
        0
      )
      salesByDate[date].profit += order.subtotal - itemCost
    })

    return jsonOk(
      Object.entries(salesByDate).map(([date, value]) => ({
        date,
        revenue: Math.round(value.revenue),
        transactions: value.transactions,
        profit: Math.round(value.profit),
      }))
    )
  } catch (error) {
    return handleApiError(error)
  }
}
