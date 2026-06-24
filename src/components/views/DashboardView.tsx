'use client'

import { useState, useEffect } from 'react'
import { useAuthStore, useUIStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  LayoutDashboard,
  ShoppingCart, 
  Package, 
  Receipt, 
  TrendingUp, 
  DollarSign, 
  Users,
  ArrowRight,
  Clock,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  FileText,
  Bell
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface DashboardStats {
  todaySales: number
  todayOrders: number
  totalProducts: number
  lowStockProducts: number
  totalCustomers: number
  pendingSync: number
  totalSales?: number
  totalOrders?: number
  averageBasketValue?: number
  lowStockSKUs?: number
  inventoryValue?: number
}

interface RecentOrder {
  id: string
  invoiceNumber: string
  totalAmount: number
  paymentMethod: string
  status: string
  createdAt: string
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [dailySales, setDailySales] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, store, settings } = useAuthStore()
  const { setActiveTab } = useUIStore()
  const currency = settings?.currencySymbol || '₹'

  const isDarkBg = settings?.cardThemeMode === 'dark'
  const cardClass = isDarkBg ? 'bg-[#111726] border-slate-800/80 shadow-md text-slate-100' : 'bg-white border-slate-200 shadow-sm text-slate-900'
  const borderOrangeClass = isDarkBg ? 'border-[#ea580c]/20' : 'border-orange-200'
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-slate-500'
  const textTitleClass = isDarkBg ? 'text-slate-400' : 'text-slate-700'
  const textSubTitleClass = isDarkBg ? 'text-slate-500 mt-1' : 'text-slate-400 mt-1'
  const innerCardClass = isDarkBg ? 'bg-[#090D1A]/50 border-slate-800' : 'bg-slate-50 border-slate-200'
  const innerRowClass = isDarkBg ? 'bg-[#090D1A]/50 border-slate-800/80 hover:bg-[#151d2f]/50' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
  const inputClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-white focus-visible:ring-amber-500' : 'bg-white border-slate-200 text-slate-900 focus-visible:ring-amber-500'
  const selectClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
  const textLinkClass = isDarkBg ? 'text-amber-500 hover:text-amber-400' : 'text-amber-600 hover:text-amber-700 font-semibold'

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load stats
      const statsResponse = await authFetch('/api/reports/dashboard-stats')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // Load daily sales chart data
      const salesResponse = await authFetch('/api/reports/daily-sales?days=7')
      const salesData = await salesResponse.json()
      if (salesData.success) {
        setDailySales(salesData.data)
      }

      // Load recent orders
      const ordersResponse = await authFetch('/api/orders?limit=5')
      const ordersData = await ordersResponse.json()
      if (ordersData.success) {
        setRecentOrders(ordersData.data.slice(0, 5))
      }

    } catch (error) {
      console.error('Failed to load dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }


  const formatCurrency = (amount: any) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return `${currency}0.00`
    }
    return `${currency}${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy, hh:mm a')
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-auto bg-[#090D1A] text-slate-100 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 text-white">
            <LayoutDashboard className="w-8 h-8 text-amber-500" />
            Control Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time operations and inventory conversions for {store?.name || 'BarrelFlow Spirits'}.
          </p>
        </div>
        <Button 
          onClick={loadDashboardData}
          variant="outline"
          className="bg-[#111726] border-slate-800 text-slate-300 hover:text-white self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Stats
        </Button>
      </div>

      {/* KPI Cards Row (5 cards) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
        {/* Today's Sales */}
        <Card className={cardClass}>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textTitleClass}`}>Today's Sales</p>
            <p className="text-xl font-extrabold text-amber-500 mt-2">
              {isLoading ? '...' : formatCurrency(stats?.todaySales || 0)}
            </p>
            <span className={`text-[10px] mt-1 ${textSubTitleClass}`}>{stats?.todayOrders || 0} bills compiled</span>
          </CardContent>
        </Card>

        {/* Total Transactions */}
        <Card className={cardClass}>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textTitleClass}`}>Transactions</p>
            <p className={`text-xl font-extrabold mt-2 ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>
              {isLoading ? '...' : stats?.totalOrders || 0}
            </p>
            <span className={`text-[10px] mt-1 ${textSubTitleClass}`}>All-time tickets</span>
          </CardContent>
        </Card>

        {/* Average Basket Value */}
        <Card className={cardClass}>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textTitleClass}`}>Avg Basket</p>
            <p className={`text-xl font-extrabold mt-2 ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>
              {isLoading ? '...' : formatCurrency(stats?.averageBasketValue || 0)}
            </p>
            <span className={`text-[10px] mt-1 ${textSubTitleClass}`}>Per transaction</span>
          </CardContent>
        </Card>

        {/* Low Stock SKUs */}
        <Card className={cardClass}>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textTitleClass}`}>Low Stock SKUs</p>
            <p className="text-xl font-extrabold text-rose-500 mt-2">
              {isLoading ? '...' : stats?.lowStockSKUs || 0}
            </p>
            <span className={`text-[10px] mt-1 ${textSubTitleClass}`}>Below threshold</span>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className={`${cardClass} ${borderOrangeClass}`}>
          <CardContent className="p-4 flex flex-col justify-between h-full min-h-[100px]">
            <p className={`text-[11px] font-bold uppercase tracking-wider ${textTitleClass}`}>Inventory Value</p>
            <p className="text-xl font-extrabold text-amber-500 mt-2">
              {isLoading ? '...' : formatCurrency(stats?.inventoryValue || 0)}
            </p>
            <span className={`text-[10px] mt-1 ${textSubTitleClass}`}>At wholesale cost</span>
          </CardContent>
        </Card>
      </div>

      {/* Middle Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Sales Overview Area Chart (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={cardClass}>
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-bold uppercase tracking-wider ${textTitleClass}`}>Sales Trends (Daily Revenue)</CardTitle>
              <CardDescription className={`text-xs ${textMutedClass}`}>Recent sales transaction performance chart</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 h-[300px]">
              {dailySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkBg ? "#1f2937" : "#e2e8f0"} vertical={false} />
                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={`p-3 rounded-xl border shadow-lg text-xs ${
                              isDarkBg 
                                ? 'bg-[#111726] border-slate-800 text-slate-100' 
                                : 'bg-white border-slate-200 text-slate-900'
                            }`}>
                              <p className={`font-semibold mb-1 ${isDarkBg ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                              {payload.map((pld: any, index: number) => (
                                <p key={index} className="font-bold flex items-center gap-1.5 mt-0.5">
                                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: pld.color || '#F59E0B' }} />
                                  {pld.name}: <span className="text-amber-500">{formatCurrency(pld.value)}</span>
                                </p>
                              ))}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">No transaction chart data populated</div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Panel: Operations & Compliance Checks */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Shift & Store Status */}
          <Card className={cardClass}>
            <CardHeader>
              <CardTitle className={`text-sm font-bold uppercase tracking-wider ${textTitleClass}`}>Shift Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className={textMutedClass}>Drawer Cash Balance</span>
                <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>{formatCurrency(8500)}</span>
              </div>
              <div className="flex justify-between">
                <span className={textMutedClass}>Active Cashier</span>
                <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>Jason Miller</span>
              </div>
              <div className="flex justify-between">
                <span className={textMutedClass}>Shift Duration</span>
                <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-800'}`}>3h 48m</span>
              </div>
              <div className="flex justify-between">
                <span className={textMutedClass}>Register Status</span>
                <span className="font-bold text-emerald-400">Secure (Online)</span>
              </div>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* Bottom Row - Recent Transactions */}
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className={`text-sm font-bold uppercase tracking-wider ${textTitleClass}`}>Recent Transactions</CardTitle>
            <CardDescription className={`text-xs ${textMutedClass}`}>Last 5 completed liquor store sales</CardDescription>
          </div>
          <Button variant="outline" size="sm" className={isDarkBg ? "bg-[#090D1A] border-slate-800 text-slate-300 hover:text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"} onClick={() => setActiveTab('transactions')}>
            View All Bills
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center text-slate-500 py-8 text-xs">No transactions completed in this shift</div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div 
                  key={order.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-colors ${innerRowClass}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                      <Receipt className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className={`text-xs font-extrabold ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>{order.invoiceNumber}</p>
                      <p className={`text-[10px] mt-0.5 ${textSubTitleClass}`}>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="text-xs font-extrabold text-amber-500">{formatCurrency(order.totalAmount)}</p>
                      <span className={`text-[9px] uppercase tracking-wider ${textSubTitleClass}`}>{order.paymentMethod}</span>
                    </div>
                    <Badge className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
