'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore, useCategoriesStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package, 
  AlertTriangle,
  Loader2,
  Filter,
  PackageCheck
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { MEASUREMENT_UNITS, PACKAGE_TYPES, formatStockDisplay } from '@/lib/types'

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterStock, setFilterStock] = useState<string>('all')
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const { user, settings } = useAuthStore()
  const { categories, setCategories } = useCategoriesStore()

  const isDarkBg = settings?.cardThemeMode === 'dark'
  const cardClass = isDarkBg ? 'bg-[#111726] border-slate-800/80 shadow-md text-slate-100' : 'bg-white border-slate-200 shadow-sm text-slate-900'
  const borderClass = isDarkBg ? 'border-slate-800' : 'border-slate-200'
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-slate-500'
  const textHeadingClass = isDarkBg ? 'text-white' : 'text-slate-900'
  const inputClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-white focus-visible:ring-amber-500 placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 focus-visible:ring-amber-500 placeholder-slate-400'
  const selectTriggerClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
  const selectContentClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-250' : 'bg-white border-slate-200 text-slate-800'
  const dialogContentClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
  const innerCardClass = isDarkBg ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-750'
  const tableHeaderCellClass = isDarkBg ? 'text-slate-400 border-slate-800' : 'text-slate-600 border-slate-200 bg-slate-50'
  const tableRowClass = isDarkBg ? 'border-slate-800/40 hover:bg-[#151C2C]/30 text-slate-100' : 'border-slate-200 hover:bg-slate-100/50 text-slate-800'

  // Product form state - new inventory fields
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    sku: '',
    barcode: '',
    costPrice: '',
    sellingPrice: '',
    // New inventory fields
    measurementUnit: 'piece',
    packageType: 'piece',
    packageSize: '1',
    stockPackages: '',
    // Liquor fields
    brand: '',
    abv: '0',
    bottleSize: '750ml',
    mrp: '',
    batchNumber: '',
    expiryDate: '',
    supplier: '',
  })

  const isAdmin = user?.role === 'admin'
  const currency = settings?.currencySymbol || '₹'

  // Calculate total stock for preview
  const totalStockPreview = useMemo(() => {
    const pkgSize = parseFloat(formData.packageSize) || 0
    const pkgCount = parseInt(formData.stockPackages) || 0
    return pkgSize * pkgCount
  }, [formData.packageSize, formData.stockPackages])

  // Get unit label for preview
  const unitLabel = useMemo(() => {
    return MEASUREMENT_UNITS.find(u => u.value === formData.measurementUnit)?.label.split(' ')[0] || formData.measurementUnit
  }, [formData.measurementUnit])

  // Get package label for preview
  const packageLabel = useMemo(() => {
    return PACKAGE_TYPES.find(p => p.value === formData.packageType)?.label || formData.packageType
  }, [formData.packageType])

  // Load products and categories
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        authFetch('/api/products'),
        authFetch('/api/categories'),
      ])

      const productsData = await productsRes.json()
      const categoriesData = await categoriesRes.json()

      if (productsData.success) {
        setProducts(productsData.data)
      }
      if (categoriesData.success) {
        setCategories(categoriesData.data)
      }
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)))
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelection = new Set(selectedProducts)
    if (checked) {
      newSelection.add(productId)
    } else {
      newSelection.delete(productId)
    }
    setSelectedProducts(newSelection)
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory
    
    // Use stockPackages for filtering if available, fallback to stockQuantity
    const stockCount = product.stockPackages ?? product.stockQuantity
    let matchesStock = true
    if (filterStock === 'low') {
      matchesStock = stockCount <= (settings?.lowStockThreshold || 20) && stockCount > 0
    } else if (filterStock === 'out') {
      matchesStock = stockCount === 0
    } else if (filterStock === 'in') {
      matchesStock = stockCount > (settings?.lowStockThreshold || 20)
    }

    return matchesSearch && matchesCategory && matchesStock
  })

  const openAddProduct = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      categoryId: categories[0]?.id || '',
      sku: '',
      barcode: '',
      costPrice: '',
      sellingPrice: '',
      measurementUnit: 'piece',
      packageType: 'piece',
      packageSize: '1',
      stockPackages: '',
      brand: '',
      abv: '0',
      bottleSize: '750ml',
      mrp: '',
      batchNumber: '',
      expiryDate: '',
      supplier: '',
    })
    setShowProductDialog(true)
  }

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      categoryId: product.categoryId || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      measurementUnit: product.measurementUnit || 'piece',
      packageType: product.packageType || 'piece',
      packageSize: (product.packageSize || 1).toString(),
      stockPackages: (product.stockPackages ?? product.stockQuantity).toString(),
      brand: product.brand || '',
      abv: (product.abv ?? 0).toString(),
      bottleSize: product.bottleSize || '750ml',
      mrp: (product.mrp ?? product.sellingPrice).toString(),
      batchNumber: product.batchNumber || '',
      expiryDate: product.expiryDate || '',
      supplier: product.supplier || '',
    })
    setShowProductDialog(true)
  }

  const handleSaveProduct = async () => {
    // Validate
    if (!formData.name || !formData.sellingPrice) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSaving(true)
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'
      const method = editingProduct ? 'PUT' : 'POST'

      const packageSize = parseFloat(formData.packageSize) || 1
      const stockPackages = parseInt(formData.stockPackages) || 0
      const totalStockBaseUnit = packageSize * stockPackages

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          categoryId: formData.categoryId || null,
          sku: formData.sku || null,
          barcode: formData.barcode || null,
          costPrice: parseFloat(formData.costPrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice),
          // New inventory fields
          measurementUnit: formData.measurementUnit,
          packageType: formData.packageType,
          packageSize: packageSize,
          stockPackages: stockPackages,
          totalStockBaseUnit: totalStockBaseUnit,
          // Liquor fields
          brand: formData.brand || null,
          abv: parseFloat(formData.abv) || 0,
          bottleSize: formData.bottleSize || null,
          mrp: parseFloat(formData.mrp) || parseFloat(formData.sellingPrice) || 0,
          batchNumber: formData.batchNumber || null,
          expiryDate: formData.expiryDate || null,
          supplier: formData.supplier || null,
          // Legacy fields for backwards compatibility
          stockQuantity: stockPackages,
          unit: formData.packageType,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingProduct ? 'Product updated' : 'Product added')
        setShowProductDialog(false)
        loadData()
      } else {
        toast.error(data.error || 'Failed to save product')
      }
    } catch (error) {
      toast.error('Failed to save product')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await authFetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Product deleted')
        loadData()
      } else {
        toast.error(data.error || 'Failed to delete product')
      }
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return

    setIsBulkDeleting(true)
    try {
      const response = await authFetch('/api/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${data.data.deletedCount} product(s) deleted`)
        setSelectedProducts(new Set())
        setShowBulkDeleteDialog(false)
        loadData()
      } else {
        toast.error(data.error || 'Failed to delete products')
      }
    } catch (error) {
      toast.error('Failed to delete products')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const lowStockCount = products.filter(p => {
    const stock = p.stockPackages ?? p.stockQuantity
    return stock <= (settings?.lowStockThreshold || 20) && stock > 0
  }).length
  const outOfStockCount = products.filter(p => (p.stockPackages ?? p.stockQuantity) === 0).length

  if (!isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Admin access required</p>
          <p className="text-sm">Only admins can manage products</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-auto bg-[#090D1A] text-slate-100 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 focus-visible:ring-amber-500 focus-visible:border-amber-500 ${isDarkBg ? 'bg-[#111726] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-sm'}`}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className={`w-[150px] ${selectTriggerClass}`}>
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStock} onValueChange={setFilterStock}>
            <SelectTrigger className={`w-[130px] ${selectTriggerClass}`}>
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button className="bg-red-955/40 border border-red-500/30 text-red-400 hover:bg-red-900/40 hover:text-red-300">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected ({selectedProducts.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className={dialogContentClass}>
                <AlertDialogHeader>
                  <AlertDialogTitle className={isDarkBg ? 'text-white' : 'text-slate-900'}>Delete Selected Products</AlertDialogTitle>
                  <AlertDialogDescription className={textMutedClass}>
                    Are you sure you want to delete {selectedProducts.size} product(s)? This will remove them from your inventory.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className={isDarkBg ? 'border-slate-800 text-slate-300 hover:bg-slate-800/30' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    {isBulkDeleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Delete {selectedProducts.size} Product(s)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={openAddProduct} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold border-none">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card className={cardClass}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Total Products</p>
                <p className={`text-2xl font-bold mt-1 ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>{products.length}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                <Package className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>In Stock</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {products.filter(p => (p.stockPackages ?? p.stockQuantity) > (settings?.lowStockThreshold || 20)).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/10">
                <PackageCheck className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Low Stock</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">{lowStockCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/10 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={cardClass}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium uppercase tracking-wider ${textMutedClass}`}>Out of Stock</p>
                <p className="text-2xl font-bold text-rose-500 mt-1">{outOfStockCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/10">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card className={`flex-1 min-h-0 ${cardClass}`}>
        <CardContent className="p-0 h-full flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={`flex-1 flex items-center justify-center ${textMutedClass}`}>
              <div className="text-center">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No products found</p>
                <p className="text-sm">Add your first product to get started</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className={`border-b ${isDarkBg ? 'border-slate-800' : 'border-slate-200'}`}>
                  <TableRow className={`border-b hover:bg-transparent ${isDarkBg ? 'border-slate-800/60' : 'border-slate-200'}`}>
                    <TableHead className={`w-12 font-semibold ${tableHeaderCellClass}`}>
                      <Checkbox
                        checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all products"
                        className="border-slate-750 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black"
                      />
                    </TableHead>
                    <TableHead className={`font-semibold ${tableHeaderCellClass}`}>Product Details</TableHead>
                    <TableHead className={`font-semibold ${tableHeaderCellClass}`}>Category</TableHead>
                    <TableHead className={`text-right font-semibold ${tableHeaderCellClass}`}>Cost & Supplier</TableHead>
                    <TableHead className={`text-right font-semibold ${tableHeaderCellClass}`}>Retail Price & MRP</TableHead>
                    <TableHead className={`text-center font-semibold ${tableHeaderCellClass}`}>Inventory Stock</TableHead>
                    <TableHead className={`text-right font-semibold ${tableHeaderCellClass}`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.categoryId)
                    const stockPackages = product.stockPackages ?? product.stockQuantity
                    const isLowStock = stockPackages <= (settings?.lowStockThreshold || 20) && stockPackages > 0
                    const isOutOfStock = stockPackages === 0

                    // Format stock display
                    const stockDisplay = formatStockDisplay(
                      stockPackages,
                      product.packageType || 'piece',
                      product.packageSize || 1,
                      product.measurementUnit || 'piece'
                    )

                    return (
                      <TableRow key={product.id} className={tableRowClass}>
                        <TableCell className="w-12">
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            aria-label={`Select ${product.name}`}
                            className="border-slate-750 data-[state=checked]:bg-amber-500 data-[state=checked]:text-black"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className={`font-semibold text-sm ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                              {product.brand && (
                                <span className="text-amber-500/90 font-medium">Brand: {product.brand}</span>
                              )}
                              {product.abv !== undefined && product.abv > 0 && (
                                <span className={textMutedClass}>• {product.abv}% ABV</span>
                              )}
                              {product.bottleSize && (
                                <span className={textMutedClass}>• {product.bottleSize}</span>
                              )}
                            </div>
                            <div className={`flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] ${textMutedClass}`}>
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.barcode && <span>• Barcode: {product.barcode}</span>}
                            </div>
                            {(product.batchNumber || (product.expiryDate && product.expiryDate !== 'N/A')) && (
                              <div className={`flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] italic ${textMutedClass}`}>
                                {product.batchNumber && <span>Batch: {product.batchNumber}</span>}
                                {product.expiryDate && product.expiryDate !== 'N/A' && (
                                  <span>• Exp: {product.expiryDate}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs font-normal border ${isDarkBg ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            {category?.name || 'Other'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`text-sm font-medium ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>{currency}{product.costPrice.toFixed(2)}</div>
                          <div className={`text-[11px] mt-0.5 truncate max-w-[120px] ml-auto ${textMutedClass}`}>
                            {product.supplier || 'No Supplier'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm font-semibold text-amber-500">{currency}{product.sellingPrice.toFixed(2)}</div>
                          {product.mrp !== undefined && (
                            <div className={`text-[11px] mt-0.5 ${textMutedClass}`}>
                              MRP: {currency}{product.mrp.toFixed(2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="outline"
                            className={
                              isOutOfStock 
                                ? 'bg-red-500/10 text-red-400 border-red-500/20 text-xs' 
                                : isLowStock 
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs' 
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs'
                            }
                          >
                            {stockDisplay}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditProduct(product)} className={`text-slate-400 hover:text-amber-400 rounded-lg h-8 w-8 ${isDarkBg ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className={`text-slate-400 hover:text-red-400 rounded-lg h-8 w-8 ${isDarkBg ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className={dialogContentClass}>
                              <AlertDialogHeader>
                                <AlertDialogTitle className={isDarkBg ? 'text-white' : 'text-slate-900'}>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription className={textMutedClass}>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className={isDarkBg ? 'border-slate-800 text-slate-300 hover:bg-slate-800/30' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="bg-red-600 text-white hover:bg-red-700 border-none"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-y-auto ${dialogContentClass}`}>
          <DialogHeader>
            <DialogTitle className={`text-lg font-bold ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription className={`text-sm ${textMutedClass}`}>
              {editingProduct ? 'Update liquor product details' : 'Enter liquor product details and packaging configurations'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-2">
            {/* Basic Info Section */}
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kingfisher Premium Lager, Jack Daniel’s Tennessee Whiskey"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brand" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Brand / Manufacturer *</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Jack Daniel's, Corona"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Category</Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger className={isDarkBg ? "bg-[#090D1A] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="WY-JDN-75"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="barcode" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="8901234567004"
                className={inputClass}
              />
            </div>

            {/* Liquor Specs Section */}
            <div className={`col-span-2 pt-2 border-t mt-1 ${isDarkBg ? 'border-slate-800/60' : 'border-slate-200'}`}>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Liquor Specifications</h4>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bottleSize" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Bottle/Container Size</Label>
              <Input
                id="bottleSize"
                value={formData.bottleSize}
                onChange={(e) => setFormData({ ...formData, bottleSize: e.target.value })}
                placeholder="e.g., 750ml, 330ml, 20s Pack"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="abv" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Alcohol by Volume (ABV %)</Label>
              <Input
                id="abv"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.abv}
                onChange={(e) => setFormData({ ...formData, abv: e.target.value })}
                placeholder="e.g., 40.0"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="batchNumber" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Batch Number</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                placeholder="e.g., B-JD9011"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expiryDate" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="supplier" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Supplier Name</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g., Pernod Ricard India, Brown-Forman"
                className={inputClass}
              />
            </div>

            {/* Pricing Section */}
            <div className={`col-span-2 pt-2 border-t mt-1 ${isDarkBg ? 'border-slate-800/60' : 'border-slate-200'}`}>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Pricing</h4>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="costPrice" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Cost Price ({currency})</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sellingPrice" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Retail Price ({currency}) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                placeholder="0.00"
                className={inputClass}
              />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="mrp" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Maximum Retail Price (MRP) ({currency})</Label>
              <Input
                id="mrp"
                type="number"
                step="0.01"
                min="0"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                placeholder="Leave blank to match Retail Price"
                className={inputClass}
              />
            </div>

            {/* Inventory Packaging Section */}
            <div className={`col-span-2 pt-2 border-t mt-1 ${isDarkBg ? 'border-slate-800/60' : 'border-slate-200'}`}>
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4" />
                Inventory & Packaging Units
              </h4>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="measurementUnit" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Base Volume Unit</Label>
              <Select 
                value={formData.measurementUnit} 
                onValueChange={(v) => setFormData({ ...formData, measurementUnit: v })}
              >
                <SelectTrigger className={isDarkBg ? "bg-[#090D1A] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"}>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {MEASUREMENT_UNITS.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packageType" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Package Container</Label>
              <Select 
                value={formData.packageType} 
                onValueChange={(v) => setFormData({ ...formData, packageType: v })}
              >
                <SelectTrigger className={isDarkBg ? "bg-[#090D1A] border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"}>
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {PACKAGE_TYPES.map((pkg) => (
                    <SelectItem key={pkg.value} value={pkg.value}>{pkg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="packageSize" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Bottles Per Case / Items per Pack</Label>
              <Input
                id="packageSize"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.packageSize}
                onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                placeholder="e.g., 1 for single bottles, 12 for cases"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stockPackages" className={`text-xs font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>Total Stock (Case/Pack Quantity)</Label>
              <Input
                id="stockPackages"
                type="number"
                min="0"
                value={formData.stockPackages}
                onChange={(e) => setFormData({ ...formData, stockPackages: e.target.value })}
                placeholder="e.g., 10"
                className={inputClass}
              />
            </div>

            {/* Live Stock Preview */}
            <div className="col-span-2 mt-1">
              <div className={`border rounded-xl p-4 ${isDarkBg ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-500/5 border-amber-500/10'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <PackageCheck className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-amber-500 text-sm">Calculated Stock Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className={textMutedClass}>Total Packages:</span>
                    <span className={`ml-2 font-medium ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formData.stockPackages || 0} {packageLabel.toLowerCase()}s
                    </span>
                  </div>
                  <div>
                    <span className={textMutedClass}>Capacity per Package:</span>
                    <span className={`ml-2 font-medium ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>
                      {formData.packageSize || 0} {unitLabel}s
                    </span>
                  </div>
                  <div className={`col-span-2 pt-2 flex justify-between items-center border-t ${isDarkBg ? 'border-slate-800/60' : 'border-slate-200'}`}>
                    <span className={textMutedClass}>Total Base Volume Stock:</span>
                    <span className="font-bold text-base text-amber-550">
                      {totalStockPreview.toLocaleString()} {unitLabel}s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowProductDialog(false)} className={isDarkBg ? 'border-slate-800 text-slate-300 hover:bg-slate-800/30' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}>
              Cancel
            </Button>
            <Button onClick={handleSaveProduct} disabled={isSaving} className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-semibold border-none">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingProduct ? 'Update' : 'Add'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
