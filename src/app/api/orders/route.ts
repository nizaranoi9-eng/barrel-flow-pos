import {
  fetchOrders,
  getContext,
  handleApiError,
  jsonOk,
  mapOrder,
  uid,
} from '@/app/api/_lib/supabase-data'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
    const { supabase, storeId } = await getContext()
    return jsonOk(await fetchOrders(supabase, storeId, limit))
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, storeId, userId } = await getContext()
    const body = await request.json()
    const orderId = uid('ord')
    const now = new Date().toISOString()

    const { count } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId)

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1001).padStart(4, '0')}`
    const items = body.items || []

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      store_id: storeId,
      cashier_id: userId,
      invoice_number: invoiceNumber,
      subtotal: Number(body.subtotal || 0),
      tax_amount: Number(body.taxAmount || 0),
      discount_amount: Number(body.discountAmount || 0),
      discount_type: body.discountType || null,
      discount_value: body.discountValue || 0,
      total_amount: Number(body.totalAmount || 0),
      payment_method: body.paymentMethod || 'cash',
      status: 'completed',
      customer_email: body.customerEmail || null,
      customer_phone: body.customerPhone || null,
      notes: body.notes || null,
      created_at: now,
      synced_at: now,
    })
    if (orderError) throw orderError

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map((item: any) => ({
        id: uid('item'),
        order_id: orderId,
        store_id: storeId,
        product_id: item.productId,
        product_name: item.productName,
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unitPrice || 0),
        tax_rate: Number(item.taxRate || 0),
        line_total: Number(item.lineTotal ?? Number(item.unitPrice || 0) * Number(item.quantity || 1)),
      }))
    )
    if (itemsError) throw itemsError

    const { error: paymentError } = await supabase.from('payments').insert({
      id: uid('pay'),
      order_id: orderId,
      store_id: storeId,
      payment_method: body.paymentMethod || 'cash',
      amount: Number(body.totalAmount || 0),
      created_at: now,
    })
    if (paymentError) throw paymentError

    for (const item of items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.productId)
        .eq('store_id', storeId)
        .single()
      if (productError) throw productError

      const oldQuantity = Number(product.stock_quantity || 0)
      const newQuantity = Math.max(0, oldQuantity - Number(item.quantity || 1))
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity, stock_packages: newQuantity })
        .eq('id', item.productId)
        .eq('store_id', storeId)
      if (stockError) throw stockError

      const { error: movementError } = await supabase.from('inventory_movements').insert({
        id: uid('mov'),
        store_id: storeId,
        product_id: item.productId,
        old_quantity: oldQuantity,
        new_quantity: newQuantity,
        quantity_delta: newQuantity - oldQuantity,
        reason: 'Sale',
        order_id: orderId,
        created_by: userId,
      })
      if (movementError) throw movementError
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*, app_users(name,email), order_items(*, products(*, categories(*))), payments(*)')
      .eq('id', orderId)
      .eq('store_id', storeId)
      .single()
    if (error) throw error

    return jsonOk(mapOrder(data))
  } catch (error) {
    return handleApiError(error)
  }
}
