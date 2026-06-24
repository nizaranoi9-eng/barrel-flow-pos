'use client'

import { useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Gift, 
  Plus, 
  Trash2, 
  Calendar, 
  Percent, 
  Tags,
  BadgeAlert,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export function PromotionsView() {
  const { settings } = useAuthStore()
  const isDarkBg = settings?.cardThemeMode === 'dark'

  const cardClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-100 shadow-md' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-slate-500'
  const textTitleClass = isDarkBg ? 'text-slate-400' : 'text-slate-700 font-semibold'
  const textHeadingClass = isDarkBg ? 'text-white' : 'text-slate-900'
  const tableHeaderClass = isDarkBg ? 'bg-[#0c101d] border-b border-slate-800' : 'bg-slate-50 border-b border-slate-200'
  const tableRowClass = isDarkBg ? 'border-b border-slate-800/60 hover:bg-[#121929]/50 text-slate-200' : 'border-b border-slate-200 hover:bg-slate-50 text-slate-800'
  const tableCellNameClass = isDarkBg ? 'font-extrabold text-slate-200' : 'font-extrabold text-slate-900'
  const tableCellMutedClass = isDarkBg ? 'text-slate-400 text-xs' : 'text-slate-500 text-xs'
  const inputClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-white placeholder-slate-650 focus-visible:ring-amber-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus-visible:ring-amber-500'
  const selectTriggerClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-white focus:ring-amber-500' : 'bg-white border-slate-200 text-slate-900 focus:ring-amber-500'
  const selectContentClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
  const dialogContentClass = isDarkBg ? 'sm:max-w-md bg-[#111726] border-slate-800 text-slate-100' : 'sm:max-w-md bg-white border-slate-200 text-slate-900'
  const labelClass = isDarkBg ? 'text-slate-300' : 'text-slate-700'
  const dialogCancelBtnClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-750 hover:bg-slate-200 hover:text-slate-900'

  const [promotions, setPromotions] = useState([
    { id: 1, name: 'Wine Wednesday', type: 'percentage', value: 15, category: 'Wine', status: 'Active', schedule: 'Wednesdays Only', code: 'WINEWED15' },
    { id: 2, name: 'Happy Hour Beer B2G1', type: 'bogo', value: 0, category: 'Beer', status: 'Active', schedule: 'Daily, 4 PM - 7 PM', code: 'BEERBOGO' },
    { id: 3, name: 'Whiskey Lovers Discount', type: 'flat', value: 300, category: 'Whisky', status: 'Active', schedule: 'Weekends', code: 'WHISKEY300' },
    { id: 4, name: 'First-time Customer Offer', type: 'percentage', value: 10, category: 'All Items', status: 'Inactive', schedule: 'Always On', code: 'WELCOME10' },
  ])

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'percentage',
    value: '',
    category: 'Beer',
    schedule: 'Always On',
    code: '',
  })

  const handleDelete = (id: number) => {
    setPromotions(promotions.filter(p => p.id !== id))
    toast.success('Promotion deleted')
  }

  const handleAdd = () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and Promo Code are required')
      return
    }
    setIsSaving(true)
    setTimeout(() => {
      const newPromo = {
        id: Date.now(),
        name: formData.name,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        category: formData.category,
        status: 'Active',
        schedule: formData.schedule,
        code: formData.code.toUpperCase(),
      }
      setPromotions([newPromo, ...promotions])
      setShowAddDialog(false)
      setIsSaving(false)
      toast.success('Promotion created successfully')
      setFormData({
        name: '',
        type: 'percentage',
        value: '',
        category: 'Beer',
        schedule: 'Always On',
        code: '',
      })
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#090D1A] text-slate-100 p-4 md:p-6 overflow-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 text-white">
            <Gift className="w-8 h-8 text-amber-500" />
            Promotions & Campaigns
          </h1>
          <p className="text-slate-400 mt-1">
            Create, configure, and monitor store-level promotional campaigns and discounts.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Promotion
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Campaign Management list */}
        <Card className={cardClass}>
          <CardHeader>
            <CardTitle className={`text-sm font-bold uppercase tracking-wider ${textTitleClass}`}>All Campaigns</CardTitle>
            <CardDescription className={`text-xs ${textMutedClass}`}>Active and inactive liquor billing campaign coupons</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`rounded-2xl border overflow-hidden ${isDarkBg ? 'border-slate-800 bg-[#090D1A]/50' : 'border-slate-200 bg-slate-50/50'}`}>
              <Table>
                <TableHeader className={tableHeaderClass}>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Campaign Name</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Promo Code</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Category</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Discount Type</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Value</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Schedule / Hours</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs`}>Status</TableHead>
                    <TableHead className={`${textMutedClass} font-bold text-xs w-[100px] text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((promo) => (
                    <TableRow key={promo.id} className={tableRowClass}>
                      <TableCell className={tableCellNameClass}>{promo.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[10px] text-amber-500 border-amber-500/20 bg-amber-500/5 px-2 py-0.5">
                          {promo.code}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${isDarkBg ? 'text-slate-300' : 'text-slate-750'}`}>{promo.category}</TableCell>
                      <TableCell className={`capitalize ${textMutedClass}`}>
                        {promo.type === 'bogo' ? 'Buy 2 Get 1 (BOGO)' : promo.type}
                      </TableCell>
                      <TableCell className={`font-extrabold ${isDarkBg ? 'text-slate-100' : 'text-slate-900'}`}>
                        {promo.type === 'bogo' ? 'Free bottle' : promo.type === 'flat' ? `₹${promo.value}` : `${promo.value}%`}
                      </TableCell>
                      <TableCell className={`${tableCellMutedClass} flex items-center gap-1.5 py-4`}>
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {promo.schedule}
                      </TableCell>
                      <TableCell>
                        <Badge className={promo.status === 'Active' ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[9px]' : 'bg-slate-800 text-slate-500 text-[9px]'}>
                          {promo.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full"
                          onClick={() => handleDelete(promo.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader>
            <DialogTitle className={isDarkBg ? 'text-white' : 'text-slate-900'}>Create Liquor Promotion</DialogTitle>
            <DialogDescription className={`text-xs ${textMutedClass}`}>Setup a new discount code for POS checkout</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name" className={labelClass}>Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g. Wine Wednesday"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code" className={labelClass}>Promo Code</Label>
                <Input
                  id="code"
                  placeholder="e.g. WINE15"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className={labelClass}>Applicable Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(val) => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="All Items">All Items</SelectItem>
                    <SelectItem value="Beer">Beer</SelectItem>
                    <SelectItem value="Whisky">Whisky</SelectItem>
                    <SelectItem value="Vodka">Vodka</SelectItem>
                    <SelectItem value="Rum">Rum</SelectItem>
                    <SelectItem value="Wine">Wine</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className={labelClass}>Discount Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(val) => setFormData({ ...formData, type: val })}
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                    <SelectItem value="bogo">Buy 2 Get 1 (BOGO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.type !== 'bogo' && (
                <div className="space-y-2">
                  <Label htmlFor="value" className={labelClass}>Discount Value</Label>
                  <Input
                    id="value"
                    type="number"
                    placeholder="e.g. 15"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule" className={labelClass}>Active Schedule</Label>
              <Input
                id="schedule"
                placeholder="e.g. Wednesdays, 4 PM - 8 PM"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className={dialogCancelBtnClass} onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
