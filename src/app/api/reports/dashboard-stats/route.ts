import { fetchOrders, fetchSettings, getContext, handleApiError, jsonOk, mapProduct } from '@/app/api/_lib/supabase-data'

function sameDate(value: string, date: string) {
  return value?.slice(0, 10) === date
}

export async function GET() {
  try {
    const { supabase, storeId } = await getContext()
    const [orders, settingsResult, productsResult] = await Promise.all([
      fetchOrders(supabase, storeId),
      fetchSettings(supabase, storeId),
      supabase.from('products').select('*, categories(*)').eq('store_id', storeId).eq('is_active', true),
    ])

    if (productsResult.error) throw productsResult.error
    const products = (productsResult.data || []).map(mapProduct)
    const settings = settingsResult
    const completedOrders = orders.filter((order: any) => order.status === 'completed')
    const today = new Date().toISOString().slice(0, 10)
    const todayOrders = completedOrders.filter((order: any) => sameDate(order.createdAt, today))
    const todaySales = todayOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
    const lowStock = products.filter((product: any) => product.stockQuantity <= settings.lowStockThreshold).length
    const customerKeys = new Set(
      completedOrders.map((order: any) => order.customerPhone || order.customerEmail).filter(Boolean)
    )
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
    const monthOrders = completedOrders.filter((order: any) => new Date(order.createdAt).getTime() >= thirtyDaysAgo)
    const totalSales = completedOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
    const totalCost = completedOrders.reduce(
      (sum: number, order: any) =>
        sum +
        order.items.reduce((itemSum: number, item: any) => {
          const product = products.find((candidate: any) => candidate.id === item.productId)
          return itemSum + (product?.costPrice || item.unitPrice * 0.6) * item.quantity
        }, 0),
      0
    )

    const revenueByDate = completedOrders.reduce((acc: Record<string, number>, order: any) => {
      const date = order.createdAt.slice(0, 10)
      acc[date] = (acc[date] || 0) + order.totalAmount
      return acc
    }, {})
    const bestDayEntry = Object.entries(revenueByDate).sort((a, b) => b[1] - a[1])[0]

    const inventoryValue = products.reduce(
      (sum: number, product: any) => sum + product.stockQuantity * (product.costPrice || product.sellingPrice * 0.6),
      0
    )

    return jsonOk({
      todaySales: Math.round(todaySales * 100) / 100,
      todayOrders: todayOrders.length,
      totalProducts: products.length,
      lowStockProducts: lowStock,
      totalCustomers: customerKeys.size,
      pendingSync: 0,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders: completedOrders.length,
      averageBasketValue:
        completedOrders.length > 0 ? Math.round((totalSales / completedOrders.length) * 100) / 100 : 0,
      lowStockSKUs: lowStock,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      todayRevenue: Math.round(todaySales * 100) / 100,
      todayTransactions: todayOrders.length,
      monthRevenue: Math.round(monthOrders.reduce((sum: number, order: any) => sum + order.totalAmount, 0) * 100) / 100,
      monthTransactions: monthOrders.length,
      profitMargin: totalSales > 0 ? Math.round(((totalSales - totalCost) / totalSales) * 1000) / 10 : 0,
      bestDay: bestDayEntry ? { date: bestDayEntry[0], revenue: Math.round(bestDayEntry[1] * 100) / 100 } : null,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
