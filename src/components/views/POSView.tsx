'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useCartStore, useAuthStore, useOfflineStore, useSuspendedSalesStore, useCategoriesStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Search, 
  ScanBarcode, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Percent,
  Check,
  Loader2,
  AlertTriangle,
  Pause,
  Play,
  User,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  Settings,
  Maximize2,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { generateReceiptPDF } from '@/lib/pdf-utils'

interface ProductWithCategory extends Omit<Product, 'category'> {
  category?: { name: string; taxRate: number }
}

const QUICK_CATEGORIES = [
  'All Items',
  'Beer',
  'Whisky',
  'Vodka',
  'Rum',
  'Wine',
  'Gin',
  'Tequila',
  'Brandy',
  'Cigarettes',
  'Snacks',
  'Mixers',
]

// Unsplash high quality beverage images for products
const getProductImage = (name: string) => {
  const images: Record<string, string> = {
    'Kingfisher Premium Lager': 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=500&q=80',
    'Budweiser Premium': 'https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&w=500&q=80',
    'Corona Extra': 'https://images.unsplash.com/photo-1600788886242-5c96aabe3757?auto=format&fit=crop&w=500&q=80',
    'Jack Daniel’s Tennessee Whiskey': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=500&q=80',
    'Jameson Irish Whiskey': 'https://images.unsplash.com/photo-1569158062127-99a229540b3c?auto=format&fit=crop&w=500&q=80',
    'Black Dog Triple Gold Reserve': 'https://images.unsplash.com/photo-1582819509237-d5b75f20ab7a?auto=format&fit=crop&w=500&q=80',
    'Chivas Regal 12 Year': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80',
    'Smirnoff Triple Distilled': 'https://images.unsplash.com/photo-1550950158-d0d960dff51b?auto=format&fit=crop&w=500&q=80',
    'Absolut Vodka': 'https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?auto=format&fit=crop&w=500&q=80',
    'Grey Goose Vodka': 'https://images.unsplash.com/photo-1569158062127-99a229540b3c?auto=format&fit=crop&w=500&q=80',
    'Bacardi Carta Blanca': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80',
    'Old Monk Rum': 'https://images.unsplash.com/photo-1607622750671-6cd9a99eabd1?auto=format&fit=crop&w=500&q=80',
    'Sula Shiraz Cabernet': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=500&q=80',
    'Bombay Sapphire Gin': 'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?auto=format&fit=crop&w=500&q=80',
    'Patrón Silver Tequila': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?auto=format&fit=crop&w=500&q=80',
    'Hennessy VS Cognac': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=500&q=80',
    'Marlboro Gold Cigarettes': 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=500&q=80',
    'Lays Classic Salted Chips': 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80',
    'Fever-Tree Tonic Water': 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=500&q=80',
  }
  return images[name] || 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=500&q=80'
}

// Attribute labels mapping for liquor sizes
const getProductAttributes = (name: string) => {
  const attrs: Record<string, string> = {
    'Kingfisher Premium Lager': '650ml | 4.8% ABV',
    'Budweiser Premium': '650ml | 5.0% ABV',
    'Corona Extra': '330ml | 4.5% ABV',
    'Jack Daniel’s Tennessee Whiskey': '750ml | 40% ABV',
    'Jameson Irish Whiskey': '750ml | 40% ABV',
    'Black Dog Triple Gold Reserve': '750ml | 42.8% ABV',
    'Chivas Regal 12 Year': '750ml | 40% ABV',
    'Smirnoff Triple Distilled': '750ml | 37.5% ABV',
    'Absolut Vodka': '750ml | 40% ABV',
    'Grey Goose Vodka': '750ml | 40% ABV',
    'Bacardi Carta Blanca': '750ml | 37.5% ABV',
    'Old Monk Rum': '750ml | 42.8% ABV',
    'Sula Shiraz Cabernet': '750ml | 13.5% ABV',
    'Bombay Sapphire Gin': '750ml | 47% ABV',
    'Patrón Silver Tequila': '750ml | 40% ABV',
    'Hennessy VS Cognac': '750ml | 40% ABV',
    'Marlboro Gold Cigarettes': '20s Pack',
    'Lays Classic Salted Chips': '50g Pack',
    'Fever-Tree Tonic Water': '200ml Bottle',
  }
  return attrs[name] || '750ml'
}

