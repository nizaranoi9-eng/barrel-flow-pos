'use client'

import { useSyncExternalStore, useEffect } from 'react'
import { useAuthStore, useUIStore } from '@/lib/store'
import { Toaster } from '@/components/ui/sonner'
import { AuthView } from '@/components/views/AuthView'
import { DashboardView } from '@/components/views/DashboardView'
import { POSView } from '@/components/views/POSView'
import { ProductsView } from '@/components/views/ProductsView'
import { TransactionsView } from '@/components/views/TransactionsView'
import { CustomersView } from '@/components/views/CustomersView'
import { ReportsView } from '@/components/views/ReportsView'
import { SettingsView } from '@/components/views/SettingsView'
import { PromotionsView } from '@/components/views/PromotionsView'
import { MainLayout } from '@/components/layout/MainLayout'
import { initMockFetch, shouldEnableMockApi } from '@/lib/mock-fetch'

// Custom hook to safely check if we're on the client
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export default function Home() {
  const { isAuthenticated, setUser, setStore, setSettings, logout } = useAuthStore()
  const { activeTab } = useUIStore()
  const isClient = useIsClient()

  useEffect(() => {
    if (isClient && shouldEnableMockApi) {
      initMockFetch()
    }

    if (isAuthenticated && isClient) {
      const syncSession = async () => {
        try {
          const res = await fetch('/api/auth/session')
          const data = await res.json()
          if (data.success && data.data) {
            setUser(data.data.user)
            setStore(data.data.store)
            if (data.data.settings) setSettings(data.data.settings)
          } else {
            logout()
          }
        } catch (e) {
          console.error('Failed to sync session:', e)
        }
      }
      syncSession()
    }
  }, [isAuthenticated, isClient, setUser, setStore, setSettings, logout])

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        <AuthView />
        <Toaster />
      </>
    )
  }

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />
      case 'pos':
        return <POSView />
      case 'transactions':
        return <TransactionsView />
      case 'orders-dummy':
        return <TransactionsView />
      case 'products':
        return <ProductsView />
      case 'customers':
        return <CustomersView />
      case 'promotions':
        return <PromotionsView />
      case 'reports':
        return <ReportsView />
      case 'settings':
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <>
      <MainLayout>
        {renderView()}
      </MainLayout>
      <Toaster />
    </>
  )
}
