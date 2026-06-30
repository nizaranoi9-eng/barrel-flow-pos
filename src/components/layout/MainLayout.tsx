'use client'

import { useAuthStore, useUIStore, useOfflineStore } from '@/lib/store'
import { authFetch } from '@/lib/api-client'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  FileDown,
  FileText,
  Package,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Store,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Gift,
  ShieldAlert
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'

interface MainLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Analytics Overview',
    hasChevron: false
  },
  { 
    id: 'pos', 
    label: 'POS Sales', 
    icon: ShoppingCart, 
    description: 'POS Billing Dashboard',
    hasChevron: false
  },
  { 
    id: 'products', 
    label: 'Inventory', 
    icon: Package,
    description: 'Manage wine & spirits',
    hasChevron: true
  },
  { 
    id: 'orders-dummy', 
    label: 'Orders', 
    icon: FileText,
    description: 'View orders & invoices',
    hasChevron: true
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users,
    description: 'Customer list',
    hasChevron: true
  },
  { 
    id: 'promotions', 
    label: 'Promotions', 
    icon: Gift,
    description: 'Deals & promotions',
    hasChevron: true
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: BarChart3,
    description: 'Sales reports & logs',
    hasChevron: true
  },
  { 
    id: 'settings', 
    label: 'Store Settings', 
    icon: Settings,
    description: 'System configuration',
    hasChevron: true
  },
]

// Helper to convert hex to rgb string
function hexToRgb(hex: string): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `${r}, ${g}, ${b}`;
  } else if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return '217, 119, 6'; // default amber-500
}

