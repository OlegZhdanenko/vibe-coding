import { Sparkles } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { Logo } from '@/components/common/logo'
import { ThemeToggle } from '@/components/common/theme-toggle'

const HIGHLIGHTS = [
  'Send-ready drafts in about ten seconds',
  'Nine tones, from formal to apologetic',
  'Every draft saved to your history',
]

/**
 * Split layout for sign-in and sign-up: the form stays centred and full-width
 * on phones, with the brand panel appearing only when there is room for it.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <Logo />
          <ThemeToggle />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </main>
        <p className="text-muted-foreground p-4 text-center text-xs sm:p-6">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>

      <aside className="from-primary relative hidden bg-gradient-to-br to-fuchsia-600 p-10 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-10" aria-hidden="true" />
        <div className="relative max-w-md">
          <Sparkles className="size-8" aria-hidden="true" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance">
            Stop staring at an empty draft.
          </h2>
          <p className="mt-3 text-white/80 text-pretty">
            Describe what you need to say. We handle the wording, the structure and the subject
            line — you review and send.
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/90">
                <span className="size-1.5 rounded-full bg-white/80" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  )
}
