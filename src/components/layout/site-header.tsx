import { Menu } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { UserNav } from '@/components/layout/user-nav'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  to: string
}

const MARKETING_NAV: NavItem[] = [
  { label: 'Features', to: '/#features' },
  { label: 'How it works', to: '/#how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'FAQ', to: '/#faq' },
]

/** Shared across the marketing site and the app; only the nav items differ. */
export function SiteHeader({ navItems = MARKETING_NAV }: { navItems?: NavItem[] }) {
  const { user, initialising } = useAuth()
  // Seeded from the real scroll position so a deep link that restores scroll
  // does not render a transparent header over content.
  const [scrolled, setScrolled] = useState(() => window.scrollY > 8)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-colors duration-200',
        scrolled
          ? 'bg-background/80 border-border border-b backdrop-blur-md'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.to} variant="ghost" size="sm" asChild>
              <Link to={item.to}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          {initialising ? (
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" aria-hidden="true" />
          ) : user ? (
            <UserNav />
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}

          {navItems.length > 0 ? (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.to}>
                    <Link
                      to={item.to}
                      className="hover:bg-accent rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                {!user && !initialising ? (
                  <SheetClose asChild>
                    <Link
                      to="/login"
                      className="hover:bg-accent rounded-md px-3 py-2.5 text-sm font-medium transition-colors sm:hidden"
                    >
                      Sign in
                    </Link>
                  </SheetClose>
                ) : null}
              </nav>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </div>
    </header>
  )
}