// Helper to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace('#', '');
  let r = parseInt(cleanHex.slice(0, 2), 16);
  let g = parseInt(cleanHex.slice(2, 4), 16);
  let b = parseInt(cleanHex.slice(4, 6), 16);

  r = Math.min(255, Math.max(0, r + percent));
  g = Math.min(255, Math.max(0, g + percent));
  b = Math.min(255, Math.max(0, b + percent));

  const rr = r.toString(16).padStart(2, '0');
  const gg = g.toString(16).padStart(2, '0');
  const bb = b.toString(16).padStart(2, '0');

  return `#${rr}${gg}${bb}`;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, store, settings, setSettings, logout } = useAuthStore()
  const { activeTab, setActiveTab } = useUIStore()
  const { isOnline, getUnsyncedOrders } = useOfflineStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleGlobalThemeChange = async (mode: 'light' | 'dark') => {
    try {
      const response = await authFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultTaxRate: settings ? settings.defaultTaxRate : 18.0,
          maxDiscountPercent: settings ? settings.maxDiscountPercent : 15.0,
          returnWindowHours: settings ? settings.returnWindowHours : 0,
          lowStockThreshold: settings ? settings.lowStockThreshold : 15,
          currencySymbol: settings ? settings.currencySymbol : '₹',
          receiptHeader: settings ? settings.receiptHeader : null,
          receiptFooter: settings ? settings.receiptFooter : null,
          accentColor: settings ? settings.accentColor : '#D97706',
          enableAgeVerification: settings ? settings.enableAgeVerification : true,
          minLegalAge: settings ? settings.minLegalAge : 21,
          requireDobBeforeCheckout: settings ? settings.requireDobBeforeCheckout : false,
          cardThemeMode: mode,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to update background theme:', error)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const appName = store?.name || 'BarrelFlow Spirits';
      document.title = `${appName} - POS`;
      
      if (store?.logoUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = store.logoUrl;
      }
    }
  }, [store?.name, store?.logoUrl]);

  const unsyncedCount = getUnsyncedOrders().length

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        window.sessionStorage.setItem('barrelflow-explicit-logout', 'true')
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        if (isFirebaseConfigured()) {
          await signOut(getFirebaseAuth())
        }
      } catch (error) {
        console.error('Logout error:', error)
      }
      logout()
    }
  }

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#090D1A] flex text-slate-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50
        w-64 h-screen bg-[#0B0F19] border-r border-slate-800/80
        flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header - Store Logo */}
        <div className="p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            {store?.logoUrl ? (
              <img 
                src={store.logoUrl} 
                alt={store.name || 'Logo'} 
                className="w-8 h-8 rounded-lg object-cover shadow-md shadow-amber-500/10" 
              />
            ) : (
              <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-lg shadow-md shadow-amber-500/10">
                <Store className="w-5 h-5 text-black" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-white tracking-tight truncate">
                {store?.name || 'BarrelFlow'}
              </h1>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              // Map some link IDs to resolve custom routes
              const isCurrentActive = activeTab === item.id || 
                (item.id === 'orders-dummy' && activeTab === 'transactions') ||
                (item.id === 'promotions' && activeTab === 'promotions')
              
              const resolvedTab = item.id === 'orders-dummy' ? 'transactions' : item.id

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(resolvedTab)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl
                      text-[13px] font-medium transition-all duration-200 group border-l-4
                      ${isCurrentActive 
                        ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 border-amber-500 font-semibold pl-3' 
                        : 'text-slate-400 hover:bg-[#151C2C]/50 hover:text-white border-transparent'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isCurrentActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-white'}`} />
                    <span className="truncate">{item.label}</span>
                    {!isCurrentActive && item.hasChevron && (
                      <ChevronRight className="ml-auto w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070A11]">
          {/* Online Status */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-2">
            <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">POS Terminal</span>
            {isOnline ? (
              <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-500/30 bg-emerald-500/5 text-[9px] px-2 py-0.5 font-bold">
                <Wifi className="w-2.5 h-2.5" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-orange-400 border-orange-500/30 bg-orange-500/5 text-[9px] px-2 py-0.5 font-bold">
                <WifiOff className="w-2.5 h-2.5" />
                Offline
              </Badge>
            )}
          </div>

          {/* Background Theme Switcher */}
          <div className="flex items-center justify-between px-3 py-1.5 mb-2">
            <span className="text-[11px] text-slate-500 font-semibold tracking-wider uppercase">Theme</span>
            <div className="flex items-center gap-1 bg-[#151C2C] p-0.5 rounded border border-slate-800">
              <button
                type="button"
                onClick={() => handleGlobalThemeChange('light')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all duration-200 ${
                  settings?.cardThemeMode === 'light'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => handleGlobalThemeChange('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all duration-200 ${
                  settings?.cardThemeMode === 'dark'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {unsyncedCount > 0 && (
            <div className="px-3 py-1 mb-2">
              <Badge variant="secondary" className="w-full justify-center gap-1 text-[9px] bg-slate-800 text-slate-300 hover:bg-slate-700">
                {unsyncedCount} pending sync
              </Badge>
            </div>
          )}

          <Separator className="my-2 bg-slate-800/60" />

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <span className="text-sm font-semibold text-slate-200">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-center mt-3 pt-2 border-t border-slate-800/50">
            <p
              className="text-[11px] font-light tracking-[0.3em] uppercase cursor-default transition-all duration-300 select-none"
              style={{ color: 'rgba(148, 163, 184, 0.55)', letterSpacing: '0.3em' }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.color = 'rgba(251, 191, 36, 0.9)';
                (e.target as HTMLElement).style.textShadow = '0 0 12px rgba(251, 191, 36, 0.5)';
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.color = 'rgba(148, 163, 184, 0.55)';
                (e.target as HTMLElement).style.textShadow = 'none';
              }}
            >
              Powered by Andy Gogoi
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header (Mobile) */}
        <header className="lg:hidden bg-[#0B0F19] border-b border-slate-800/80 sticky top-0 z-30">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-slate-300 hover:text-white">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-extrabold text-white">{store?.name || 'BarrelFlow Spirits'}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Badge variant="outline" className="gap-1 text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                  <Wifi className="w-3 h-3" />
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-orange-500 border-orange-500/20 bg-orange-500/5">
                  <WifiOff className="w-3 h-3" />
                </Badge>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-[#090D1A]">
          {/* Dynamic Style Injection for Theme Accent Color */}
          {(() => {
            const accentColor = settings?.accentColor || '#D97706';
            const accentColorRgb = hexToRgb(accentColor);
            const accentColorLight = adjustBrightness(accentColor, 20);
            const accentColorDark = adjustBrightness(accentColor, -20);
            return (
              <style dangerouslySetInnerHTML={{
                __html: `
                  :root {
                    --primary-accent: ${accentColor};
                    --primary-accent-rgb: ${accentColorRgb};
                    --primary-accent-light: ${accentColorLight};
                    --primary-accent-dark: ${accentColorDark};
                  }
                  
                  /* Color text overrides */
                  .text-amber-500 {
                    color: var(--primary-accent) !important;
                  }
                  .text-amber-400 {
                    color: var(--primary-accent-light) !important;
                  }
                  .text-amber-600 {
                    color: var(--primary-accent-dark) !important;
                  }
                  .hover\\:text-amber-400:hover {
                    color: var(--primary-accent-light) !important;
                  }
                  .hover\\:text-amber-500:hover {
                    color: var(--primary-accent) !important;
                  }

                  /* Background overrides */
                  .bg-amber-500 {
                    background-color: var(--primary-accent) !important;
                  }
                  .bg-amber-600 {
                    background-color: var(--primary-accent-dark) !important;
                  }
                  .hover\\:bg-amber-600:hover {
                    background-color: var(--primary-accent-dark) !important;
                  }
                  .hover\\:bg-amber-500:hover {
                    background-color: var(--primary-accent) !important;
                  }
                  .bg-amber-500\\/10 {
                    background-color: rgba(var(--primary-accent-rgb), 0.1) !important;
                  }
                  .bg-amber-500\\/5 {
                    background-color: rgba(var(--primary-accent-rgb), 0.05) !important;
                  }

                  /* Border overrides */
                  .border-amber-500 {
                    border-color: var(--primary-accent) !important;
                  }
                  .border-amber-500\\/20 {
                    border-color: rgba(var(--primary-accent-rgb), 0.2) !important;
                  }
                  .border-amber-500\\/30 {
                    border-color: rgba(var(--primary-accent-rgb), 0.3) !important;
                  }
                  .border-amber-600 {
                    border-color: var(--primary-accent-dark) !important;
                  }

                  /* Ring & focus overrides */
                  .focus-visible\\:ring-amber-500:focus-visible {
                    --tw-ring-color: var(--primary-accent) !important;
                    border-color: var(--primary-accent) !important;
                  }
                  .focus\\:ring-amber-500:focus {
                    --tw-ring-color: var(--primary-accent) !important;
                    border-color: var(--primary-accent) !important;
                  }
                  .focus\\:border-amber-500:focus {
                    border-color: var(--primary-accent) !important;
                  }

                  /* Accent color */
                  .accent-amber-500 {
                    accent-color: var(--primary-accent) !important;
                  }

                  /* Gradient overrides */
                  .from-amber-500 {
                    --tw-gradient-from: var(--primary-accent) !important;
                    --tw-gradient-to: rgba(var(--primary-accent-rgb), 0) !important;
                    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
                  }
                  .from-amber-500\\/10 {
                    --tw-gradient-from: rgba(var(--primary-accent-rgb), 0.1) !important;
                  }
                  .to-yellow-600 {
                    --tw-gradient-to: var(--primary-accent-light) !important;
                  }
                  .hover\\:from-amber-600:hover {
                    --tw-gradient-from: var(--primary-accent-dark) !important;
                  }
                  .hover\\:to-yellow-700:hover {
                    --tw-gradient-to: var(--primary-accent) !important;
                  }

                  /* Shadows */
                  .shadow-amber-500\\/10 {
                    --tw-shadow-color: rgba(var(--primary-accent-rgb), 0.1) !important;
                  }
                  .shadow-amber-500\\/20 {
                    --tw-shadow-color: rgba(var(--primary-accent-rgb), 0.2) !important;
                  }

                  /* Custom transitions and glow overrides */
                  .group-hover\\/brand\\:text-amber-400 {
                    color: var(--primary-accent-light) !important;
                  }
                  .group-hover\\/brand\\:drop-shadow-\\[0_0_8px_rgba\\(var\\(--primary-accent-rgb\\)\\,0\\.6\\)\\] {
                    filter: drop-shadow(0 0 8px rgba(var(--primary-accent-rgb), 0.6)) !important;
                  }
                `
              }} />
            );
          })()}
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-[#0B0F19] border-t border-slate-800/80 py-3 px-4 text-center text-xs text-slate-500">
          <p>{store?.name || 'BarrelFlow'} POS v4.0 | Premium Liquor Operating System</p>
        </footer>
      </div>
    </div>
  )
}
