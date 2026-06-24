'use client'

import { useEffect } from 'react'
import { initMockFetch, shouldEnableMockApi } from '@/lib/mock-fetch'

// Initialize immediately at import time to intercept early fetches in local/demo mode.
if (typeof window !== 'undefined' && shouldEnableMockApi) {
  initMockFetch()
}

export function MockFetchProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (shouldEnableMockApi) {
      initMockFetch()
    }
  }, [])

  return <>{children}</>
}
