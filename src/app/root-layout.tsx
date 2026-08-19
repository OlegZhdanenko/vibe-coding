import { Outlet } from 'react-router-dom'
import { ScrollManager } from '@/components/common/scroll-manager'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/auth-provider'

/**
 * Wraps every route. Providers live here rather than around the router so that
 * route `errorElement`s still render inside them.
 */
export function RootLayout() {
  return (
    <AuthProvider>
      <a
        href="#main"
        className="bg-primary text-primary-foreground focus:ring-ring sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
      >
        Skip to content
      </a>
      <ScrollManager />
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  )
}
