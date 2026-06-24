'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingBag, 
  CreditCard,
  Package,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

interface DailySales {
  date: string
  revenue: number
  transactions: number
  profit: number
}

interface TopProduct {
  productId: string
  productName: string
  totalQuantity: number
  totalRevenue: number
}

interface PaymentBreakdown {
  cash: number
  card: number
  upi: number
}

interface DashboardStats {
  todayRevenue: number
  todayTransactions: number
  monthRevenue: number
  monthTransactions: number
  profitMargin: number
  bestDay: { date: string; revenue: number } | null
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b']

export function ReportsView() {
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [dailySales, setDailySales] = useState<DailySales[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({ cash: 0, card: 0, upi: 0 })
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)

  const { user, settings } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const currency = settings?.currencySymbol || '₹'

  useEffect(() => {
    if (isAdmin) {
      loadReportData()
    }
  }, [dateRange, isAdmin])

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      
      const [salesRes, productsRes, paymentsRes, statsRes] = await Promise.all([
        authFetch(`/api/reports/daily-sales?days=${days}`),
        authFetch(`/api/reports/top-products?days=${days}`),
        authFetch(`/api/reports/payment-breakdown?days=${days}`),
        authFetch('/api/reports/dashboard-stats'),
      ])

      const salesData = await salesRes.json()
      const productsData = await productsRes.json()
      const paymentsData = await paymentsRes.json()
      const statsData = await statsRes.json()

      if (salesData.success) setDailySales(salesData.data)
      if (productsData.success) setTopProducts(productsData.data)
      if (paymentsData.success) setPaymentBreakdown(paymentsData.data)
      if (statsData.success) setDashboardStats(statsData.data)
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: any) => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return `${currency}0`
    }
    return `${currency}${Number(value).toFixed(0)}`
  }

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Admin access required</p>
          <p className="text-sm">Only admins can view reports</p>
        </div>
      </div>
    )
  }

  const pieData = [
    { name: 'Cash', value: paymentBreakdown.cash },
    { name: 'Card', value: paymentBreakdown.card },
    { name: 'UPI', value: paymentBreakdown.upi },
  ].filter(d => d.value > 0)

  const totalPayments = paymentBreakdown.cash + paymentBreakdown.card + paymentBreakdown.upi

  const isDarkBg = settings?.cardThemeMode === 'dark'
  const cardClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-muted-foreground'
  const tableHeaderCellClass = isDarkBg ? 'text-slate-400 border-slate-800' : ''
  const tableRowClass = isDarkBg ? 'border-slate-800 hover:bg-slate-800/20' : ''
  const cellTextClass = isDarkBg ? 'text-slate-200' : ''

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
              className={isDarkBg && dateRange !== range ? "bg-[#111726] border-slate-800 text-slate-300 hover:text-white" : ""}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className={cardClass}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMutedClass}`}>Today's Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(dashboardStats?.todayRevenue || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMutedClass}`}>Today's Transactions</p>
                    <p className="text-2xl font-bold">{dashboardStats?.todayTransactions || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMutedClass}`}>This Month</p>
                    <p className="text-2xl font-bold">{formatCurrency(dashboardStats?.monthRevenue || 0)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textMutedClass}`}>Profit Margin</p>
                    <p className="text-2xl font-bold">{(dashboardStats?.profitMargin || 0).toFixed(1)}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Revenue Chart */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
                <CardDescription className={textMutedClass}>Daily revenue over selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkBg ? "#1f2937" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => format(new Date(v), 'MMM dd')}
                        className="text-xs"
                        stroke={isDarkBg ? "#6b7280" : undefined}
                      />
                      <YAxis 
                        tickFormatter={(v) => `${currency}${v/1000}k`}
                        className="text-xs"
                        stroke={isDarkBg ? "#6b7280" : undefined}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className={`p-3 rounded-xl border shadow-lg text-xs ${
                                isDarkBg 
                                  ? 'bg-[#111726] border-slate-800 text-slate-100' 
                                  : 'bg-white border-slate-200 text-slate-900'
                              }`}>
                                <p className={`font-semibold mb-1 ${isDarkBg ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {label ? (() => {
                                    try {
                                      return format(new Date(label), 'MMM dd, yyyy')
                                    } catch (e) {
                                      return label
                                    }
                                  })() : ''}
                                </p>
                                {payload.map((pld: any, index: number) => (
                                  <p key={index} className="font-bold flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pld.color || 'hsl(var(--primary))' }} />
                                    {pld.name}: <span className="text-primary">{formatCurrency(pld.value)}</span>
                                  </p>
                                ))}
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle className="text-lg">Payment Methods</CardTitle>
                <CardDescription className={textMutedClass}>Breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center">
                  {totalPayments === 0 ? (
                    <div className={`text-center ${textMutedClass}`}>
                      <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No payment data</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className={`p-3 rounded-xl border shadow-lg text-xs ${
                                  isDarkBg 
                                    ? 'bg-[#111726] border-slate-800 text-slate-100' 
                                    : 'bg-white border-slate-200 text-slate-900'
                                }`}>
                                  {payload.map((pld: any, index: number) => (
                                    <p key={index} className="font-bold flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pld.payload.fill || pld.color }} />
                                      {pld.name}: <span className="font-semibold">{formatCurrency(pld.value)}</span>
                                    </p>
                                  ))}
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span className={`text-sm ${textMutedClass}`}>Cash</span>
                    </div>
                    <p className="font-bold">{formatCurrency(paymentBreakdown.cash)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className={`text-sm ${textMutedClass}`}>Card</span>
                    </div>
                    <p className="font-bold">{formatCurrency(paymentBreakdown.card)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className={`text-sm ${textMutedClass}`}>UPI</span>
                    </div>
                    <p className="font-bold">{formatCurrency(paymentBreakdown.upi)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className="text-lg">Top Products</CardTitle>
              <CardDescription className={textMutedClass}>Best selling products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <div className={`text-center py-8 ${textMutedClass}`}>
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No sales data yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className={isDarkBg ? 'border-slate-800' : ''}>
                    <TableRow className={isDarkBg ? 'border-slate-800 hover:bg-slate-800/30' : ''}>
                      <TableHead className={`w-12 ${tableHeaderCellClass}`}>#</TableHead>
                      <TableHead className={tableHeaderCellClass}>Product</TableHead>
                      <TableHead className={`text-right ${tableHeaderCellClass}`}>Units Sold</TableHead>
                      <TableHead className={`text-right ${tableHeaderCellClass}`}>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.slice(0, 10).map((product, index) => (
                      <TableRow key={product.productId} className={tableRowClass}>
                        <TableCell className={`font-medium ${cellTextClass}`}>{index + 1}</TableCell>
                        <TableCell className={cellTextClass}>{product.productName}</TableCell>
                        <TableCell className={`text-right ${cellTextClass}`}>{product.totalQuantity}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <span className={`font-medium ${cellTextClass}`}>{formatCurrency(product.totalRevenue)}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs gap-1 shrink-0 text-slate-400 hover:text-white"
                              onClick={() => window.open(`/products/${product.productId}/print`, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                              View / Print
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
