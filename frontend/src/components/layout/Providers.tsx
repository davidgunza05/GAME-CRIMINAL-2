'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'

// QueryClient fora do componente — singleton, sem recriar a cada render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000,        // 1 min — menos refetches
      gcTime: 5 * 60 * 1000,       // 5 min em cache
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrateFromServer)
  const hydrated = useRef(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true
      hydrate().finally(() => setReady(true))
    }
  }, [hydrate])

  // Aguarda hidratação antes de renderizar — evita flash de redirect
  if (!ready) return null

  return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>
        {children}
      </AuthHydrator>
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
