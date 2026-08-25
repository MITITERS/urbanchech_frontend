import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from './AuthProvider'
import { QueryProvider } from './QueryProvider'

/**
 * Composition root for every cross-cutting provider. Order matters:
 * `AuthProvider` uses the query client, and both need the router to be able to
 * redirect.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryProvider>
    </BrowserRouter>
  )
}
