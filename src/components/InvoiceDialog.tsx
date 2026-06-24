'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, X, CheckCircle, Download } from 'lucide-react'
import { authFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import type { Store, Settings } from '@/lib/types'
import { generateReceiptPDF } from '@/lib/pdf-utils'

interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  taxRate: number
  lineTotal: number
}

interface Order {
  id: string
  invoiceNumber: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  discountType: string | null
  discountValue: number | null
  totalAmount: number
  paymentMethod: string
  customerEmail: string | null
  customerPhone: string | null
  createdAt: string | Date
  items: OrderItem[]
}

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  store: Store | null
  settings: Settings | null
  cashierName?: string
}

export function InvoiceDialog({
  open,
  onOpenChange,
  order,
  store,
  settings,
  cashierName = 'Staff',
}: InvoiceDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const currency = settings?.currencySymbol || '₹'

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) + ', ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=400,height=600')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${order?.invoiceNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              font-size: 12px;
              max-width: 320px;
              margin: 0 auto;
              padding: 15px;
              background: white;
              color: #111827;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 12px;
              margin-bottom: 12px;
            }
            .store-name {
              font-size: 20px;
              font-weight: bold;
              letter-spacing: 0.5px;
              color: #111827;
            }
            .store-details {
              font-size: 11px;
              color: #374151;
              margin-top: 4px;
            }
            .invoice-title {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              background: #f0f0f0;
              padding: 8px;
              margin: 12px 0;
              border-radius: 4px;
              color: #111827;
            }
            .meta {
              font-size: 11px;
              margin-bottom: 12px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
            }
            .meta-label { color: #6B7280; }
            .meta-value { font-weight: 500; color: #1F2937; }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            .items-table th {
              text-align: left;
              padding: 8px 4px;
              border-bottom: 1px solid #000;
              font-weight: 600;
              color: #111827;
            }
            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }
            .items-table td {
              padding: 6px 4px;
              border-bottom: 1px dashed #ddd;
              color: #1F2937;
            }
            .item-name { max-width: 140px; }
            .totals {
              margin-top: 12px;
              font-size: 11px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .grand-total {
              font-weight: bold;
              font-size: 14px;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .payment-badge {
              display: inline-block;
              background: #eff6ff;
              color: #3b82f6;
              padding: 4px 12px;
              border-radius: 4px;
              font-weight: 600;
              font-size: 11px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 12px;
              border-top: 2px dashed #000;
              font-size: 11px;
            }
            .footer-message {
              font-weight: 500;
              margin-bottom: 4px;
              color: #374151;
            }
            .footer-small {
              color: #6B7280;
              font-size: 10px;
            }
            .tax-summary {
              background: #f9f9f9;
              padding: 8px;
              margin-top: 10px;
              font-size: 10px;
              border-radius: 4px;
            }
            .tax-row {
              display: flex;
              justify-content: space-between;
            }
            @media print {
              body { padding: 0; max-width: 100%; }
              @page { margin: 5mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            setTimeout(() => { window.print(); }, 250);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadPDF = () => {
    if (!order) return
    const success = generateReceiptPDF(order, store, settings)
    if (success) {
      toast.success('Invoice downloaded')
    } else {
      toast.error('Failed to download invoice')
    }
  }

  if (!order || !store) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <CheckCircle className="w-5 h-5" />
            Sale Completed
          </DialogTitle>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Invoice Preview */}
        <div
          ref={printRef}
          className="bg-white text-gray-900 border border-gray-200 rounded-lg p-4 text-sm"
          style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}
        >
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            {settings?.receiptHeader && (
              <div className="text-sm font-medium mb-1 text-gray-800">{settings.receiptHeader}</div>
            )}
            <h2 className="text-xl font-bold tracking-wide text-gray-900">{store.name}</h2>
            {store.address && (
              <div className="text-sm text-gray-700 mt-1">{store.address}</div>
            )}
            {store.phone && (
              <div className="text-sm text-gray-700">Phone: {store.phone}</div>
            )}
          </div>

          {/* Invoice Title */}
          <div className="text-center bg-gray-100 py-2 rounded mb-3 text-gray-900 font-bold text-base">
            TAX INVOICE
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Invoice No:</span>
              <span className="font-medium text-gray-900">{order.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cashier:</span>
              <span className="font-medium text-gray-900">{cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className="font-medium text-gray-900 uppercase">{order.paymentMethod}</span>
            </div>
          </div>

          {/* Customer Details (if any) */}
          {(order.customerEmail || order.customerPhone) && (
            <div className="text-sm mb-3 p-2 bg-gray-50 rounded text-gray-800">
              <span className="text-gray-600">Customer: </span>
              {order.customerPhone && <span className="text-gray-900">{order.customerPhone}</span>}
              {order.customerPhone && order.customerEmail && <span className="text-gray-700"> | </span>}
              {order.customerEmail && <span className="text-gray-900">{order.customerEmail}</span>}
            </div>
          )}

          {/* Items Table */}
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-2 text-gray-900 font-bold">Item</th>
                <th className="text-center py-2 text-gray-900 font-bold w-12">Qty</th>
                <th className="text-right py-2 text-gray-900 font-bold w-16">Rate</th>
                <th className="text-right py-2 text-gray-900 font-bold w-16">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-b border-dashed border-gray-300">
                  <td className="py-2 text-gray-900">
                    <div className="font-medium text-gray-900">{item.productName}</div>
                    {item.taxRate > 0 && (
                      <div className="text-gray-600 text-xs">GST {item.taxRate}%</div>
                    )}
                  </td>
                  <td className="text-center py-2 text-gray-900">{item.quantity}</td>
                  <td className="text-right py-2 text-gray-900">{currency}{item.unitPrice.toFixed(2)}</td>
                  <td className="text-right py-2 font-medium text-gray-900">
                    {currency}{(item.unitPrice * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-gray-900">{currency}{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Tax (GST):</span>
              <span className="text-gray-900">{currency}{order.taxAmount.toFixed(2)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-primary font-medium">
                <span>Discount {order.discountType === 'percentage' ? `(${order.discountValue}%)` : ''}:</span>
                <span>-{currency}{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-gray-800 mt-2 text-gray-900">
              <span>TOTAL:</span>
              <span>{currency}{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Badge */}
          <div className="mt-3">
            <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded text-xs font-semibold uppercase">
              Paid via {order.paymentMethod}
            </span>
          </div>

          {/* Tax Summary */}
          <div className="mt-3 bg-gray-50 p-2 rounded text-sm">
            <div className="font-medium mb-1 text-gray-900">Tax Summary (GST)</div>
            {order.items.reduce((acc, item) => {
              const existing = acc.find(a => a.rate === item.taxRate)
              if (existing) {
                existing.amount += (item.unitPrice * item.quantity * item.taxRate) / 100
              } else if (item.taxRate > 0) {
                acc.push({ rate: item.taxRate, amount: (item.unitPrice * item.quantity * item.taxRate) / 100 })
              }
              return acc
            }, [] as { rate: number; amount: number }[]).map((tax, i) => (
              <div key={i} className="flex justify-between text-gray-700">
                <span>CGST+SGST @{tax.rate}%:</span>
                <span>{currency}{(tax.amount / 2).toFixed(2)} + {currency}{(tax.amount / 2).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t-2 border-dashed border-gray-400">
            <div className="font-medium text-gray-700">{settings?.receiptFooter || 'Thank you for shopping with us!'}</div>
            <div className="text-gray-600 text-xs mt-2">
              Terms: Goods once sold will not be taken back.<br/>
              This is a computer generated invoice.
            </div>
            <div className="text-gray-500 text-xs mt-2">
              Powered by RetailFlow POS
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
