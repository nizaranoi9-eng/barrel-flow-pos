'use client'

import { useState, useEffect } from 'react'
import { useAuthStore, useCategoriesStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import {
  Store,
  DollarSign,
  Users,
  Save,
  Plus,
  Trash2,
  Edit,
  Loader2,
  Shield,
  CreditCard,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Upload,
  Paintbrush
} from 'lucide-react'
import { toast } from 'sonner'
import type { User as UserType, Category } from '@/lib/types'

export function SettingsView() {
  const { user, store, settings, setStore, setSettings, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isDarkBg = settings?.cardThemeMode === 'dark'
  
  const cardClass = isDarkBg ? 'bg-[#131b2e] border-slate-700/80 shadow-2xl rounded-2xl text-slate-100' : 'bg-white border border-slate-200 shadow-md rounded-2xl text-slate-900'
  const innerCardClass = isDarkBg ? 'bg-[#0c101c] border border-slate-700/60 shadow-inner' : 'bg-slate-50/70 border border-slate-200/80 shadow-sm'
  const inputClass = isDarkBg ? 'bg-[#090c15] border-slate-700 hover:border-slate-600 text-white placeholder-slate-500 focus-visible:ring-amber-500 focus-visible:border-amber-500 transition-all duration-200 shadow-inner' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 placeholder-slate-400 focus-visible:ring-amber-500 focus-visible:border-amber-500 transition-all duration-200 shadow-inner'
  const textMutedClass = isDarkBg ? 'text-slate-300' : 'text-slate-500'
  const textLabelClass = isDarkBg ? 'text-slate-200 font-semibold text-xs tracking-wider uppercase block mb-1.5' : 'text-slate-750 font-semibold text-xs tracking-wider uppercase block mb-1.5'
  const textHeadingClass = isDarkBg ? 'text-white' : 'text-slate-900'
  const borderClass = isDarkBg ? 'border-slate-700/60' : 'border-slate-200/80'
  const subHeadingClass = isDarkBg ? 'text-slate-100 font-bold text-sm tracking-wide border-l-4 border-amber-500 pl-2.5' : 'text-slate-850 font-bold text-sm tracking-wide border-l-4 border-amber-500 pl-2.5'
  const currentAccountRowClass = isDarkBg ? 'bg-[#090c15]/60 border border-slate-700/40' : 'bg-slate-50 border border-slate-200'
  
  const tabListClass = isDarkBg ? 'grid w-full grid-cols-5 bg-[#0c101c] p-1 border border-slate-700/60 rounded-xl' : 'grid w-full grid-cols-5 bg-slate-100 p-1 border border-slate-200 rounded-xl'
  const tabTriggerClass = isDarkBg 
    ? 'gap-2 text-slate-300 font-semibold tracking-wide data-[state=active]:bg-[#1e293b] data-[state=active]:text-white data-[state=active]:shadow-lg border border-transparent data-[state=active]:border-slate-600/50 transition-all duration-150 py-2.5 rounded-lg cursor-pointer' 
    : 'gap-2 text-slate-650 font-semibold tracking-wide data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 transition-all duration-150 py-2.5 rounded-lg cursor-pointer'
    
  const tableHeaderClass = isDarkBg ? 'bg-[#0c101c] border-b border-slate-700' : 'bg-slate-55/90 border-b border-slate-200'
  const tableHeaderCellClass = isDarkBg ? 'text-slate-200 font-bold tracking-wider uppercase text-xs' : 'text-slate-700 font-bold tracking-wider uppercase text-xs'
  const tableRowClass = isDarkBg ? 'border-b border-slate-700/50 hover:bg-slate-800/10 text-slate-300 transition-colors' : 'border-b border-slate-200 hover:bg-slate-50/60 text-slate-750 transition-colors'
  const tableCellNameClass = isDarkBg ? 'font-bold text-slate-100' : 'font-bold text-slate-900'
  const tableBodyClass = isDarkBg ? 'bg-[#0e1424]/40' : 'bg-white'
  
  const dialogContentClass = isDarkBg ? 'bg-[#131b2e] border border-slate-700 text-white rounded-2xl shadow-2xl' : 'bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-xl'
  const dialogCancelBtnClass = isDarkBg ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 cursor-pointer' : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200 cursor-pointer'

  // Store form
  const [storeForm, setStoreForm] = useState({
    name: store?.name || '',
    phone: store?.phone || '',
    address: store?.address || '',
    logoUrl: store?.logoUrl || '',
  })

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    defaultTaxRate: settings?.defaultTaxRate?.toString() || '5',
    maxDiscountPercent: settings?.maxDiscountPercent?.toString() || '20',
    returnWindowHours: settings?.returnWindowHours?.toString() || '24',
    lowStockThreshold: settings?.lowStockThreshold?.toString() || '20',
    currencySymbol: settings?.currencySymbol || '₹',
    receiptHeader: settings?.receiptHeader || '',
    receiptFooter: settings?.receiptFooter || 'Thank you for shopping!',
    accentColor: settings?.accentColor || '#D97706',
    enableAgeVerification: settings?.enableAgeVerification ?? true,
    minLegalAge: settings?.minLegalAge?.toString() || '21',
    requireDobBeforeCheckout: settings?.requireDobBeforeCheckout ?? false,
    cardThemeMode: settings?.cardThemeMode || 'light',
  })

  // Employees
  const [employees, setEmployees] = useState<UserType[]>([])
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<UserType | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    pin: '',
    password: '',
    isActive: true,
  })

  // Categories
  const { categories, setCategories } = useCategoriesStore()
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    taxRate: '5',
  })

  // Account settings - Direct update (no OTP)
  const [accountForm, setAccountForm] = useState({
    newName: user?.name || '',
    newEmail: user?.email || '',
    newPhone: user?.phone || '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      loadSettingsData()
    }
  }, [isAdmin])

  useEffect(() => {
    if (store) {
      setStoreForm({
        name: store.name,
        phone: store.phone || '',
        address: store.address || '',
        logoUrl: store.logoUrl || '',
      })
    }
  }, [store])

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        defaultTaxRate: settings.defaultTaxRate?.toString() || '0',
        maxDiscountPercent: settings.maxDiscountPercent?.toString() || '0',
        returnWindowHours: settings.returnWindowHours?.toString() || '0',
        lowStockThreshold: settings.lowStockThreshold?.toString() || '0',
        currencySymbol: settings.currencySymbol || '₹',
        receiptHeader: settings.receiptHeader || '',
        receiptFooter: settings.receiptFooter || 'Thank you for shopping!',
        accentColor: settings.accentColor || '#D97706',
        enableAgeVerification: settings.enableAgeVerification ?? true,
        minLegalAge: settings.minLegalAge?.toString() || '21',
        requireDobBeforeCheckout: settings.requireDobBeforeCheckout ?? false,
        cardThemeMode: settings.cardThemeMode || 'light',
      })
    }
  }, [settings])

  useEffect(() => {
    if (user) {
      setAccountForm(prev => ({
        ...prev,
        newName: user.name || '',
        newEmail: user.email || '',
        newPhone: user.phone || '',
      }))
    }
  }, [user])

  const loadSettingsData = async () => {
    setIsLoading(true)
    try {
      const [employeesRes, categoriesRes] = await Promise.all([
        authFetch('/api/employees'),
        authFetch('/api/categories'),
      ])

      const employeesData = await employeesRes.json()
      const categoriesData = await categoriesRes.json()

      if (!employeesRes.ok || !employeesData.success) {
        throw new Error(employeesData.error || 'Could not load employees')
      }

      if (!categoriesRes.ok || !categoriesData.success) {
        throw new Error(categoriesData.error || 'Could not load categories')
      }

      if (employeesData.success) setEmployees(employeesData.data)
      if (categoriesData.success) setCategories(categoriesData.data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveStore = async () => {
    setIsSaving(true)
    try {
      // 1. Save store basic details & logo
      const response = await authFetch('/api/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storeForm.name,
          phone: storeForm.phone,
          address: storeForm.address,
          logoUrl: storeForm.logoUrl || null,
        }),
      })

      const storeData = await response.json()

      // 2. Also save settings accentColor & cardThemeMode
      const settingsResponse = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTaxRate: parseFloat(settingsForm.defaultTaxRate) || 0,
          maxDiscountPercent: parseFloat(settingsForm.maxDiscountPercent) || 0,
          returnWindowHours: parseInt(settingsForm.returnWindowHours) || 0,
          lowStockThreshold: parseInt(settingsForm.lowStockThreshold) || 0,
          currencySymbol: settingsForm.currencySymbol,
          receiptHeader: settingsForm.receiptHeader || null,
          receiptFooter: settingsForm.receiptFooter || null,
          accentColor: settingsForm.accentColor,
          enableAgeVerification: settingsForm.enableAgeVerification,
          minLegalAge: parseInt(settingsForm.minLegalAge) || 21,
          requireDobBeforeCheckout: settingsForm.requireDobBeforeCheckout,
          cardThemeMode: settingsForm.cardThemeMode,
        }),
      })
      const settingsData = await settingsResponse.json()

      if (storeData.success && settingsData.success) {
        setStore(storeData.data)
        setSettings(settingsData.data)
        toast.success('Store branding and details updated')
      } else {
        toast.error(storeData.error || settingsData.error || 'Failed to update store')
      }
    } catch (error) {
      toast.error('Failed to update store settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTaxRate: parseFloat(settingsForm.defaultTaxRate) || 0,
          maxDiscountPercent: parseFloat(settingsForm.maxDiscountPercent) || 0,
          returnWindowHours: parseInt(settingsForm.returnWindowHours) || 0,
          lowStockThreshold: parseInt(settingsForm.lowStockThreshold) || 0,
          currencySymbol: settingsForm.currencySymbol,
          receiptHeader: settingsForm.receiptHeader || null,
          receiptFooter: settingsForm.receiptFooter || null,
          accentColor: settingsForm.accentColor,
          enableAgeVerification: settingsForm.enableAgeVerification,
          minLegalAge: parseInt(settingsForm.minLegalAge) || 21,
          requireDobBeforeCheckout: settingsForm.requireDobBeforeCheckout,
          cardThemeMode: settingsForm.cardThemeMode,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        toast.success('Settings and regulations updated')
      } else {
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInstantThemeChange = async (mode: 'light' | 'dark') => {
    setSettingsForm(prev => ({ ...prev, cardThemeMode: mode }))
    try {
      const response = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTaxRate: settings ? settings.defaultTaxRate : parseFloat(settingsForm.defaultTaxRate),
          maxDiscountPercent: settings ? settings.maxDiscountPercent : parseFloat(settingsForm.maxDiscountPercent),
          returnWindowHours: settings ? settings.returnWindowHours : parseInt(settingsForm.returnWindowHours),
          lowStockThreshold: settings ? settings.lowStockThreshold : parseInt(settingsForm.lowStockThreshold),
          currencySymbol: settings ? settings.currencySymbol : settingsForm.currencySymbol,
          receiptHeader: settings ? settings.receiptHeader : (settingsForm.receiptHeader || null),
          receiptFooter: settings ? settings.receiptFooter : (settingsForm.receiptFooter || null),
          accentColor: settings ? settings.accentColor : settingsForm.accentColor,
          enableAgeVerification: settings ? settings.enableAgeVerification : settingsForm.enableAgeVerification,
          minLegalAge: settings ? settings.minLegalAge : (parseInt(settingsForm.minLegalAge) || 21),
          requireDobBeforeCheckout: settings ? settings.requireDobBeforeCheckout : settingsForm.requireDobBeforeCheckout,
          cardThemeMode: mode,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
        toast.success(`Theme switched to ${mode === 'light' ? 'Light' : 'Dark'} mode`)
      } else {
        toast.error(data.error || 'Failed to update background theme')
      }
    } catch (error) {
      toast.error('Failed to update background theme')
    }
  }

  // Employee handlers
  const openAddEmployee = () => {
    setEditingEmployee(null)
    setEmployeeForm({ name: '', email: '', pin: '', password: '', isActive: true })
    setShowEmployeeDialog(true)
  }

  const openEditEmployee = (employee: UserType) => {
    setEditingEmployee(employee)
    setEmployeeForm({ name: employee.name, email: employee.email, pin: '', password: '', isActive: employee.isActive })
    setShowEmployeeDialog(true)
  }

  const handleSaveEmployee = async () => {
    if (!employeeForm.name) {
      toast.error('Name is required')
      return
    }

    setIsSaving(true)
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees'
      const method = editingEmployee ? 'PUT' : 'POST'

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeForm),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingEmployee ? 'Employee updated' : 'Employee added')
        setShowEmployeeDialog(false)
        loadSettingsData()
      } else {
        toast.error(data.error || 'Failed to save employee')
      }
    } catch (error) {
      toast.error('Failed to save employee')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const response = await authFetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Employee removed')
        loadSettingsData()
      } else {
        toast.error(data.error || 'Failed to remove employee')
      }
    } catch (error) {
      toast.error('Failed to remove employee')
    }
  }

  // Category handlers
  const openAddCategory = () => {
    setEditingCategory(null)
    setCategoryForm({ name: '', taxRate: '5' })
    setShowCategoryDialog(true)
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({ name: category.name, taxRate: category.taxRate.toString() })
    setShowCategoryDialog(true)
  }

  const handleSaveCategory = async () => {
    const categoryName = categoryForm.name.trim()
    const duplicateCategory = categories.find(
      (category) =>
        category.name.trim().toLowerCase() === categoryName.toLowerCase() &&
        category.id !== editingCategory?.id
    )

    if (!categoryName) {
      toast.error('Name is required')
      return
    }

    if (!editingCategory && duplicateCategory) {
      toast.error(`Category "${duplicateCategory.name}" already exists`)
      return
    }

    setIsSaving(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryName,
          taxRate: parseFloat(categoryForm.taxRate),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(
          editingCategory && duplicateCategory
            ? `Merged into "${duplicateCategory.name}"`
            : editingCategory
              ? 'Category updated'
              : 'Category added'
        )
        setShowCategoryDialog(false)
        loadSettingsData()
      } else {
        toast.error(data.error || 'Failed to save category')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save category')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await authFetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Category deleted')
        loadSettingsData()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  // Direct credential update handler
  const handleUpdateCredentials = async () => {
    if (!accountForm.newName.trim()) {
      toast.error('Name is required')
      return
    }

    if (accountForm.newPassword && accountForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsUpdating(true)
    try {
      const response = await authFetch('/api/auth/update-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newName: accountForm.newName,
          newEmail: accountForm.newEmail,
          newPhone: accountForm.newPhone,
          newPassword: accountForm.newPassword || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Account updated successfully')
        // Update local user state
        if (data.user) {
          setUser(data.user)
        }
        // Reset password fields
        setAccountForm(prev => ({
          ...prev,
          newPassword: '',
          confirmPassword: '',
        }))
      } else {
        toast.error(data.error || 'Failed to update account')
      }
    } catch (error) {
      console.error('Update credentials error:', error)
      toast.error('Failed to update account')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-[#090D1A] space-y-6">
      <div className={`flex items-center justify-between pb-4 border-b flex-wrap gap-4 ${borderClass}`}>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Store className="w-8 h-8 text-amber-500" />
          Settings
        </h2>
        <div className={`flex items-center gap-2 p-1.5 rounded-xl border shadow-lg ${isDarkBg ? 'bg-[#121824]/95 border-slate-700/80' : 'bg-slate-100 border-slate-200'}`}>
          <span className={`text-xs px-2 font-semibold ${isDarkBg ? 'text-slate-300' : 'text-slate-600'}`}>Background Theme:</span>
          <button
            type="button"
            onClick={() => handleInstantThemeChange('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              settingsForm.cardThemeMode === 'light'
                ? 'bg-amber-500 text-black shadow-md'
                : `text-slate-400 hover:text-white ${!isDarkBg ? 'hover:text-slate-900' : ''}`
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full border ${settingsForm.cardThemeMode === 'light' ? 'bg-white border-slate-600' : 'bg-white border-slate-400'}`} />
            Light
          </button>
          <button
            type="button"
            onClick={() => handleInstantThemeChange('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              settingsForm.cardThemeMode === 'dark'
                ? 'bg-amber-500 text-black shadow-md'
                : `text-slate-400 hover:text-white ${!isDarkBg ? 'hover:text-slate-900' : ''}`
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full border ${settingsForm.cardThemeMode === 'dark' ? 'bg-[#111726] border-slate-400' : 'bg-[#111726] border-slate-700'}`} />
            Dark
          </button>
        </div>
      </div>

      {!isAdmin ? (
        <div className={`flex-1 flex items-center justify-center p-12 border shadow-2xl rounded-2xl ${isDarkBg ? 'bg-[#131b2e] border-slate-700/80 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 mx-auto mb-4 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse" />
            <p className={`text-2xl font-bold mb-2 ${textHeadingClass}`}>Admin Access Required</p>
            <p className={`text-slate-300 text-sm leading-relaxed ${textMutedClass}`}>
              Only admins can manage store details, compliance regulations, employee records, and product categories.
            </p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="account" className="flex-1 space-y-6">
          <TabsList className={tabListClass}>
            <TabsTrigger 
              value="account" 
              className={tabTriggerClass}
            >
              <User className="w-4 h-4 text-slate-400 group-data-[state=active]:text-white" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger 
              value="store" 
              className={tabTriggerClass}
            >
              <Store className="w-4 h-4 text-slate-400 group-data-[state=active]:text-white" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className={tabTriggerClass}
            >
              <DollarSign className="w-4 h-4 text-slate-400 group-data-[state=active]:text-white" />
              <span className="hidden sm:inline">Billing & Rules</span>
            </TabsTrigger>
            <TabsTrigger 
              value="employees" 
              className={tabTriggerClass}
            >
              <Users className="w-4 h-4 text-slate-400 group-data-[state=active]:text-white" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className={tabTriggerClass}
            >
              <CreditCard className="w-4 h-4 text-slate-400 group-data-[state=active]:text-white" />
              <span className="hidden sm:inline">Categories</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings - Direct Update */}
          <TabsContent value="account" className="focus-visible:outline-none">
            <Card className={cardClass}>
              <CardHeader className={`border-b pb-6 ${borderClass}`}>
                <CardTitle className={`flex items-center gap-2 font-extrabold text-xl tracking-tight ${textHeadingClass}`}>
                  <KeyRound className="w-5 h-5 text-amber-500" />
                  Account Settings
                </CardTitle>
                <CardDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>
                  Update your account details directly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Update Credentials Form */}
                <div className="space-y-4">
                  <h4 className={subHeadingClass}>Personal Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newName" className={textLabelClass}>Full Name</Label>
                      <Input
                        id="newName"
                        value={accountForm.newName}
                        onChange={(e) => setAccountForm({ ...accountForm, newName: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail" className={textLabelClass}>Email Address</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={accountForm.newEmail}
                        onChange={(e) => setAccountForm({ ...accountForm, newEmail: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPhone" className={textLabelClass}>Phone Number</Label>
                      <Input
                        id="newPhone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={accountForm.newPhone}
                        onChange={(e) => setAccountForm({ ...accountForm, newPhone: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <Separator className={`my-6 ${borderClass}`} />

                {/* Password Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className={subHeadingClass}>Change Password</h4>
                    <p className={`text-xs font-medium italic ${textMutedClass}`}>Leave blank to keep your current password</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className={textLabelClass}>New Password</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={accountForm.newPassword}
                          onChange={(e) => setAccountForm({ ...accountForm, newPassword: e.target.value })}
                          className={`${inputClass} pr-10`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className={textLabelClass}>Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm new password"
                        value={accountForm.confirmPassword}
                        onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateCredentials} 
                  disabled={isUpdating}
                  className="mt-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-6 rounded-lg cursor-pointer"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>

                <Separator className={`my-6 ${borderClass}`} />

                {/* Current User Info */}
                <div className={`rounded-2xl p-6 shadow-inner space-y-4 ${innerCardClass}`}>
                  <h4 className={`font-bold flex items-center gap-2 text-sm tracking-wide border-b pb-3 ${borderClass} ${isDarkBg ? 'text-slate-100' : 'text-slate-800'}`}>
                    <User className="w-4 h-4 text-amber-500" />
                    Current Account
                  </h4>
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${isDarkBg ? 'text-slate-200' : 'text-slate-800'}`}>
                    <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${currentAccountRowClass}`}>
                      <span className={`${textMutedClass} font-medium`}>Name:</span>
                      <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>{user?.name}</span>
                    </div>
                    <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${currentAccountRowClass}`}>
                      <span className={`${textMutedClass} font-medium`}>Email:</span>
                      <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-900'} text-right break-all ml-4`}>{user?.email}</span>
                    </div>
                    <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${currentAccountRowClass}`}>
                      <span className={`${textMutedClass} font-medium`}>Role:</span>
                      <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-900'} capitalize`}>{user?.role}</span>
                    </div>
                    <div className={`flex justify-between items-center px-4 py-3 rounded-xl border ${currentAccountRowClass}`}>
                      <span className={`${textMutedClass} font-medium`}>Phone:</span>
                      <span className={`font-bold ${isDarkBg ? 'text-white' : 'text-slate-900'}`}>{user?.phone || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Store Settings / Branding */}
          <TabsContent value="store" className="focus-visible:outline-none">
            <Card className={cardClass}>
              <CardHeader className={`border-b pb-6 ${borderClass}`}>
                <CardTitle className={`flex items-center gap-2 font-extrabold text-xl tracking-tight ${textHeadingClass}`}>
                  <Store className="w-5 h-5 text-amber-500" />
                  Store Branding & Details
                </CardTitle>
                <CardDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>
                  Update your store information, branding colors, and logo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="store-name" className={textLabelClass}>Store/App Name</Label>
                    <Input
                      id="store-name"
                      value={storeForm.name}
                      onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store-phone" className={textLabelClass}>Phone</Label>
                    <Input
                      id="store-phone"
                      value={storeForm.phone}
                      onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address" className={textLabelClass}>Address</Label>
                  <Input
                    id="store-address"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <Separator className={`my-6 ${borderClass}`} />

                {/* Logo Section */}
                <div className="space-y-4">
                  <Label className={`text-sm font-bold flex items-center gap-2 tracking-wide border-l-4 border-amber-500 pl-2.5 ${isDarkBg ? 'text-slate-100' : 'text-slate-800'}`}>
                    <Upload className="w-4 h-4 text-amber-500" />
                    Logo Image Upload
                  </Label>
                  <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 rounded-2xl border shadow-inner ${innerCardClass}`}>
                    <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md ${isDarkBg ? 'bg-[#090c15] border-slate-700/80' : 'bg-white border-slate-200'}`}>
                      {storeForm.logoUrl ? (
                        <img src={storeForm.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-10 h-10 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-3 w-full">
                      <p className={`text-xs font-semibold leading-relaxed ${textMutedClass}`}>
                        Upload your custom logo. We support JPG, PNG, or SVG formats (Base64 conversion, 1MB limit).
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className={`${isDarkBg ? 'bg-[#1e293b] hover:bg-[#2e3e56] text-white border-slate-600/80' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'} text-xs font-bold px-4 py-2 cursor-pointer transition-colors`}
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                if (file.size > 1024 * 1024) {
                                  toast.error('File size exceeds 1MB limit');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setStoreForm(prev => ({
                                    ...prev,
                                    logoUrl: reader.result as string
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          Upload Logo File
                        </Button>
                        {storeForm.logoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-bold cursor-pointer"
                            onClick={() => setStoreForm(prev => ({ ...prev, logoUrl: '' }))}
                          >
                            Remove Logo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className={`my-6 ${borderClass}`} />

                {/* Accent Color Picker Section */}
                <div className="space-y-4">
                  <Label className={`text-sm font-bold flex items-center gap-2 tracking-wide border-l-4 border-amber-500 pl-2.5 ${isDarkBg ? 'text-slate-100' : 'text-slate-800'}`}>
                    <Paintbrush className="w-4 h-4 text-amber-500" />
                    Accent Color Theme
                  </Label>
                  <div className={`p-6 rounded-2xl border shadow-inner space-y-4 ${innerCardClass}`}>
                    <p className={`text-xs font-semibold ${textMutedClass}`}>Choose a primary color to style the interface accents, highlights, buttons, and sidebars.</p>
                    
                    {/* Preset Swatches */}
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { name: 'Amber (Default)', hex: '#D97706' },
                        { name: 'Emerald', hex: '#10B981' },
                        { name: 'Sapphire', hex: '#3B82F6' },
                        { name: 'Rose', hex: '#F43F5E' },
                        { name: 'Purple', hex: '#8B5CF6' },
                        { name: 'Slate', hex: '#64748B' },
                      ].map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => setSettingsForm(prev => ({ ...prev, accentColor: color.hex }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${
                            settingsForm.accentColor === color.hex
                              ? 'bg-[#1e293b] text-white border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                              : `${isDarkBg ? 'bg-[#090c15] text-slate-300 border-slate-700 hover:bg-[#1a2333]/80 hover:text-white' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </button>
                      ))}
                      
                      {/* Custom Color Selector */}
                      <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg shadow-inner ${isDarkBg ? 'border-slate-700 bg-[#090c15]' : 'border-slate-200 bg-white'}`}>
                        <div className="relative flex items-center">
                          <input
                            id="custom-color-picker"
                            type="color"
                            value={settingsForm.accentColor || '#D97706'}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, accentColor: e.target.value }))}
                            className="w-7 h-7 rounded-full border border-slate-650 cursor-pointer p-0 overflow-hidden bg-transparent"
                            style={{
                              WebkitAppearance: 'none',
                            }}
                          />
                        </div>
                        <Label htmlFor="custom-color-picker" className={`text-xs font-semibold cursor-pointer transition-colors ${isDarkBg ? 'text-slate-200 hover:text-white' : 'text-slate-700 hover:text-slate-900'}`}>
                          Custom Color
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className={`my-6 ${borderClass}`} />

                {/* Card & Table Background Theme Section */}
                <div className="space-y-4">
                  <Label className={`text-sm font-bold flex items-center gap-2 tracking-wide border-l-4 border-amber-500 pl-2.5 ${isDarkBg ? 'text-slate-100' : 'text-slate-800'}`}>
                    <Paintbrush className="w-4 h-4 text-amber-500" />
                    Background Theme for Cards & Tables
                  </Label>
                  <div className={`p-6 rounded-2xl border shadow-inner space-y-4 ${innerCardClass}`}>
                    <p className={`text-xs font-semibold ${textMutedClass}`}>Choose a background theme color style for Customers, Reports, and Transactions tab layouts.</p>
                    <div className="flex items-center gap-4">
                      <button
                        key="theme-light"
                        type="button"
                        onClick={() => handleInstantThemeChange('light')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${
                          settingsForm.cardThemeMode === 'light'
                            ? 'bg-[#1e293b] text-white border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                            : `${isDarkBg ? 'bg-[#090c15] text-slate-300 border-slate-700 hover:bg-[#1a2333]/80 hover:text-white' : 'bg-white text-slate-750 border-slate-200 hover:bg-slate-50 hover:text-slate-905'}`
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-white border border-slate-400" />
                        White Theme
                      </button>
                      <button
                        key="theme-dark"
                        type="button"
                        onClick={() => handleInstantThemeChange('dark')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${
                          settingsForm.cardThemeMode === 'dark'
                            ? 'bg-[#1e293b] text-white border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                            : `${isDarkBg ? 'bg-[#090c15] text-slate-300 border-slate-700 hover:bg-[#1a2333]/80 hover:text-white' : 'bg-white text-slate-755 border-slate-200 hover:bg-slate-50 hover:text-slate-905'}`
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full bg-[#111726] border border-slate-700" />
                        Dark Theme
                      </button>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveStore} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-6 rounded-lg cursor-pointer">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Branding & Info
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing & Regulations Tab */}
          <TabsContent value="billing" className="focus-visible:outline-none">
            <Card className={cardClass}>
              <CardHeader className={`border-b pb-6 ${borderClass}`}>
                <CardTitle className={`font-extrabold text-xl tracking-tight ${textHeadingClass}`}>Billing & Compliance Rules</CardTitle>
                <CardDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>Configure default tax rates, checkout regulations, and limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-tax" className={textLabelClass}>Default Tax Rate (%)</Label>
                    <Input
                      id="default-tax"
                      type="number"
                      step="0.1"
                      value={settingsForm.defaultTaxRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultTaxRate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-discount" className={textLabelClass}>Max Discount Allowed (%)</Label>
                    <Input
                      id="max-discount"
                      type="number"
                      value={settingsForm.maxDiscountPercent}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxDiscountPercent: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="return-window" className={textLabelClass}>Return Window (hours)</Label>
                    <Input
                      id="return-window"
                      type="number"
                      value={settingsForm.returnWindowHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, returnWindowHours: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low-stock" className={textLabelClass}>Low Stock Warning Threshold</Label>
                    <Input
                      id="low-stock"
                      type="number"
                      value={settingsForm.lowStockThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, lowStockThreshold: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency" className={textLabelClass}>Currency Symbol</Label>
                    <Input
                      id="currency"
                      value={settingsForm.currencySymbol}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                      className={`w-24 ${inputClass}`}
                    />
                  </div>
                </div>

                <Separator className={`my-6 ${borderClass}`} />

                {/* Age Restriction settings */}
                <div className="space-y-4">
                  <h4 className={subHeadingClass}>
                    <Shield className="w-5 h-5 text-amber-500 mr-2 inline" />
                    Compliance & Age Verification Controls
                  </h4>
                  <div className={`p-6 rounded-2xl border shadow-inner space-y-4 ${innerCardClass}`}>
                    <p className={`text-xs font-semibold ${textMutedClass}`}>
                      Configure compliance rules for age-restricted inventory items (e.g. spirits, wines, tobacco products). Checkout will require manual or birthday-based cashier checks.
                    </p>
                    
                    <div className={`flex items-center justify-between py-3 border-b ${isDarkBg ? 'border-slate-700/50' : 'border-slate-200'}`}>
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-age-verification" className={`text-sm font-bold cursor-pointer ${isDarkBg ? 'text-slate-200' : 'text-slate-750'}`}>
                          Enable Legal Age Verification
                        </Label>
                        <p className={`text-xs ${textMutedClass}`}>Enable age-checking and alerts on restricted products during billing</p>
                      </div>
                      <Switch
                        id="enable-age-verification"
                        checked={settingsForm.enableAgeVerification}
                        onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, enableAgeVerification: checked }))}
                      />
                    </div>

                    {settingsForm.enableAgeVerification && (
                      <>
                        <div className={`flex items-center justify-between py-3 border-b ${isDarkBg ? 'border-slate-700/50' : 'border-slate-200'}`}>
                          <div className="space-y-0.5">
                            <Label htmlFor="min-legal-age" className={`text-sm font-bold ${isDarkBg ? 'text-slate-200' : 'text-slate-750'}`}>
                              Minimum Legal Purchase Age
                            </Label>
                            <p className={`text-xs ${textMutedClass}`}>Legal minimum age for purchasing restricted items (e.g. 18, 21, 25)</p>
                          </div>
                          <Input
                            id="min-legal-age"
                            type="number"
                            value={settingsForm.minLegalAge}
                            onChange={(e) => setSettingsForm(prev => ({ ...prev, minLegalAge: e.target.value }))}
                            className={`w-24 text-center font-bold ${inputClass}`}
                          />
                        </div>

                        <div className="flex items-center justify-between py-3">
                          <div className="space-y-0.5">
                            <Label htmlFor="require-dob" className={`text-sm font-bold cursor-pointer ${isDarkBg ? 'text-slate-200' : 'text-slate-750'}`}>
                              Require Customer DOB Before Checkout
                            </Label>
                            <p className={`text-xs ${textMutedClass}`}>Requires cashiers to input customer birthdate and validates age prior to checkout completion</p>
                          </div>
                          <Switch
                            id="require-dob"
                            checked={settingsForm.requireDobBeforeCheckout}
                            onCheckedChange={(checked) => setSettingsForm(prev => ({ ...prev, requireDobBeforeCheckout: checked }))}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator className={`my-6 ${borderClass}`} />

                <div className="space-y-4">
                  <h4 className={subHeadingClass}>Receipt Design</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="receipt-header" className={textLabelClass}>Receipt Header text</Label>
                      <Input
                        id="receipt-header"
                        value={settingsForm.receiptHeader}
                        onChange={(e) => setSettingsForm({ ...settingsForm, receiptHeader: e.target.value })}
                        placeholder="Welcome to our store!"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="receipt-footer" className={textLabelClass}>Receipt Footer statutory Warning</Label>
                      <Input
                        id="receipt-footer"
                        value={settingsForm.receiptFooter}
                        onChange={(e) => setSettingsForm({ ...settingsForm, receiptFooter: e.target.value })}
                        placeholder="Thank you for shopping!"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-6 rounded-lg cursor-pointer">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Regulations & Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="focus-visible:outline-none">
            <Card className={cardClass}>
              <CardHeader className={`flex flex-row items-center justify-between border-b pb-6 flex-wrap gap-4 ${borderClass}`}>
                <div>
                  <CardTitle className={`font-extrabold text-xl tracking-tight ${textHeadingClass}`}>Employees</CardTitle>
                  <CardDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>Manage your staff and their permissions</CardDescription>
                </div>
                <Button onClick={openAddEmployee} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold border-none cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : employees.length === 0 ? (
                  <p className={`text-center py-8 font-semibold ${textMutedClass}`}>No employees yet</p>
                ) : (
                  <div className={`border rounded-xl overflow-hidden shadow-md ${borderClass}`}>
                    <Table>
                      <TableHeader className={tableHeaderClass}>
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className={tableHeaderCellClass}>Name</TableHead>
                          <TableHead className={tableHeaderCellClass}>Email</TableHead>
                          <TableHead className={tableHeaderCellClass}>Role</TableHead>
                          <TableHead className={tableHeaderCellClass}>Status</TableHead>
                          <TableHead className={`w-[120px] pr-6 text-right ${tableHeaderCellClass}`}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className={tableBodyClass}>
                        {employees.map((employee) => (
                          <TableRow key={employee.id} className={tableRowClass}>
                            <TableCell className={tableCellNameClass}>{employee.name}</TableCell>
                            <TableCell className={`font-medium ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>{employee.email}</TableCell>
                            <TableCell className={`capitalize font-medium ${isDarkBg ? 'text-slate-300' : 'text-slate-700'}`}>{employee.role}</TableCell>
                            <TableCell>
                              <Badge className={employee.isActive ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold' : `${isDarkBg ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-500 border border-slate-200'} font-medium`}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditEmployee(employee)} className={`h-8 w-8 cursor-pointer ${isDarkBg ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-600 hover:text-slate-905 hover:bg-slate-100'}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className={`h-8 w-8 cursor-pointer ${isDarkBg ? 'text-slate-300 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-600 hover:text-red-550 hover:bg-red-50'}`}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className={dialogContentClass}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className={`font-extrabold text-lg ${textHeadingClass}`}>Remove Employee</AlertDialogTitle>
                                      <AlertDialogDescription className={textMutedClass}>
                                        Are you sure you want to remove {employee.name}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className={dialogCancelBtnClass}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteEmployee(employee.id)} className="bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer">
                                        Remove
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="focus-visible:outline-none">
            <Card className={cardClass}>
              <CardHeader className={`flex flex-row items-center justify-between border-b pb-6 flex-wrap gap-4 ${borderClass}`}>
                <div>
                  <CardTitle className={`font-extrabold text-xl tracking-tight ${textHeadingClass}`}>Product Categories</CardTitle>
                  <CardDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>Manage product categories and their tax rates</CardDescription>
                </div>
                <Button onClick={openAddCategory} size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold border-none cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : categories.length === 0 ? (
                  <p className={`text-center py-8 font-semibold ${textMutedClass}`}>No categories yet</p>
                ) : (
                  <div className={`border rounded-xl overflow-hidden shadow-md ${borderClass}`}>
                    <Table>
                      <TableHeader className={tableHeaderClass}>
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className={tableHeaderCellClass}>Name</TableHead>
                          <TableHead className={tableHeaderCellClass}>Tax Rate</TableHead>
                          <TableHead className={tableHeaderCellClass}>Products</TableHead>
                          <TableHead className={`w-[120px] pr-6 text-right ${tableHeaderCellClass}`}>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className={tableBodyClass}>
                        {categories.map((category) => (
                          <TableRow key={category.id} className={tableRowClass}>
                            <TableCell className={tableCellNameClass}>{category.name}</TableCell>
                            <TableCell className={`font-bold ${isDarkBg ? 'text-slate-350' : 'text-slate-700'}`}>{category.taxRate}%</TableCell>
                            <TableCell className={`font-medium ${isDarkBg ? 'text-slate-350' : 'text-slate-655'}`}>{category._count?.products || 0}</TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditCategory(category)} className={`h-8 w-8 cursor-pointer ${isDarkBg ? 'text-slate-300 hover:text-white hover:bg-slate-700/60' : 'text-slate-650 hover:text-slate-905 hover:bg-slate-100'}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className={`h-8 w-8 cursor-pointer ${isDarkBg ? 'text-slate-300 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-650 hover:text-red-550 hover:bg-red-50'}`}>
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className={dialogContentClass}>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className={`font-extrabold text-lg ${textHeadingClass}`}>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription className={textMutedClass}>
                                        Are you sure you want to delete "{category.name}"? Products in this category will be uncategorized.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className={dialogCancelBtnClass}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteCategory(category.id)} className="bg-red-600 hover:bg-red-700 text-white border-none cursor-pointer">
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
          </TabsContent>
        </Tabs>
      )}
 
      {/* Employee Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader>
            <DialogTitle className={`font-extrabold text-xl ${textHeadingClass}`}>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
            <DialogDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>
              {editingEmployee ? 'Update employee details' : 'Create a new employee account'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name" className={textLabelClass}>Name</Label>
              <Input
                id="employee-name"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-email" className={textLabelClass}>Email</Label>
              <Input
                id="employee-email"
                type="email"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                className={inputClass}
              />
            </div>
            {!editingEmployee && (
              <div className="space-y-2">
                <Label htmlFor="employee-password" className={textLabelClass}>Password</Label>
                <Input
                  id="employee-password"
                  type="password"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="employee-pin" className={textLabelClass}>PIN (4 digits for quick login)</Label>
              <Input
                id="employee-pin"
                type="password"
                maxLength={4}
                value={employeeForm.pin}
                onChange={(e) => setEmployeeForm({ ...employeeForm, pin: e.target.value.replace(/\D/g, '') })}
                className={`text-center text-2xl tracking-widest text-amber-500 focus-visible:ring-amber-500 ${isDarkBg ? 'bg-[#090c15] border-slate-700' : 'bg-white border-slate-200'}`}
              />
              {editingEmployee && (
                <p className={`text-[10px] italic ${textMutedClass} text-center`}>Leave blank to keep current PIN</p>
              )}
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-slate-700/50 mt-4">
              <div className="space-y-0.5">
                <Label htmlFor="employee-active" className={`text-sm font-bold cursor-pointer ${isDarkBg ? 'text-slate-200' : 'text-slate-750'}`}>
                  Active Status
                </Label>
                <p className={`text-xs ${textMutedClass}`}>Enable or disable this employee's access to the terminal</p>
              </div>
              <Switch
                id="employee-active"
                checked={employeeForm.isActive}
                onCheckedChange={(checked) => setEmployeeForm(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)} className={dialogCancelBtnClass}>
              Cancel
            </Button>
            <Button onClick={handleSaveEmployee} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold border-none cursor-pointer">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingEmployee ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className={dialogContentClass}>
          <DialogHeader>
            <DialogTitle className={`font-extrabold text-xl ${textHeadingClass}`}>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription className={`font-medium text-xs mt-1 ${textMutedClass}`}>
              {editingCategory ? 'Update category details' : 'Create a new product category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name" className={textLabelClass}>Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-tax" className={textLabelClass}>Tax Rate (%)</Label>
              <Input
                id="category-tax"
                type="number"
                step="0.1"
                value={categoryForm.taxRate}
                onChange={(e) => setCategoryForm({ ...categoryForm, taxRate: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)} className={dialogCancelBtnClass}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={isSaving} className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold border-none cursor-pointer">
              {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingCategory ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