export function POSView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ProductWithCategory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showDiscount, setShowDiscount] = useState(false)
  const [showSuspendDialog, setShowSuspendDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [discountInput, setDiscountInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('card')
  const [suspendName, setSuspendName] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryProducts, setCategoryProducts] = useState<ProductWithCategory[]>([])
  const [topSellers, setTopSellers] = useState<ProductWithCategory[]>([])
  const [allProducts, setAllProducts] = useState<ProductWithCategory[]>([])
  const [ageVerified, setAgeVerified] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<any | null>(null)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { user, store, settings } = useAuthStore()

  const isDarkBg = settings?.cardThemeMode === 'dark'
  const cardClass = isDarkBg ? 'bg-[#111726]/80 border-slate-800/80 shadow-md text-slate-100' : 'bg-white border-slate-200 shadow-sm text-slate-900'
  const cartSummaryClass = isDarkBg ? 'bg-[#111726] border-slate-800/80 shadow-lg text-slate-100' : 'bg-white border-slate-200 shadow-lg text-slate-900'
  const inputClass = isDarkBg ? 'bg-[#090D1A] border-slate-800 text-white focus-visible:ring-amber-500' : 'bg-white border-slate-250 text-slate-900 focus-visible:ring-amber-500'
  const innerCardClass = isDarkBg ? 'bg-[#090D1A]/50 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
  const textMutedClass = isDarkBg ? 'text-slate-400' : 'text-slate-500'
  const textSubTitleClass = isDarkBg ? 'text-slate-500 mt-1' : 'text-slate-400 mt-1'
  const textHeadingClass = isDarkBg ? 'text-white' : 'text-slate-900'
  const buttonOutlineClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
  const selectContentClass = isDarkBg ? 'bg-[#111726] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'

  // New age verification states
  const [showDobDialog, setShowDobDialog] = useState(false)
  const [dobInput, setDobInput] = useState('')
  const [showUnderageDialog, setShowUnderageDialog] = useState(false)
  const [managerPin, setManagerPin] = useState('')
  const [isOverriding, setIsOverriding] = useState(false)
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null)

  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0
    const today = new Date()
    const birthDate = new Date(dobString)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleConfirmOrderClick = () => {
    const needsAgeVerification = items.some(item => {
      const prod = allProducts.find(p => p.id === item.productId);
      return prod && ((prod.abv !== undefined && prod.abv > 0) || ['Whisky', 'Beer', 'Vodka', 'Rum', 'Wine', 'Gin', 'Tequila', 'Brandy', 'Cigarettes'].includes(prod.category?.name || ''));
    });

    const isAgeVerificationEnabled = settings?.enableAgeVerification ?? true;

    if (isAgeVerificationEnabled && needsAgeVerification) {
      if (settings?.requireDobBeforeCheckout) {
        setDobInput('');
        setShowDobDialog(true);
      } else {
        if (!ageVerified) {
          toast.error(`Age Verification Required! Please check ID scan (${settings?.minLegalAge || 21}+) and check the verified box.`);
          return;
        }
        setShowCheckout(true);
      }
    } else {
      setShowCheckout(true);
    }
  }

  const handleDobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dobInput) {
      toast.error('Please enter a valid Date of Birth');
      return;
    }

    const age = calculateAge(dobInput);
    setCalculatedAge(age);
    const minAge = settings?.minLegalAge || 21;

    setShowDobDialog(false);

    if (age >= minAge) {
      setAgeVerified(true);
      setShowCheckout(true);
      toast.success(`Age verified: ${age} years old. Proceeding.`);
    } else {
      setAgeVerified(false);
      setShowUnderageDialog(true);
    }
  }

  const handleManagerOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerPin) {
      toast.error('Please enter Manager PIN');
      return;
    }

    setIsOverriding(true);
    try {
      const response = await fetch('/api/auth/verify-manager-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: managerPin }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Manager override approved! Proceeding to checkout.');
        setAgeVerified(true);
        setShowUnderageDialog(false);
        setManagerPin('');
        setShowCheckout(true);
      } else {
        toast.error(data.error || 'Invalid PIN. Access denied.');
      }
    } catch (error) {
      toast.error('Error verifying override PIN. Please try again.');
    } finally {
      setIsOverriding(false);
    }
  }

  const handleAbortCheckout = () => {
    setShowUnderageDialog(false);
    setManagerPin('');
    setAgeVerified(false);
    toast.info('Checkout aborted.');
  }
  const { categories, setCategories } = useCategoriesStore()
  const { 
    items, 
    discountType, 
    discountValue,
    customerEmail,
    customerPhone,
    notes,
    addItem, 
    updateQuantity, 
    removeItem, 
    setDiscount,
    setCustomerEmail,
    setCustomerPhone,
    setNotes,
    clearCart, 
    getSubtotal, 
    getTaxAmount, 
    getDiscountAmount, 
    getTotal 
  } = useCartStore()
  const { isOnline, addOrder, setIsOnline } = useOfflineStore()
  const { suspendedSales, suspendSale, resumeSale, removeSuspendedSale } = useSuspendedSalesStore()

  const currency = settings?.currencySymbol || '₹'

  // Auto-focus search input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load all products on mount
  useEffect(() => {
    loadAllProducts()
    loadTopSellers()
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await authFetch('/api/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Load categories error:', error)
    }
  }

  const loadAllProducts = async () => {
    try {
      const response = await authFetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setAllProducts(data.data)
      }
    } catch (error) {
      console.error('Load products error:', error)
    }
  }

  const loadTopSellers = async () => {
    try {
      const response = await authFetch('/api/reports/top-products?days=30&limit=8')
      const data = await response.json()
      if (data.success && data.data) {
        const productIds = data.data.map((p: any) => p.productId).filter(Boolean)
        if (productIds.length > 0) {
          const productsRes = await authFetch('/api/products')
          const productsData = await productsRes.json()
          if (productsData.success) {
            const topProducts = productsData.data
              .filter((p: ProductWithCategory) => productIds.includes(p.id))
              .slice(0, 8)
            setTopSellers(topProducts)
          }
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setIsOnline])

  // Keyboard shortcut for search focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !showCheckout && !showDiscount && !showSuspendDialog && !showResumeDialog && !showCustomerDialog) {
        e.preventDefault()
        inputRef.current?.focus()
        setSelectedCategory(null)
      }
      if (e.key === 'Escape') {
        setShowCheckout(false)
        setShowDiscount(false)
        setShowSuspendDialog(false)
        setShowResumeDialog(false)
        setShowCustomerDialog(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCheckout, showDiscount, showSuspendDialog, showResumeDialog, showCustomerDialog])

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await authFetch(`/api/products/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.success) {
        setSearchResults(data.data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery)
      }
    }, 150)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, searchProducts])

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === 'All Items' || selectedCategory === categoryName) {
      setSelectedCategory(null)
      setCategoryProducts([])
      setSearchQuery('')
      setSearchResults([])
    } else {
      setSelectedCategory(categoryName)
      setSearchQuery('')
      setSearchResults([])
      const filtered = allProducts.filter((p: ProductWithCategory) => 
        p.category?.name?.toLowerCase() === categoryName.toLowerCase()
      )
      setCategoryProducts(filtered)
    }
    inputRef.current?.focus()
  }

  const handleAddToCart = (product: ProductWithCategory) => {
    const taxRate = product.category?.taxRate || settings?.defaultTaxRate || 10
    
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.sellingPrice,
      taxRate,
      stockAvailable: product.stockQuantity,
    })

    toast.success(`Added ${product.name} to cart`)
    if (searchQuery) {
      setSearchQuery('')
      setSearchResults([])
    }
    inputRef.current?.focus()
  }

  const handleQuickScan = () => {
    setBarcodeInput('')
    setShowBarcodeDialog(true)
  }

  const handleBarcodeSubmit = () => {
    const barcode = barcodeInput.trim()
    if (!barcode) return
    setShowBarcodeDialog(false)
    setBarcodeInput('')
    handleBarcodeScan(barcode)
  }

  const handleBarcodeScan = async (barcode: string) => {
    try {
      const response = await authFetch(`/api/products/barcode/${encodeURIComponent(barcode)}`)
      const data = await response.json()
      
      if (data.success && data.data) {
        handleAddToCart(data.data)
      } else {
        toast.error('Product not found')
      }
    } catch (error) {
      toast.error('Error scanning product')
    }
  }

  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput)
    if (isNaN(value) || value <= 0) {
      toast.error('Invalid discount value')
      return
    }

    if (discountType === 'percentage' && value > (settings?.maxDiscountPercent || 25)) {
      toast.error(`Maximum discount is ${settings?.maxDiscountPercent || 25}%`)
      return
    }

    setDiscount(discountType || 'flat', value)
    setShowDiscount(false)
    toast.success('Discount applied')
  }

  const handleSuspendSale = () => {
    if (items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    if (!suspendName.trim()) {
      toast.error('Please enter a name for this sale')
      return
    }

    suspendSale(
      suspendName,
      items,
      discountType,
      discountValue,
      customerEmail,
      customerPhone,
      notes
    )
    
    clearCart()
    setSuspendName('')
    setShowSuspendDialog(false)
    toast.success('Sale suspended')
  }

  const handleResumeSale = (saleId: string) => {
    const sale = resumeSale(saleId)
    if (sale) {
      clearCart()
      sale.items.forEach(item => {
        addItem(item)
      })
      setDiscount(sale.discountType || 'flat', sale.discountValue)
      setCustomerEmail(sale.customerEmail)
      setCustomerPhone(sale.customerPhone)
      setNotes(sale.notes)
      setShowResumeDialog(false)
      toast.success('Sale resumed')
    }
  }

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    // Check stock
    for (const item of items) {
      if (item.quantity > item.stockAvailable) {
        toast.error(`Not enough stock for ${item.productName}`)
        return
      }
    }

    setIsProcessing(true)

    const orderData = {
      items,
      subtotal: getSubtotal(),
      taxAmount: getTaxAmount(),
      discountAmount: getDiscountAmount(),
      discountType,
      discountValue,
      totalAmount: getTotal(),
      paymentMethod,
      customerEmail,
      customerPhone,
      notes,
    }

    try {
      const response = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Order completed!')
        setCompletedOrder(data.data)
        setShowCheckout(false)
        setShowReceiptDialog(true)
      } else {
        toast.error(data.error || 'Failed to process order')
      }
    } catch (error) {
      if (!isOnline) {
        const offlineOrder = {
          id: `offline_${Date.now()}`,
          ...orderData,
          invoiceNumber: `OFF-2026-${Date.now().toString().slice(-4)}`,
          createdAt: Date.now(),
          synced: false,
          items: orderData.items.map(item => ({
            ...item,
            lineTotal: item.unitPrice * item.quantity
          }))
        }
        addOrder(offlineOrder)
        toast.success('Order saved offline. Will sync when online.')
        setCompletedOrder(offlineOrder)
        setShowCheckout(false)
        setShowReceiptDialog(true)
      } else {
        toast.error('Failed to process order')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const subtotal = getSubtotal()
  const taxAmount = getTaxAmount()
  const discountAmount = getDiscountAmount()
  const total = getTotal()

  // Determine which products to show
  const displayProducts = searchQuery ? searchResults : selectedCategory ? categoryProducts : allProducts

  const categoryList = ['All Items', ...categories.map(c => c.name)]

  const handleDownloadPDF = (order: any) => {
    const success = generateReceiptPDF(order, store, settings)
    if (success) {
      toast.success('PDF Receipt saved successfully!')
    } else {
      toast.error('Could not generate PDF receipt')
    }
  }

  const handlePrint = () => {
    if (!completedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocker prevented printing. Please allow popups.');
      return;
    }
    
    const storeName = store?.name || 'BarrelFlow Spirits';
    const storePhone = store?.phone || '+1 (555) 728-1928';
    const storeAddress = store?.address || 'Louisville Whiskey Row, KY';
    const receiptHeader = settings?.receiptHeader || 'Premium Wines & Fine Spirits Boutique';
    const receiptFooter = settings?.receiptFooter || 'Statutory Warning: Alcohol is injurious to health. Please drink responsibly.';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Receipt - ${completedOrder.invoiceNumber}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: #000;
              margin: 10px;
              padding: 0;
              width: 76mm;
              background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .space-y-1 > * { margin-bottom: 4px; }
            .my-2 { margin-top: 8px; margin-bottom: 8px; }
            .border-b { border-bottom: 1px dashed #000; }
            .grid { display: grid; }
            .grid-2 { grid-template-columns: 1fr 1fr; }
            .item-row { grid-template-columns: 6fr 2fr 4fr; }
            .flex-between { display: flex; justify-content: space-between; }
            .mt-4 { margin-top: 16px; }
            .text-lg { font-size: 15px; }
            .uppercase { text-transform: uppercase; }
            @page {
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h3 class="text-lg font-bold" style="margin:0; letter-spacing: 1px;">${storeName.toUpperCase()}</h3>
            <p style="margin:2px 0; font-size: 10px;">${receiptHeader}</p>
            <p style="margin:2px 0; font-size: 9px;">${storeAddress}</p>
            <p style="margin:2px 0; font-size: 9px;">Phone: ${storePhone}</p>
          </div>

          <div class="border-b my-2"></div>

          <div class="grid grid-2" style="font-size: 10px; line-height: 1.4;">
            <div>Invoice: ${completedOrder.invoiceNumber}</div>
            <div class="text-right">Date: ${new Date(completedOrder.createdAt).toLocaleDateString()}</div>
            <div>Payment: <span class="uppercase font-bold">${completedOrder.paymentMethod}</span></div>
            <div class="text-right">Time: ${new Date(completedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <div class="border-b my-2"></div>

          ${(completedOrder.customerPhone || completedOrder.customerEmail) ? `
            <div style="font-size: 9px; line-height: 1.4; padding: 4px; border: 1px solid #ccc; margin-bottom: 8px;">
              <div class="font-bold">Customer Details:</div>
              ${completedOrder.customerPhone ? `<div>Phone: ${completedOrder.customerPhone}</div>` : ''}
              ${completedOrder.customerEmail ? `<div>Email: ${completedOrder.customerEmail}</div>` : ''}
            </div>
            <div class="border-b my-2"></div>
          ` : ''}

          <div class="font-bold grid item-row" style="font-size: 10px; margin-bottom: 6px;">
            <div>Item Description</div>
            <div class="text-center">Qty</div>
            <div class="text-right">Total</div>
          </div>
          
          <div style="font-size: 10px; line-height: 1.6;">
            ${completedOrder.items.map((item: any) => `
              <div class="grid item-row" style="margin-bottom: 4px;">
                <div>
                  <div class="font-bold">${item.productName}</div>
                  <div style="font-size: 8px; color: #555;">${currency}${item.unitPrice.toFixed(2)}</div>
                </div>
                <div class="text-center">x${item.quantity}</div>
                <div class="text-right font-bold">${currency}${item.lineTotal.toFixed(2)}</div>
              </div>
            `).join('')}
          </div>

          <div class="border-b my-2"></div>

          <div style="line-height: 1.5; font-size: 10px;">
            <div class="flex-between">
              <span>Subtotal</span>
              <span>${currency}${completedOrder.subtotal.toFixed(2)}</span>
            </div>
            <div class="flex-between">
              <span>VAT / Tax amount</span>
              <span>${currency}${completedOrder.taxAmount.toFixed(2)}</span>
            </div>
            ${completedOrder.discountAmount > 0 ? `
              <div class="flex-between" style="font-weight: bold;">
                <span>Discount</span>
                <span>-${currency}${completedOrder.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="border-b my-1"></div>
            <div class="flex-between font-bold" style="font-size: 12px; margin-top: 4px;">
              <span>Total Amount</span>
              <span>${currency}${completedOrder.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="border-b my-2"></div>

          <div class="text-center" style="font-size: 8px; line-height: 1.4; margin-top: 10px;">
            <p style="font-style: italic; font-weight: bold; margin: 4px 0;">${receiptFooter}</p>
            <p class="font-bold" style="margin: 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Thank you for your purchase!</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    printWindow.onafterprint = () => {
      printWindow.close();
    };
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }


  const renderCartSummary = () => (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className={`text-[17px] font-extrabold ${textHeadingClass}`}>Cart Summary</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => toast.info('Expanded Cart View')}>
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${textMutedClass}`}>Bill No: <span className={isDarkBg ? 'text-slate-200' : 'text-slate-700'}>BF-9281</span></span>
          <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Active Shift
          </span>
        </div>
      </div>

      {/* Total Items count badge */}
      <div className={`text-xs font-bold mb-4 p-3 rounded-2xl flex items-center justify-between border ${innerCardClass}`}>
        <span>Total Quantities</span>
        <span className="bg-amber-500 text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold">
          {items.reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      </div>

      {/* Scrollable Cart Items List */}
      <ScrollArea className="flex-1 min-h-[220px] mb-4 pr-1">
        {items.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-48 ${textMutedClass}`}>
            <ShoppingCart className="w-12 h-12 mb-3 text-slate-400 opacity-60" />
            <p className="text-xs font-semibold">Order Cart is Empty</p>
            <p className="text-[11px] opacity-70 mt-0.5">Select liquor products on the left</p>
          </div>
        ) : (
          <div className={`divide-y ${isDarkBg ? 'divide-slate-800' : 'divide-slate-200'}`}>
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                {/* Item Image */}
                <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border ${isDarkBg ? 'bg-[#090D1A] border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                  <img 
                    src={getProductImage(item.productName)} 
                    alt={item.productName} 
                    className="object-cover w-full h-full"
                  />
                </div>
                {/* Name and Attributes */}
                <div className="flex-1 min-w-0">
                  <h5 className={`text-xs font-bold truncate ${textHeadingClass}`}>{item.productName}</h5>
                  <p className={`text-[10px] font-medium mt-0.5 ${textMutedClass}`}>
                    {getProductAttributes(item.productName)}
                  </p>
                  <span className="text-xs font-extrabold text-amber-500 mt-1 block">
                    {currency}{item.unitPrice.toFixed(2)}
                  </span>
                </div>
                {/* Quantity and Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-500/10"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className={`text-[11px] font-bold min-w-10 text-center px-2 py-1 rounded-lg border ${innerCardClass}`}>x{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Age verification badge checkbox */}
      {(settings?.enableAgeVerification ?? true) && !settings?.requireDobBeforeCheckout && (
        <div 
          onClick={() => setAgeVerified(!ageVerified)}
          className={`flex items-center gap-3 p-3.5 rounded-2xl border mb-4 select-none cursor-pointer transition-colors ${innerCardClass} ${isDarkBg ? 'hover:bg-[#0E1424]' : 'hover:bg-slate-100'}`}
        >
          <input 
            type="checkbox" 
            checked={ageVerified} 
            onChange={(e) => setAgeVerified(e.target.checked)} 
            className="w-4.5 h-4.5 rounded text-amber-500 bg-slate-900 border-slate-700 accent-amber-500 focus:ring-amber-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()} 
          />
          <div className="text-left">
            <p className={`text-xs font-bold ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>ID Verification ({settings?.minLegalAge || 21}+ Checked)</p>
            <p className={`text-[9px] ${textMutedClass}`}>Scan ID or check birthdate before billing alcohol</p>
          </div>
          {ageVerified ? (
            <Badge className="ml-auto bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">Verified</Badge>
          ) : (
            <Badge className="ml-auto bg-rose-600/20 text-rose-400 border border-rose-500/20 text-[9px] font-bold">Required</Badge>
          )}
        </div>
      )}

      {(settings?.enableAgeVerification ?? true) && settings?.requireDobBeforeCheckout && (
        <div 
          className={`flex items-center gap-3 p-3.5 rounded-2xl border mb-4 select-none ${innerCardClass}`}
        >
          <Shield className="w-5 h-5 text-amber-500" />
          <div className="text-left">
            <p className={`text-xs font-bold ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>DOB Check Required</p>
            <p className={`text-[9px] ${textMutedClass}`}>Will prompt for birthdate during checkout</p>
          </div>
          {ageVerified ? (
            <Badge className="ml-auto bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">Verified</Badge>
          ) : (
            <Badge className="ml-auto bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold">DOB Prompt</Badge>
          )}
        </div>
      )}

      {/* Payment Methods */}
      <div className="mb-4">
        <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2.5 ${textMutedClass}`}>Payment Method</h4>
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => setPaymentMethod('card')}
            className={`rounded-2xl h-11 flex items-center justify-center gap-1.5 border text-xs font-bold transition-all cursor-pointer ${
              paymentMethod === 'card'
                ? 'bg-amber-500 border-amber-500 text-black shadow-sm hover:bg-amber-600'
                : buttonOutlineClass
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 16.5a1.5 1.5 0 011.5-1.5h1.5a1.5 1.5 0 011.5 1.5v1.5a1.5 1.5 0 01-1.5 1.5H15a1.5 1.5 0 01-1.5-1.5v-1.5z" />
            </svg>
            <span>QR</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setPaymentMethod('cash')}
            className={`rounded-2xl h-11 flex items-center justify-center gap-1.5 border text-xs font-bold transition-all cursor-pointer ${
              paymentMethod === 'cash'
                ? 'bg-amber-500 border-amber-500 text-black shadow-sm hover:bg-amber-600'
                : buttonOutlineClass
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setPaymentMethod('upi')}
            className={`rounded-2xl h-11 flex items-center justify-center gap-1.5 border text-xs font-bold transition-all cursor-pointer ${
              paymentMethod === 'upi'
                ? 'bg-amber-500 border-amber-500 text-black shadow-sm hover:bg-amber-600'
                : buttonOutlineClass
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Wallet</span>
          </Button>
        </div>
      </div>

      {/* Invoice Summary Details */}
      <div className={`border-t pt-3.5 space-y-3 mb-5 ${isDarkBg ? 'border-slate-800/80' : 'border-slate-200'}`}>
        <div className={`flex justify-between text-xs font-semibold ${textMutedClass}`}>
          <span>Subtotal</span>
          <span className={isDarkBg ? 'text-slate-200' : 'text-slate-800'}>{currency}{subtotal.toFixed(2)}</span>
        </div>

        <div 
          className={`flex justify-between text-xs font-semibold cursor-pointer p-1.5 rounded-lg -mx-1.5 transition-colors animate-pulse ${isDarkBg ? 'text-slate-400 hover:bg-slate-800/50' : 'text-slate-500 hover:bg-slate-100'}`}
          onClick={() => {
            setDiscountInput(discountValue?.toString() || '')
            setShowDiscount(true)
          }}
        >
          <span className={`flex items-center gap-1 ${textMutedClass}`}>
            <Percent className="w-3.5 h-3.5" /> Discount
          </span>
          <span className="text-amber-600 font-bold">
            {discountAmount > 0 ? `-${currency}${discountAmount.toFixed(2)}` : 'Add Discount'}
          </span>
        </div>

        <div className={`flex justify-between text-xs font-semibold ${textMutedClass}`}>
          <span>VAT (18% Liquor Tax)</span>
          <span className={isDarkBg ? 'text-slate-200' : 'text-slate-800'}>{currency}{taxAmount.toFixed(2)}</span>
        </div>

        <Separator className={isDarkBg ? 'bg-slate-800/60' : 'bg-slate-200'} />
        
        <div className="flex justify-between items-baseline pt-1">
          <span className={`text-sm font-bold ${isDarkBg ? 'text-slate-300' : 'text-slate-600'}`}>Total Bill</span>
          <span className="text-xl font-extrabold text-amber-500">{currency}{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 rounded-full h-11 text-xs font-bold transition-all cursor-pointer"
          onClick={() => {
            if (items.length > 0 && confirm('Discard current cart?')) {
              clearCart()
              setAgeVerified(false)
              toast.info('Cart cleared')
              setIsCartOpen(false)
            }
          }}
          disabled={items.length === 0}
        >
          Cancel
        </Button>

        <Button
          variant="outline"
          className={`rounded-full h-11 text-xs font-bold transition-all cursor-pointer ${isDarkBg ? 'border-slate-800 bg-[#090D1A] text-slate-400 hover:text-white' : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50 hover:text-slate-900'}`}
          onClick={() => setShowCustomerDialog(true)}
        >
          Customer
        </Button>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-11 text-xs font-bold border-none shadow-sm transition-all cursor-pointer"
          onClick={handleConfirmOrderClick}
          disabled={items.length === 0}
        >
          Confirm Order
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#090D1A] flex flex-col md:flex-row gap-6 p-6 text-slate-100 font-sans">
      {/* Left Panel - Search, Categories & Products Grid */}
      <div className="w-full md:flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Input Bar */}
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by Brand, Category, Barcode..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedCategory(null)
              }}
              className={`pl-11 pr-10 h-11 rounded-full text-sm focus-visible:ring-2 focus-visible:ring-amber-500 w-full ${isDarkBg ? 'border-slate-800 bg-[#111726] text-white' : 'border-slate-200 bg-white text-slate-900 shadow-sm'}`}
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <Button 
              onClick={() => {
                if (items.length > 0 && confirm('Discard current cart to start a new sale?')) {
                  clearCart()
                  setAgeVerified(false)
                }
                toast.success('New sale active')
                inputRef.current?.focus()
              }} 
              className="bg-amber-500 hover:bg-amber-600 text-black rounded-full px-5 h-11 text-xs font-bold flex items-center gap-1.5 shadow-sm border-none transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sale</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              className={`h-11 w-11 rounded-full ${buttonOutlineClass}`}
              onClick={handleQuickScan}
            >
              <ScanBarcode className="w-4.5 h-4.5" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              className={`h-11 w-11 rounded-full ${buttonOutlineClass}`}
              onClick={() => setShowResumeDialog(true)}
            >
              <Pause className="w-4 h-4" />
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              className={`h-11 w-11 rounded-full ${buttonOutlineClass}`}
              onClick={() => toast.info('System Settings Opened')}
            >
              <Settings className="w-4.5 h-4.5" />
            </Button>

            {/* Cashier profile tag */}
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${cardClass}`}>
              <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] font-bold text-black">JM</span>
              </div>
              <div className="text-left hidden sm:block">
                <div className={`text-[11px] font-bold leading-none ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>Jason Miller</div>
                <div className={`text-[9px] capitalize ${textMutedClass}`}>Cashier</div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 ml-1" />
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6 overflow-x-auto pb-1 scrollbar-none flex-1">
            {categoryList.map((category) => {
              const isActive = selectedCategory === category || (category === 'All Items' && !selectedCategory);
              return (
                <button
                  key={category}
                  onClick={() => handleCategorySelect(category)}
                  className={`text-sm font-semibold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    isActive ? 'text-amber-400 font-extrabold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{category}</span>
                  {category !== 'All Items' && <ChevronDown className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />}
                </button>
              )
            })}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            className={`h-9 w-9 rounded-full flex-shrink-0 ${buttonOutlineClass}`}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Products Grid */}
        {displayProducts.length > 0 ? (
          <ScrollArea className="flex-1 min-h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayProducts.map((product) => (
                <div 
                  key={product.id} 
                  className={`rounded-3xl p-4 border flex flex-col relative hover:border-amber-500/30 transition-all duration-200 group shadow-md ${cardClass}`}
                >
                  {/* Stock Tag */}
                  <span className={`absolute top-7 right-7 z-10 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm ${
                    product.stockQuantity <= 15 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {product.stockQuantity} Left
                  </span>

                  {/* Product Image */}
                  <div className={`w-full h-40 rounded-2xl mb-3.5 overflow-hidden flex items-center justify-center relative ${isDarkBg ? 'bg-[#0B0F19]' : 'bg-slate-100'}`}>
                    <img 
                      src={getProductImage(product.name)} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex flex-col min-w-0">
                      <h4 className={`text-[13px] font-extrabold truncate ${textHeadingClass}`}>{product.name}</h4>
                      <p className={`text-[10px] font-medium mt-0.5 ${textMutedClass}`}>
                        Brand: <span className={`font-bold ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>{product.brand || 'Premium'}</span> • {product.category?.name || 'Beverage'}
                      </p>
                    </div>
                  </div>

                  {/* Bottle size & ABV */}
                  <div className={`flex justify-between items-center text-[10px] font-semibold mb-3 ${textMutedClass}`}>
                    <span>Size: <span className={isDarkBg ? 'text-slate-300' : 'text-slate-700'}>{product.bottleSize || '750ml'}</span></span>
                    {product.abv !== undefined && product.abv > 0 && (
                      <span className="text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 font-bold">{product.abv}% ABV</span>
                    )}
                  </div>

                  {/* Price Row */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs ${textMutedClass}`}>MRP / Unit</span>
                    <span className="text-[15px] font-extrabold text-amber-500">
                      {currency}{product.sellingPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Cart Action Buttons */}
                  <div className="flex items-center gap-2 mt-auto w-full">
                    <Button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black rounded-full py-1.5 h-10 font-extrabold text-xs border-none shadow-none flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      + Add to Cart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
	                      className={`h-10 w-10 rounded-full shadow-none flex items-center justify-center cursor-pointer border ${isDarkBg ? 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white' : 'border-slate-200 bg-slate-50 text-slate-650 hover:bg-slate-100'}`}
	                      onClick={() => {
	                        const taxRate = product.category?.taxRate || settings?.defaultTaxRate || 10
	                        addItem({
	                          productId: product.id,
	                          productName: product.name,
	                          quantity: 6,
	                          unitPrice: product.sellingPrice,
	                          taxRate,
	                          stockAvailable: product.stockQuantity,
	                        })
	                        toast.success(`Added 6 x ${product.name} to cart`)
	                      }}
	                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className={`flex-1 flex flex-col items-center justify-center rounded-3xl p-8 border ${cardClass}`}>
            <ShoppingCart className="w-16 h-16 text-slate-400 opacity-60 mb-4 animate-pulse" />
            <p className="text-lg font-bold">No liquor items loaded</p>
            <p className={`text-sm mt-1 ${textMutedClass}`}>Please check your inventory settings.</p>
          </div>
        )}
      </div>

      {/* Right Panel - Cart Summary (Visible on Desktop only, sticky positioning) */}
      <div className={`hidden md:flex md:w-[320px] lg:w-[360px] xl:w-[400px] flex-shrink-0 rounded-3xl border shadow-lg md:sticky md:top-6 md:self-start md:max-h-[calc(100vh-48px)] flex-col ${cartSummaryClass}`}>
        {renderCartSummary()}
      </div>

      {/* Cart Summary (Visible on mobile/tablet below md, collapses below products grid) */}
      <div className={`md:hidden w-full rounded-3xl border shadow-lg mt-6 ${cartSummaryClass}`}>
        {renderCartSummary()}
      </div>

      {/* Floating Mobile Cart Trigger Button (opens Drawer) */}
      {items.length > 0 && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-black rounded-full px-5 py-6 font-extrabold shadow-lg flex items-center gap-2 border-none"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>View Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})</span>
            <span className="bg-black/10 px-2 py-0.5 rounded-full text-xs font-bold">
              {currency}{total.toFixed(2)}
            </span>
          </Button>
        </div>
      )}

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="right" className={`w-full sm:max-w-md p-0 flex flex-col h-full ${cartSummaryClass}`}>
          {renderCartSummary()}
        </SheetContent>
      </Sheet>

      {/* Suspend Sale Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Sale</DialogTitle>
            <DialogDescription>
              Save this sale to resume later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-name">Sale Name *</Label>
              <Input
                id="suspend-name"
                placeholder="e.g., Customer waiting for card"
                value={suspendName}
                onChange={(e) => setSuspendName(e.target.value)}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{currency}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Cancel</Button>
            <Button onClick={handleSuspendSale}>Suspend Sale</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resume Sale Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspended Sales</DialogTitle>
            <DialogDescription>
              Select a suspended sale to resume
            </DialogDescription>
          </DialogHeader>
          {suspendedSales.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Pause className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No suspended sales</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {suspendedSales.map((sale) => (
                  <div 
                    key={sale.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  >
                    <div 
                      className="flex-1"
                      onClick={() => handleResumeSale(sale.id)}
                    >
                      <p className="font-medium">{sale.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sale.items.length} items • {currency}
                        {sale.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSuspendedSale(sale.id)
                        toast.success('Suspended sale removed')
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResumeDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Customer</DialogTitle>
            <DialogDescription>
              Add customer details for this sale (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone</Label>
              <Input
                id="customer-phone"
                type="tel"
                placeholder="+1 555-019-2834"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email-dialog">Email</Label>
              <Input
                id="customer-email-dialog"
                type="email"
                placeholder="customer@email.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCustomerPhone('')
              setCustomerEmail('')
              setShowCustomerDialog(false)
              toast.info('Customer unassigned')
            }}>
              Clear
            </Button>
            <Button onClick={() => {
              setShowCustomerDialog(false)
              toast.success('Customer details updated')
            }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={showDiscount} onOpenChange={setShowDiscount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup 
              value={discountType || 'flat'} 
              onValueChange={(v) => setDiscount(v as 'flat' | 'percentage', discountValue || 0)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="flat" id="flat" />
                <Label htmlFor="flat" className="flex items-center gap-1 cursor-pointer">
                  <span className="font-bold">{currency}</span> Flat Amount
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="flex items-center gap-1 cursor-pointer">
                  <Percent className="w-4 h-4" /> Percentage
                </Label>
              </div>
            </RadioGroup>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
              />
              <Button onClick={handleApplyDiscount}>Apply</Button>
            </div>
            {discountType === 'percentage' && (
              <p className="text-xs text-muted-foreground">
                Maximum discount allowed: {settings?.maxDiscountPercent || 25}%
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>
              Review the order and select payment method
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items ({items.length})</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (10%)</span>
                <span>{currency}{taxAmount.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>Discount</span>
                  <span>-{currency}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'card' | 'upi')}>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center justify-center p-3 rounded-lg border-2 data-[state=checked]:border-primary cursor-pointer" data-state={paymentMethod === 'card' ? 'checked' : 'unchecked'} onClick={() => setPaymentMethod('card')}>
                    <RadioGroupItem value="card" id="card" className="sr-only" />
                    <Label htmlFor="card" className="flex flex-col items-center cursor-pointer">
                      <CreditCard className="w-6 h-6 mb-1" />
                      <span className="text-sm">QR Code / Card</span>
                    </Label>
                  </div>
                  <div className="flex items-center justify-center p-3 rounded-lg border-2 data-[state=checked]:border-primary cursor-pointer" data-state={paymentMethod === 'cash' ? 'checked' : 'unchecked'} onClick={() => setPaymentMethod('cash')}>
                    <RadioGroupItem value="cash" id="cash" className="sr-only" />
                    <Label htmlFor="cash" className="flex flex-col items-center cursor-pointer">
                      <Banknote className="w-6 h-6 mb-1" />
                      <span className="text-sm">Cash</span>
                    </Label>
                  </div>
                  <div className="flex items-center justify-center p-3 rounded-lg border-2 data-[state=checked]:border-primary cursor-pointer" data-state={paymentMethod === 'upi' ? 'checked' : 'unchecked'} onClick={() => setPaymentMethod('upi')}>
                    <RadioGroupItem value="upi" id="upi" className="sr-only" />
                    <Label htmlFor="upi" className="flex flex-col items-center cursor-pointer">
                      <Smartphone className="w-6 h-6 mb-1" />
                      <span className="text-sm">Wallet / UPI</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Customer Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email (optional)</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="customer@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone (optional)</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="+1 555-019-2834"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckout(false)}>
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Complete Sale
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={(open) => {
        if (!open) {
          clearCart()
          setAgeVerified(false)
          setCompletedOrder(null)
          setShowReceiptDialog(false)
        }
      }}>
        <DialogContent className="sm:max-w-md bg-[#0F1322] border-slate-800 text-slate-100 p-0 overflow-hidden">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #print-receipt-area, #print-receipt-area * {
                visibility: visible;
              }
              #print-receipt-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm;
                background: white !important;
                color: black !important;
                padding: 10px !important;
              }
              #print-receipt-area .text-white {
                color: black !important;
              }
              #print-receipt-area .text-slate-400 {
                color: #555555 !important;
              }
              #print-receipt-area .border-slate-800 {
                border-color: #cccccc !important;
              }
              #print-receipt-area button, #print-receipt-area .no-print {
                display: none !important;
              }
            }
          `}</style>
          
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-white text-xl font-bold">Order Invoice Completed</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Preview and save your transaction invoice
            </DialogDescription>
          </DialogHeader>

          {completedOrder && (
            <div className="p-6 space-y-6">
              {/* Receipt Preview Box */}
              <ScrollArea className="max-h-[380px] bg-[#070A12] border border-slate-800/80 rounded-2xl p-5 shadow-inner">
                <div id="print-receipt-area" className="space-y-4 font-sans text-xs text-slate-200">
                  {/* Shop Details */}
                  <div className="text-center space-y-1">
                    {store?.logoUrl && (
                      <div className="flex justify-center mb-2">
                        <img src={store.logoUrl} alt="Store Logo" className="w-10 h-10 rounded-lg object-cover" />
                      </div>
                    )}
                    <h3 className="text-base font-extrabold text-white tracking-wide">{store?.name?.toUpperCase() || 'BARRELFLOW SPIRITS'}</h3>
                    <p className="text-[10px] text-slate-400">{settings?.receiptHeader || 'Premium Wines & Fine Spirits Boutique'}</p>
                    <p className="text-[9px] text-slate-500">{store?.address || 'Louisville Whiskey Row, KY'}</p>
                    <p className="text-[9px] text-slate-500">Phone: {store?.phone || '+1 (555) 728-1928'}</p>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-y-1.5 text-[10px] text-slate-350">
                    <div><span className="text-slate-500">Invoice:</span> {completedOrder.invoiceNumber}</div>
                    <div className="text-right"><span className="text-slate-500">Date:</span> {new Date(completedOrder.createdAt).toLocaleDateString()}</div>
                    <div><span className="text-slate-500">Payment:</span> <span className="uppercase font-bold text-amber-500">{completedOrder.paymentMethod}</span></div>
                    <div className="text-right"><span className="text-slate-500">Time:</span> {new Date(completedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Customer details if present */}
                  {(completedOrder.customerPhone || completedOrder.customerEmail) && (
                    <div className="space-y-0.5 text-[9px] text-slate-400 bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                      <p className="font-bold text-slate-300">Customer Details:</p>
                      {completedOrder.customerPhone && <p>Phone: {completedOrder.customerPhone}</p>}
                      {completedOrder.customerEmail && <p>Email: {completedOrder.customerEmail}</p>}
                    </div>
                  )}

                  {/* Table Items */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-1 text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                      <div className="col-span-6">Item</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-4 text-right">Total</div>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                      {completedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 gap-1 text-[10px] items-center text-slate-200">
                          <div className="col-span-6 truncate font-medium">
                            <p className="truncate">{item.productName}</p>
                            <p className="text-[8px] text-slate-400">{currency}{item.unitPrice.toFixed(2)}</p>
                          </div>
                          <div className="col-span-2 text-center text-slate-400">x{item.quantity}</div>
                          <div className="col-span-4 text-right font-bold">{currency}{item.lineTotal.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Price Summary */}
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>{currency}{completedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>VAT (Tax)</span>
                      <span>{currency}{completedOrder.taxAmount.toFixed(2)}</span>
                    </div>
                    {completedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-amber-500 font-medium">
                        <span>Discount</span>
                        <span>-{currency}{completedOrder.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="bg-slate-800/50 my-1" />
                    <div className="flex justify-between text-xs font-extrabold text-white pt-0.5">
                      <span className="text-slate-300">Total Amount</span>
                      <span className="text-amber-500">{currency}{completedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  {/* Warning and message */}
                  <div className="text-center space-y-1 text-[8px] text-slate-500 leading-normal">
                    <p className="font-semibold italic">{settings?.receiptFooter || 'Statutory Warning: Alcohol is injurious to health. Please drink responsibly.'}</p>
                    <p className="font-bold text-slate-400 uppercase tracking-wide">Thank you for your purchase!</p>
                  </div>
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pb-2">
                <Button
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-700 text-white rounded-full h-11 text-xs font-bold transition-all border border-slate-700 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.82l-.24-2.08A1.85 1.85 0 018.32 9.87h7.36a1.85 1.85 0 011.84 1.87l-.24 2.08m-10.6 0a1.85 1.85 0 001.84 1.87h7.36a1.85 1.85 0 001.84-1.87m-10.6 0H4.5m10.6 0h4.4m-12-6v-3.75C3 3.656 3.656 3 4.5 3h15c.844 0 1.5.656 1.5 1.5V7.87M9 16.5v3.75c0 .844.656 1.5 1.5 1.5h3c.844 0 1.5-.656 1.5-1.5V16.5" />
                  </svg>
                  <span>Print Receipt</span>
                </Button>

                <Button
                  onClick={() => handleDownloadPDF(completedOrder)}
                  className="bg-amber-500 hover:bg-amber-600 text-black rounded-full h-11 text-xs font-bold transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download PDF</span>
                </Button>
              </div>

              <Button
                onClick={() => {
                  clearCart()
                  setAgeVerified(false)
                  setCompletedOrder(null)
                  setShowReceiptDialog(false)
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-11 text-xs font-bold border-none transition-all cursor-pointer"
              >
                Start New Sale
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Dialog */}
      <Dialog open={showBarcodeDialog} onOpenChange={setShowBarcodeDialog}>
        <DialogContent className="sm:max-w-md bg-[#151C2C] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-amber-500" />
              Barcode or SKU
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a barcode or SKU to add the matching product to the cart.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleBarcodeSubmit()
            }}
            className="space-y-4 py-3"
          >
            <div className="space-y-2">
              <Label htmlFor="barcode-input" className="text-slate-300">Barcode / SKU</Label>
              <Input
                id="barcode-input"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
                className="bg-[#0B0F19] border-slate-800 text-white focus-visible:ring-amber-500"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBarcodeDialog(false)} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Add Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DOB Dialog */}
      <Dialog open={showDobDialog} onOpenChange={setShowDobDialog}>
        <DialogContent className="sm:max-w-md bg-[#151C2C] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500 animate-pulse" />
              Compliance DOB Check
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Customer is purchasing age-restricted products. Enter customer birthdate to verify legal purchase age of {settings?.minLegalAge || 21}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDobSubmit} className="space-y-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="dob-input" className="text-slate-300">Customer Birthdate</Label>
              <Input
                id="dob-input"
                type="date"
                required
                value={dobInput}
                onChange={(e) => setDobInput(e.target.value)}
                className="bg-[#0B0F19] border-slate-800 text-white text-base focus-visible:ring-amber-500 w-full"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDobDialog(false)} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                Verify Age
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Underage Warning Dialog */}
      <Dialog open={showUnderageDialog} onOpenChange={(open) => {
        if (!open) handleAbortCheckout()
      }}>
        <DialogContent className="sm:max-w-md bg-[#151C2C] border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-500">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
              Underage Customer Blocked
            </DialogTitle>
            <DialogDescription className="text-rose-200/85 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mt-2 text-xs">
              Customer age ({calculatedAge} years) is below the minimum legal purchase age of {settings?.minLegalAge || 21}. Checkout is blocked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <form onSubmit={handleManagerOverride} className="space-y-3">
              <Label htmlFor="manager-pin" className="text-slate-300 text-xs">Require Manager Override PIN to bypass restriction</Label>
              <div className="flex gap-2">
                <Input
                  id="manager-pin"
                  type="password"
                  placeholder="Manager PIN"
                  maxLength={4}
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="bg-[#0B0F19] border-slate-800 text-white text-center text-lg tracking-widest focus-visible:ring-amber-500 flex-1"
                />
                <Button type="submit" disabled={isOverriding} className="bg-amber-500 hover:bg-amber-600 text-black font-bold border-none">
                  {isOverriding ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Override'}
                </Button>
              </div>
            </form>
          </div>
          <DialogFooter className="border-t border-slate-800/80 pt-3">
            <Button type="button" onClick={handleAbortCheckout} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg border-none">
              Abort Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
