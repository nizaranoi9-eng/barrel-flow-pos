'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { authFetch, getAuthHeader } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InvoiceDialog } from '@/components/InvoiceDialog'
import { generateReceiptPDF } from '@/lib/pdf-utils'
import { 
  Receipt, 
  Search, 
  Eye, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Filter,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Trash2,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

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
  status: string
  createdAt: string
  items: OrderItem[]
  cashier?: {
    id: string
    name: string
  }
}

export function TransactionsView() {
  const [transactions, setTransactions] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [earliestDate, setEarliestDate] = useState<Date | null>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Invoice dialog state
  const [showInvoice, setShowInvoice] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  
  // OTP Dialog state
  const [showOtpDialog, setShowOtpDialog] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpCountdown, setOtpCountdown] = useState(60)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState('')

  const { user, store, settings } = useAuthStore()
  const currency = settings?.currencySymbol || '₹'
  
  // Countdown timer
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  // Load transactions
  const loadInitialTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await authFetch('/api/orders')
      const data = await response.json()

      if (data.success) {
        setTransactions(data.data)
        if (data.data.length > 0) {
          const dates = data.data.map((t: Order) => new Date(t.createdAt))
          const earliest = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
          setEarliestDate(earliest)
          setFromDate(format(earliest, 'yyyy-MM-dd'))
        }
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (paymentFilter !== 'all') params.append('payment', paymentFilter)
      if (fromDate) params.append('from', fromDate)
      if (toDate) params.append('to', toDate)

      const response = await authFetch(`/api/orders?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.data)
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
      toast.error('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, paymentFilter, fromDate, toDate])

  useEffect(() => {
    loadInitialTransactions()
  }, [loadInitialTransactions])

  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    loadTransactions()
  }, [loadTransactions])

  const handleViewInvoice = async (orderId: string) => {
    setIsLoadingOrder(true)
    try {
      const response = await authFetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedOrder(data.data)
        setShowInvoice(true)
      } else {
        toast.error('Failed to load invoice')
      }
    } catch (error) {
      console.error('Failed to load order:', error)
      toast.error('Failed to load invoice')
    } finally {
      setIsLoadingOrder(false)
    }
  }

  const handleDownloadInvoice = (orderId: string, invoiceNumber: string) => {
    const order = transactions.find(t => t.id === orderId)
    if (!order) {
      toast.error('Transaction details not found')
      return
    }
    const success = generateReceiptPDF(order, store, settings)
    if (success) {
      toast.success('Invoice downloaded')
    } else {
      toast.error('Failed to download invoice')
    }
  }

  // Delete handlers with OTP flow
  const handleDeleteClick = async (order: Order) => {
    setOrderToDelete(order)
    setOtpCode('')
    setOtpError('')
    setIsSendingOtp(true)
    
    try {
      const response = await authFetch('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify({ orderId: order.id }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setShowOtpDialog(true)
        setOtpCountdown(60)
        
        // Start countdown
        countdownRef.current = setInterval(() => {
          setOtpCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        // Show OTP in development
        if (data.otp) {
          toast.info(`OTP: ${data.otp} (dev mode)`)
        } else {
          toast.success('OTP sent to your email')
        }
      } else {
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      toast.error('Failed to send OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!orderToDelete || !otpCode) return
    
    setIsVerifyingOtp(true)
    setOtpError('')
    
    try {
      const response = await authFetch('/api/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ orderId: orderToDelete.id, otp: otpCode }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // OTP verified, now delete the order
        const deleteResponse = await authFetch(`/api/orders/${orderToDelete.id}`, {
          method: 'DELETE',
        })
        
        const deleteData = await deleteResponse.json()
        
        if (deleteData.success) {
          setTransactions(prev => prev.filter(t => t.id !== orderToDelete.id))
          toast.success('Transaction deleted successfully')
          setShowOtpDialog(false)
          setOrderToDelete(null)
          if (countdownRef.current) clearInterval(countdownRef.current)
        } else {
          toast.error(deleteData.error || 'Failed to delete transaction')
        }
      } else {
        setOtpError(data.error || 'Invalid OTP')
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      setOtpError('Failed to verify OTP')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (!orderToDelete) return
    
    setIsSendingOtp(true)
    setOtpCode('')
    setOtpError('')
    
    try {
      const response = await authFetch('/api/otp/send', {
        method: 'POST',
        body: JSON.stringify({ orderId: orderToDelete.id }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setOtpCountdown(60)
        
        // Restart countdown
        if (countdownRef.current) clearInterval(countdownRef.current)
        countdownRef.current = setInterval(() => {
          setOtpCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        
        if (data.otp) {
          toast.info(`OTP: ${data.otp} (dev mode)`)
        } else {
          toast.success('OTP resent')
        }
      } else {
        toast.error(data.error || 'Failed to resend OTP')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast.error('Failed to resend OTP')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setPaymentFilter('all')
    if (earliestDate) {
      setFromDate(format(earliestDate, 'yyyy-MM-dd'))
    }
    setToDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const hasActiveFilters = searchQuery || paymentFilter !== 'all'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'dd MMM yyyy, hh:mm a')
  }

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />
      case 'card':
        return <CreditCard className="w-4 h-4" />
      case 'upi':
        return <Smartphone className="w-4 h-4" />
      default:
        return <CreditCard className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-primary">Completed</Badge>
      case 'refunded':
        return <Badge variant="destructive">Refunded</Badge>
      case 'pending_sync':
        return <Badge variant="secondary" className="bg-orange-500 text-white">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const totals = transactions.reduce(
    (acc, t) => ({
      subtotal: acc.subtotal + t.subtotal,
      tax: acc.tax + t.taxAmount,
      total: acc.total + t.totalAmount,
      count: acc.count + 1,
    }),
    { subtotal: 0, tax: 0, total: 0, count: 0 }
  )

  const isDarkBg = settings?.cardThemeMode === 'dark'
  const cardClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
  const inputClass = isDarkBg ? 'bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500' : 'bg-white border-slate-200 text-slate-900'
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-muted-foreground'
  const tableHeaderCellClass = isDarkBg ? 'text-slate-400 border-slate-800' : ''
  const tableRowClass = isDarkBg ? 'border-slate-800 hover:bg-slate-800/20' : ''
  const cellTextClass = isDarkBg ? 'text-slate-200' : ''
  const cellTextMutedClass = isDarkBg ? 'text-slate-400' : 'text-muted-foreground'

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Transaction History
          </h2>
          <p className={`${textMutedClass} text-sm mt-1`}>
            View and manage all completed transactions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`${showFilters ? 'bg-muted' : ''} ${isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-300 hover:text-white' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
          <Button 
            onClick={() => setShowExportDialog(true)}
            className={isDarkBg ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold" : ""}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className={cardClass}>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMutedClass}`} />
                  <Input
                    placeholder="Invoice # or customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className={isDarkBg ? 'bg-[#0B0F19] border-slate-800 text-white' : ''}>
                    <SelectValue placeholder="All methods" />
                  </SelectTrigger>
                  <SelectContent className={isDarkBg ? 'bg-[#151C2C] border-slate-800 text-white' : ''}>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <Card className={cardClass}>
          <CardContent className="p-4">
            <p className={`text-sm ${textMutedClass}`}>Transactions</p>
            <p className="text-2xl font-bold">{totals.count}</p>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <p className={`text-sm ${textMutedClass}`}>Total Sales</p>
            <p className="text-2xl font-bold text-primary">{currency}{totals.total.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <p className={`text-sm ${textMutedClass}`}>Total Tax</p>
            <p className="text-2xl font-bold">{currency}{totals.tax.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <p className={`text-sm ${textMutedClass}`}>Avg. Order</p>
            <p className="text-2xl font-bold">{currency}{totals.count > 0 ? (totals.total / totals.count).toFixed(2) : '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table with horizontal scroll */}
      <Card className={`flex-1 ${cardClass}`}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 ${textMutedClass}`}>
              <Receipt className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No transactions found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader className={isDarkBg ? 'border-slate-800' : ''}>
                  <TableRow className={isDarkBg ? 'border-slate-800 hover:bg-slate-800/30' : ''}>
                    <TableHead className={`w-[140px] ${tableHeaderCellClass}`}>Invoice #</TableHead>
                    <TableHead className={`w-[180px] ${tableHeaderCellClass}`}>Date & Time</TableHead>
                    <TableHead className={`w-[150px] ${tableHeaderCellClass}`}>Customer</TableHead>
                    <TableHead className={`w-[120px] ${tableHeaderCellClass}`}>Cashier</TableHead>
                    <TableHead className={`w-[100px] ${tableHeaderCellClass}`}>Payment</TableHead>
                    <TableHead className={`w-[80px] text-center ${tableHeaderCellClass}`}>Items</TableHead>
                    <TableHead className={`w-[100px] text-right ${tableHeaderCellClass}`}>Subtotal</TableHead>
                    <TableHead className={`w-[80px] text-right ${tableHeaderCellClass}`}>Tax</TableHead>
                    <TableHead className={`w-[100px] text-right ${tableHeaderCellClass}`}>Total</TableHead>
                    <TableHead className={tableHeaderCellClass}>Status</TableHead>
                    <TableHead className={`w-[140px] sticky right-0 border-l ${isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-400' : 'bg-background border-slate-200 text-muted-foreground'}`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id} className={tableRowClass}>
                      <TableCell className={`font-medium ${cellTextClass}`}>{transaction.invoiceNumber}</TableCell>
                      <TableCell className={`text-sm ${cellTextClass}`}>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell className={cellTextClass}>
                        {transaction.customerPhone || transaction.customerEmail || (
                          <span className={textMutedClass}>-</span>
                        )}
                      </TableCell>
                      <TableCell className={cellTextClass}>{transaction.cashier?.name || '-'}</TableCell>
                      <TableCell className={cellTextClass}>
                        <div className="flex items-center gap-1 capitalize">
                          {getPaymentIcon(transaction.paymentMethod)}
                          {transaction.paymentMethod}
                        </div>
                      </TableCell>
                      <TableCell className={`text-center ${cellTextClass}`}>{transaction.items?.length || 0}</TableCell>
                      <TableCell className={`text-right ${cellTextClass}`}>{currency}{transaction.subtotal.toFixed(2)}</TableCell>
                      <TableCell className={`text-right ${cellTextClass}`}>{currency}{transaction.taxAmount.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-bold ${cellTextClass}`}>{currency}{transaction.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell className={`sticky right-0 border-l ${isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-200' : 'bg-background border-slate-200 text-slate-900'}`}>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(transaction.id)}
                            title="View Invoice"
                            disabled={isLoadingOrder}
                            className="h-8 w-8 text-slate-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadInvoice(transaction.id, transaction.invoiceNumber)}
                            title="Download PDF"
                            className="h-8 w-8 text-slate-400 hover:text-white"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(transaction)}
                            title="Delete Transaction"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={showInvoice}
        onOpenChange={setShowInvoice}
        order={selectedOrder}
        store={store}
        settings={settings}
        cashierName={selectedOrder?.cashier?.name || user?.name}
      />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />

      {/* OTP Dialog for Delete Confirmation */}
      <Dialog open={showOtpDialog} onOpenChange={(open) => {
        if (!open && countdownRef.current) {
          clearInterval(countdownRef.current)
        }
        setShowOtpDialog(open)
      }}>
        <DialogContent className={isDarkBg ? "bg-[#151C2C] border-slate-800 text-white" : "sm:max-w-md"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Confirm Delete Transaction
            </DialogTitle>
            <DialogDescription className={textMutedClass}>
              Enter the OTP sent to your email to delete transaction <strong>{orderToDelete?.invoiceNumber}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* OTP Input */}
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">One-Time Password</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`text-center text-2xl tracking-widest h-14 ${isDarkBg ? 'bg-[#0B0F19] border-slate-800 text-white' : ''}`}
                maxLength={6}
                disabled={isVerifyingOtp}
                aria-describedby="otp-timer"
              />
            </div>
            
            {/* Timer */}
            <div id="otp-timer" className="flex items-center justify-between text-sm">
              <span className={otpCountdown > 0 ? textMutedClass : 'text-destructive'}>
                {otpCountdown > 0 ? `Expires in ${otpCountdown}s` : 'OTP expired'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                disabled={otpCountdown > 0 || isSendingOtp}
                className="text-primary"
              >
                {isSendingOtp ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Resend OTP
              </Button>
            </div>
            
            {/* Error Message */}
            {otpError && (
              <p className="text-sm text-destructive" role="alert">
                {otpError}
              </p>
            )}
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (countdownRef.current) clearInterval(countdownRef.current)
                setShowOtpDialog(false)
              }}
              disabled={isVerifyingOtp}
              className={isDarkBg ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : ""}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={otpCode.length !== 6 || isVerifyingOtp || otpCountdown === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Transaction
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Export Dialog Component
function ExportDialog({ 
  open, 
  onOpenChange, 
  fromDate, 
  toDate, 
  onFromDateChange, 
  onToDateChange 
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromDate: string
  toDate: string
  onFromDateChange: (date: string) => void
  onToDateChange: (date: string) => void
}) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [isExporting, setIsExporting] = useState(false)
  const { settings } = useAuthStore()
  const isDarkBg = settings?.cardThemeMode === 'dark'
  const inputClass = isDarkBg ? 'bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500 cursor-pointer' : 'cursor-pointer'
  const selectTriggerClass = isDarkBg ? 'bg-[#0B0F19] border-slate-800 text-white' : ''
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-muted-foreground'

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      toast.error('Please select date range')
      return
    }

    if (new Date(fromDate) > new Date(toDate)) {
      toast.error('From date cannot be after To date')
      return
    }

    setIsExporting(true)
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm')
      const filename = exportFormat === 'csv'
        ? `transactions-${timestamp}.csv`
        : `transactions-${timestamp}.pdf`
      
      const url = `/api/orders/export?from=${fromDate}&to=${toDate}&format=${exportFormat}`
      
      // Fetch the file using the authenticated fetch wrapper
      const response = await authFetch(url, {
        method: 'GET',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(errorData.error || 'Export failed')
      }

      // Get the blob
      const blob = await response.blob()
      
      // Verify blob has content
      if (!blob || blob.size === 0) {
        throw new Error('Empty file received from server')
      }

      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Create a hidden anchor element
      const downloadLink = document.createElement('a')
      downloadLink.style.display = 'none'
      downloadLink.href = blobUrl
      downloadLink.download = filename
      
      // Append to body
      document.body.appendChild(downloadLink)
      
      // Trigger click
      downloadLink.click()
      
      // Cleanup after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl)
        document.body.removeChild(downloadLink)
      }, 200)

      toast.success(`Exported successfully as ${exportFormat.toUpperCase()}`)
      onOpenChange(false)
    } catch (error) {
      console.error('Export error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to export transactions')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isDarkBg ? "bg-[#151C2C] border-slate-800 text-white" : "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
          <DialogDescription className={textMutedClass}>
            Export transaction history for the selected date range
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'pdf')}>
              <SelectTrigger className={selectTriggerClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={isDarkBg ? 'bg-[#151C2C] border-slate-800 text-white' : ''}>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                    CSV (.csv)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-destructive" />
                    PDF Document
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isDarkBg ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : ""}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className={isDarkBg ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold border-none" : ""}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
