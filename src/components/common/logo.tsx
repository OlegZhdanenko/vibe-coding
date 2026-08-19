import { Link } from 'react-router-dom'
import { env } from '@/lib/env'
import { cn } from '@/lib/utils'

interface LogoProps {
  to?: string
  className?: string
  /** Hide the wordmark on narrow screens without hiding it from screen readers. */
  collapsible?: boolean
}

export function Logo({ to = '/', className, collapsible = false }: LogoProps) {
  return (
    <Link
      to={to}
      className={cn('group flex items-center gap-2 font-semibold tracking-tight', className)}
    >
      <span
        aria-hidden="true"
        className="from-primary flex size-8 items-center justify-center rounded-lg bg-gradient-to-br to-fuchsia-500 text-white shadow-sm transition-transform group-hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="none" className="size-4.5">
          <path
            d="M3 7.5 12 13l9-5.5M3.6 5h16.8A1.6 1.6 0 0 1 22 6.6v10.8a1.6 1.6 0 0 1-1.6 1.6H3.6A1.6 1.6 0 0 1 2 17.4V6.6A1.6 1.6 0 0 1 3.6 5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className={cn('text-lg', collapsible && 'sr-only sm:not-sr-only')}>{env.appName}</span>
    </Link>
  )
}
