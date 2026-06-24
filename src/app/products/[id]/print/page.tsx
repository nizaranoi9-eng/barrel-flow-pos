'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import { initMockFetch } from '@/lib/mock-fetch'
import { authFetch } from '@/lib/api-client'
import { Loader2, Printer, X, Tag, Barcode, Shield } from 'lucide-react'

interface PageProps {
  params: any
}

export default function ProductPrintPage({ params }: PageProps) {
  const [id, setId] = useState<string | null>(null)
  const [product, setProduct] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)

  // 1. Safely resolve route param id (compatible with React 19 / Next.js 16)
  useEffect(() => {
    if (params) {
      Promise.resolve(params).then((resolvedParams: any) => {
        if (resolvedParams?.id) {
          setId(resolvedParams.id)
        }
      }).catch(() => {
        const match = window.location.pathname.match(/\/products\/([^\/]+)\/print/)
        if (match) setId(match[1])
      })
    } else {
      const match = window.location.pathname.match(/\/products\/([^\/]+)\/print/)
      if (match) setId(match[1])
    }
  }, [params])

  // 2. Initialize mock fetch and load product details
  useEffect(() => {
    initMockFetch()
    if (id) {
      loadProduct(id)
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
        console.error('Failed to load store details for print:', error)
      }
    }
    fetchBranding()
  }, [])

  const loadProduct = async (prodId: string) => {
    setIsLoading(true)
    try {
      const response = await authFetch(`/api/products/${prodId}`)
      const data = await response.json()
      if (data.success) {
        setProduct(data.data)
      }
    } catch (error) {
      console.error('Failed to load product for printing:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 3. Auto-trigger print when loaded
  useEffect(() => {
    if (product) {
      const timer = setTimeout(() => {
        window.print()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [product])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center text-slate-100 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm font-semibold">Generating Product Spec Sheet...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#090D1A] flex flex-col items-center justify-center text-slate-100 font-sans p-6">
        <div className="bg-[#151C2C] border border-slate-800 rounded-3xl p-8 max-w-sm text-center space-y-4">
          <Tag className="w-12 h-12 text-slate-650 mx-auto" />
          <h2 className="text-lg font-bold text-white">Product Not Found</h2>
          <p className="text-slate-400 text-xs leading-normal">
            We couldn't retrieve the specified product. It's possible the product ID is invalid or sync is pending.
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
      {/* Controls Area (Hidden on Print) */}
      <div className="no-print w-full max-w-[420px] flex items-center justify-between gap-4 mb-6 bg-[#151C2C] border border-slate-800 p-3 rounded-2xl">
        <span className="text-xs font-bold text-slate-300">Product Label & Specs</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-600 text-black p-2 rounded-full border-none cursor-pointer flex items-center justify-center"
            title="Print Page"
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

      {/* Printable Sheet */}
      <div 
        id="printable-label"
        className="w-full max-w-[420px] bg-white text-black p-6 rounded-2xl shadow-xl font-mono text-xs border border-slate-200"
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
            #printable-label {
              box-shadow: none !important;
              border: none !important;
              max-width: 100% !important;
              width: 100mm !important;
              padding: 5px !important;
              margin: 0 !important;
            }
            @page {
              margin: 0;
            }
          }
        `}</style>

        {/* Brand Header */}
        <div className="text-center pb-2 border-b-2 border-solid border-black mb-4">
          <h2 className="text-sm font-extrabold tracking-wide" style={{ margin: 0 }}>{(store?.name || 'BARRELFLOW').toUpperCase()}</h2>
          <p className="text-[9px] text-slate-600">Product Specification & Barcode Sheet</p>
        </div>

        {/* Product specs */}
        <div className="space-y-2 mb-4 text-[10px] text-slate-900 leading-normal">
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
            <span className="font-bold">Product Name:</span>
            <span className="font-medium text-right max-w-[200px] truncate">{product.name}</span>
          </div>
          {product.brand && (
            <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="font-bold">Brand:</span>
              <span className="font-medium">{product.brand}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
            <span className="font-bold">SKU:</span>
            <span className="font-medium">{product.sku || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
            <span className="font-bold">Barcode:</span>
            <span className="font-medium">{product.barcode || 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
            <span className="font-bold">Base Unit / Packaging:</span>
            <span className="font-medium">{product.packageType || 'Bottle'} ({product.packageSize || 1}{product.measurementUnit || 'ml'})</span>
          </div>
          {product.abv && (
            <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="font-bold">Alcohol By Volume (ABV):</span>
              <span className="font-medium">{product.abv}%</span>
            </div>
          )}
          <div className="flex justify-between border-b border-solid border-black pt-1 pb-1">
            <span className="font-bold text-sm">Selling Price:</span>
            <span className="font-extrabold text-sm">{currency}{(product.sellingPrice || 0).toFixed(2)}</span>
          </div>
          {product.mrp && (
            <div className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="font-bold">Maximum Retail Price (MRP):</span>
              <span className="font-medium">{currency}{(product.mrp).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Printable Barcode Label Design Box */}
        <div className="border-2 border-solid border-black p-4 text-center rounded-xl bg-gray-50 flex flex-col items-center justify-center space-y-2 mt-4">
          <p className="text-[10px] font-bold tracking-wider">{product.name.toUpperCase()}</p>
          <div className="flex items-center gap-1.5 justify-center py-2 px-6 border border-solid border-gray-300 bg-white rounded">
            <Barcode className="w-12 h-8 text-black opacity-80" />
            <div className="flex flex-col text-left font-mono">
              <span className="text-[14px] font-extrabold">{currency}{(product.sellingPrice || 0).toFixed(0)}</span>
              <span className="text-[8px] text-slate-500">CODE: {product.barcode || 'N/A'}</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 font-mono tracking-widest">{product.barcode || 'NO BARCODE ASSIGNED'}</p>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 pt-3 border-t border-solid border-black">
          <p className="text-[8px] text-slate-500 leading-normal font-sans">
            Store Product Tag • RetailFlow POS Compliance<br/>
            Verify barcode aligns correctly on scanner hardware.
          </p>
        </div>
      </div>
    </div>
  )
}
