import { fetchOrders, getContext, handleApiError, jsonOk } from '@/app/api/_lib/supabase-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || 8)
    const days = Number(searchParams.get('days') || 30)
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
    const { supabase, storeId } = await getContext()
    const orders = (await fetchOrders(supabase, storeId)).filter(
      (order: any) => order.status === 'completed' && new Date(order.createdAt).getTime() >= cutoff
    )
    const byProduct: Record<string, { productName: string; totalQuantity: number; totalRevenue: number }> = {}

    orders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        if (!byProduct[item.productId]) {
          byProduct[item.productId] = { productName: item.productName, totalQuantity: 0, totalRevenue: 0 }
        }
        byProduct[item.productId].totalQuantity += item.quantity
        byProduct[item.productId].totalRevenue += item.lineTotal
      })
    })

    return jsonOk(
      Object.entries(byProduct)
        .map(([productId, value]) => ({ productId, ...value }))
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, limit)
    )
  } catch (error) {
    return handleApiError(error)
  }
}
