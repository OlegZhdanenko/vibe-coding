import { Link } from 'react-router-dom'
import { Logo } from '@/components/common/logo'
import { env } from '@/lib/env'

const LINK_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', to: '/#features' },
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/signup' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Profile', to: '/profile' },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-border bg-muted/30 border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="text-muted-foreground mt-3 max-w-xs text-sm text-pretty">
            Draft the email you have been putting off. Pick a topic, a tone and a length — get a
            send-ready message in seconds.
          </p>
        </div>

        {LINK_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-border mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 border-t px-4 py-6 sm:flex-row sm:px-6">
        <p className="text-muted-foreground text-xs">
          © {new Date().getFullYear()} {env.appName}. Built as a test assignment.
        </p>
        <p className="text-muted-foreground text-xs">Powered by Gemini</p>
      </div>
    </footer>
  )
}
