import { LayoutDashboard, Sparkles, User } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { SiteHeader, type NavItem } from '@/components/layout/site-header'
import { cn } from '@/lib/utils'

const APP_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Profile', to: '/profile' },
  { label: 'Plans', to: '/pricing' },
]

const ICONS = {
  '/dashboard': LayoutDashboard,
  '/profile': User,
  '/pricing': Sparkles,
} as const

/**
 * Signed-in shell. A horizontal nav strip rather than a sidebar — it collapses
 * to a scrollable row on phones without a second layout to maintain.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader navItems={APP_NAV} />

      <div className="border-border bg-background/60 sticky top-16 z-40 border-b backdrop-blur-md">
        <nav
          aria-label="Workspace"
          className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {APP_NAV.map((item) => {
            const Icon = ICONS[item.to as keyof typeof ICONS]
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-foreground'
                      : 'text-muted-foreground hover:text-foreground border-transparent',
                  )
                }
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
