'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { initMockFetch } from '@/lib/mock-fetch'
import { authFetch } from '@/lib/api-client'
import { Loader2, Printer, X } from 'lucide-react'

interface PageProps {
  params: any
}

export default function ReceiptPage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null)
  const [order, setOrder] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)

  // 1. Safely resolve the route param id (compatible with React 19 / Next.js 16)
  useEffect(() => {
    if (params) {
      Promise.resolve(params).then((resolvedParams: any) => {
        if (resolvedParams?.id) {
          setId(resolvedParams.id)
        }
      }).catch(() => {
        // Fallback: Parse from pathname if params promise resolution fails
        const match = window.location.pathname.match(/\/orders\/([^\/]+)\/receipt/)
        if (match) setId(match[1])
      })
    } else {
      const match = window.location.pathname.match(/\/orders\/([^\/]+)\/receipt/)
      if (match) setId(match[1])
    }
  }, [params])

  // 2. Initialize mock fetch, fetch the order and branding
  useEffect(() => {
    initMockFetch()
    if (id) {
      loadOrder(id)
    }
  }, [id])

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const storeRes = await authFetch('/api/store')
        const storeJson = await storeRes.json()
        if (storeJson.success) setStore(storeJson.data)
        
        const settingsRes = await authFetch('/api/settings')
        const settingsJson = await settingsRes.json()
        if (settingsJson.success) setSettings(settingsJson.data)
      } catch (error) {
        console.error('Failed to load store details for receipt:', error)
      }
    }
    fetchBranding()
  }, [])

  const loadOrder = async (orderId: string) => {
    setIsLoading(true)
    try {
      const response = await authFetch(`/api/orders/${orderId}`)
      const data = await response.json()
      if (data.success) {
        setOrder(data.data)
      }
    } catch (error) {
      console.error('Failed to load order for receipt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Auto-trigger print when order is loaded
  useEffect(() => {
    if (order) {
      const timer = setTimeout(() => {
        window.print()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [order])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center text-slate-100 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm font-semibold">Generating Receipt Preview...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center text-slate-100 font-sans p-6">
        <div className="bg-[#151C2C] border border-slate-800 rounded-3xl p-8 max-w-sm text-center space-y-4">
          <h2 className="text-lg font-bold text-white">Receipt Not Found</h2>
          <p className="text-slate-400 text-xs leading-normal">
            We couldn't retrieve the transaction details. It's possible the order ID is invalid or sync is pending.
          </p>
          <button 
            onClick={() => window.close()} 
            className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-5 py-2.5 rounded-full border-none cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    )
  }

  const currency = settings?.currencySymbol || '₹'

  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-100 font-sans p-6 flex flex-col items-center justify-start overflow-y-auto">
      {/* Print Controls (Hidden during print) */}
      <div className="no-print w-full max-w-[340px] flex items-center justify-between gap-4 mb-6 bg-[#151C2C] border border-slate-800 p-3 rounded-2xl">
        <span className="text-xs font-bold text-slate-350">Invoice Preview</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-full border-none cursor-pointer flex items-center justify-center"
            title="Print Receipt"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.close()}
            className="bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white p-2 rounded-full border border-slate-800 cursor-pointer flex items-center justify-center"
            title="Close Window"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Styled Printable Receipt Area */}
      <div 
        id="printable-receipt" 
        className="w-full max-w-[340px] bg-white text-black p-6 rounded-2xl shadow-xl font-mono text-xs border border-slate-200"
      >
        <style>{`
          @media print {
            body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            #printable-receipt {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              width: 76mm !important;
              padding: 5px !important;
              margin: 0 !important;
            }
            @page {
              margin: 0;
            }
          }
        `}</style>

        {/* Store Info */}
        <div className="text-center space-y-0.5">
          {store?.logoUrl && (
            <div className="flex justify-center mb-2 no-print">
              <img src={store.logoUrl} alt="Store Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
          )}
          <h3 className="text-sm font-extrabold tracking-wide" style={{ margin: 0 }}>{(store?.name || 'BARRELFLOW').toUpperCase()}</h3>
          <p className="text-[10px] text-slate-700">{settings?.receiptHeader || 'Premium Wines & Fine Spirits Boutique'}</p>
          <p className="text-[9px] text-slate-600">{store?.address || 'Louisville Whiskey Row, KY'}</p>
          <p className="text-[9px] text-slate-600">Phone: {store?.phone || '+1 (555) 728-1928'}</p>
        </div>

        <div className="border-b border-dashed border-black my-3"></div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 gap-y-1 text-[10px] text-slate-800">
          <div>Invoice: {order.invoiceNumber}</div>
          <div className="text-right">Date: {new Date(order.createdAt).toLocaleDateString()}</div>
          <div>Payment: <span className="uppercase font-bold">{order.paymentMethod}</span></div>
          <div className="text-right">Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <div className="border-b border-dashed border-black my-3"></div>

        {/* Customer Info */}
        {(order.customerPhone || order.customerEmail) && (
          <>
            <div className="text-[9px] text-slate-700 space-y-0.5" style={{ padding: '2px 0' }}>
              <div className="font-bold text-black">Customer Details:</div>
              {order.customerPhone && <div>Phone: {order.customerPhone}</div>}
              {order.customerEmail && <div>Email: {order.customerEmail}</div>}
            </div>
            <div className="border-b border-dashed border-black my-3"></div>
          </>
        )}

        {/* Items Table Headers */}
        <div className="font-bold grid grid-cols-12 gap-1 text-[10px] pb-1 text-slate-900">
          <div className="col-span-6">Item Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-4 text-right">Total</div>
        </div>

        {/* Items Rows */}
        <div className="space-y-2 text-[10px] leading-relaxed text-slate-900">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="grid grid-cols-12 gap-1 items-start">
              <div className="col-span-6">
                <div className="font-bold">{item.productName}</div>
                <div className="text-[8px] text-slate-600">{currency}{item.unitPrice.toFixed(2)}</div>
              </div>
              <div className="col-span-2 text-center">x{item.quantity}</div>
              <div className="col-span-4 text-right font-bold">{currency}{item.lineTotal.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-black my-3"></div>

        {/* Totals Breakdown */}
        <div className="space-y-1.5 text-[10px] text-slate-900">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currency}{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>VAT / Tax amount</span>
            <span>{currency}{order.taxAmount.toFixed(2)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between font-bold">
              <span>Discount</span>
              <span>-{currency}{order.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-b border-dashed border-black my-1"></div>
          <div className="flex justify-between font-bold text-xs pt-1 text-black">
            <span>Total Amount</span>
            <span>{currency}{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-black my-3"></div>

        {/* Health Warning & Footer */}
        <div className="text-center space-y-1 text-[8px] text-slate-800 leading-normal">
          <p className="font-bold italic">{settings?.receiptFooter || 'Statutory Warning: Alcohol is injurious to health. Please drink responsibly. Don\'t drink and drive.'}</p>
          <p className="font-bold text-black uppercase tracking-wide">Thank you for your purchase!</p>
        </div>
      </div>
    </div>
  )
}
