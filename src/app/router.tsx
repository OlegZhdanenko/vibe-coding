import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/app/root-layout'
import { RouteError } from '@/components/common/route-error'
import { AppLayout } from '@/components/layout/app-layout'
import { AuthLayout } from '@/components/layout/auth-layout'
import { PublicLayout } from '@/components/layout/public-layout'
import { RequireAuth, RequireGuest } from '@/features/auth/route-guards'

/**
 * Every page is code-split. `errorElement` sits on the root so a throw anywhere
 * below it renders the error panel inside the providers instead of a blank page.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, lazy: () => import('@/pages/landing').then(toRoute) },
          { path: 'pricing', lazy: () => import('@/pages/pricing').then(toRoute) },
        ],
      },
      {
        element: <RequireGuest />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: 'login', lazy: () => import('@/pages/login').then(toRoute) },
              { path: 'signup', lazy: () => import('@/pages/signup').then(toRoute) },
            ],
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: 'dashboard', lazy: () => import('@/pages/dashboard').then(toRoute) },
              { path: 'profile', lazy: () => import('@/pages/profile').then(toRoute) },
            ],
          },
        ],
      },
      {
        element: <PublicLayout />,
        children: [{ path: '*', lazy: () => import('@/pages/not-found').then(toRoute) }],
      },
    ],
  },
])

/** Adapt a default-exported page component to a lazy route object. */
function toRoute(module: { default: React.ComponentType }) {
  return { Component: module.default }
}
