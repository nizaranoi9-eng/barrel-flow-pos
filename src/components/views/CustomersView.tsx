'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail,
  ShoppingBag,
  Loader2,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  totalOrders: number
  totalSpent: number
  lastOrder: string | null
  createdAt: string
}

export function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })

  const { settings } = useAuthStore()
  const currency = settings?.currencySymbol || '₹'

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    setIsLoading(true)
    try {
      // Fetch both saved customer profiles and orders
      const [custRes, ordersRes] = await Promise.all([
        authFetch('/api/customers'),
        authFetch('/api/orders')
      ])
      
      const custData = await custRes.json()
      const ordersData = await ordersRes.json()

      if (custData.success && ordersData.success) {
        const customerMap = new Map<string, Customer>()
        
        // 1. Pre-populate with saved customer profiles
        custData.data.forEach((c: any) => {
          const key = c.phone || c.email || c.id
          if (!key) return
          
          customerMap.set(key, {
            id: c.id,
            name: c.name || c.phone || c.email || 'Unknown',
            phone: c.phone,
            email: c.email,
            address: c.address,
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: null,
            createdAt: c.createdAt
          })
        })

        // 2. Aggregate statistics from orders
        ordersData.data.forEach((order: any) => {
          const key = order.customerPhone || order.customerEmail || 'walk-in'
          if (key === 'walk-in') return
          
          if (!customerMap.has(key)) {
            // Fallback for orders that don't have a pre-registered profile
            customerMap.set(key, {
              id: key,
              name: order.customerPhone || order.customerEmail?.split('@')[0] || 'Unknown',
              phone: order.customerPhone,
              email: order.customerEmail,
              address: null,
              totalOrders: 0,
              totalSpent: 0,
              lastOrder: null,
              createdAt: order.createdAt
            })
          }
          
          const customer = customerMap.get(key)!
          customer.totalOrders++
          customer.totalSpent += order.totalAmount
          if (!customer.lastOrder || new Date(order.createdAt) > new Date(customer.lastOrder)) {
            customer.lastOrder = order.createdAt
          }
        })
        
        setCustomers(Array.from(customerMap.values()))
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setFormData({ name: '', phone: '', email: '', address: '' })
    setEditingCustomer(null)
    setShowAddDialog(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setFormData({
      name: customer.name === customer.phone ? '' : customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || ''
    })
    setEditingCustomer(customer)
    setShowAddDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const isDbCustomer = editingCustomer && editingCustomer.id.startsWith('cust_')
      const url = isDbCustomer 
        ? `/api/customers/${editingCustomer.id}` 
        : '/api/customers'
      const method = isDbCustomer ? 'PUT' : 'POST'

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await response.json()

      if (data.success) {
        toast.success(editingCustomer ? 'Customer updated' : 'Customer added')
        setShowAddDialog(false)
        loadCustomers()
      } else {
        toast.error(data.error || 'Failed to save customer')
      }
    } catch (error) {
      console.error('Failed to save customer:', error)
      toast.error('Failed to save customer')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalCustomers = customers.length
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)

  const isDarkBg = settings?.cardThemeMode === 'dark'
  const cardClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
  const inputClass = isDarkBg ? 'bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500 pl-9' : 'pl-9 bg-white border-slate-200 text-slate-900'
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
            <Users className="w-6 h-6" />
            Customers
          </h2>
          <p className={`${textMutedClass} text-sm mt-1`}>
            Manage your customer database
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card className={cardClass}>
          <CardContent className="p-4">
            <p className={`text-sm ${textMutedClass}`}>Total Customers</p>
            <p className="text-2xl font-bold">{totalCustomers}</p>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <p className={`text-sm ${textMutedClass}`}>Total Revenue</p>
            <p className="text-2xl font-bold text-primary">{currency}{totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textMutedClass}`} />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Customers Table */}
      <Card className={`flex-1 ${cardClass}`}>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 ${textMutedClass}`}>
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No customers found</p>
              <p className="text-sm">Customers will appear here after sales are made</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className={isDarkBg ? 'border-slate-800' : ''}>
                  <TableRow className={isDarkBg ? 'border-slate-800 hover:bg-slate-800/30' : ''}>
                    <TableHead className={tableHeaderCellClass}>Name</TableHead>
                    <TableHead className={tableHeaderCellClass}>Contact</TableHead>
                    <TableHead className={`text-center ${tableHeaderCellClass}`}>Orders</TableHead>
                    <TableHead className={`text-right ${tableHeaderCellClass}`}>Total Spent</TableHead>
                    <TableHead className={tableHeaderCellClass}>Last Order</TableHead>
                    <TableHead className={`w-[100px] ${tableHeaderCellClass}`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className={tableRowClass}>
                      <TableCell className={`font-medium ${cellTextClass}`}>{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {customer.phone && (
                            <span className={`flex items-center gap-1 text-sm ${cellTextClass}`}>
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </span>
                          )}
                          {customer.email && (
                            <span className={`flex items-center gap-1 text-sm ${cellTextMutedClass}`}>
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1 bg-slate-800/20 text-slate-300 border-none">
                          <ShoppingBag className="w-3 h-3" />
                          {customer.totalOrders}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${cellTextClass}`}>
                        {currency}{customer.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-sm ${cellTextMutedClass}`}>
                        {customer.lastOrder ? format(new Date(customer.lastOrder), 'dd MMM yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(customer)}
                            className="h-8 w-8 text-slate-400 hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
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

      {/* Add/Edit Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className={isDarkBg ? "bg-[#151C2C] border-slate-800 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription className={textMutedClass}>
              Enter customer details below
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                className={isDarkBg ? "bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className={isDarkBg ? "bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="customer@email.com"
                className={isDarkBg ? "bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Customer address"
                className={isDarkBg ? "bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500" : ""}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className={isDarkBg ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : ""}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className={isDarkBg ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold border-none" : ""}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {editingCustomer ? 'Update' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
