import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  description: string
  /** Rendered in a collapsed <details> — developer detail, never shown by default. */
  detail?: string
  onRetry?: () => void
  retryLabel?: string
  showHomeLink?: boolean
  className?: string
}

/**
 * The single visual treatment for every failure in the app: route errors,
 * render crashes, failed requests and empty-but-broken states all land here.
 */
export function ErrorState({
  title = 'Something went wrong',
  description,
  detail,
  onRetry,
  retryLabel = 'Try again',
  showHomeLink = true,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive mb-5 flex size-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm text-pretty">{description}</p>

      {detail ? (
        <details className="text-muted-foreground mt-4 w-full text-left text-xs">
          <summary className="cursor-pointer select-none">Technical details</summary>
          <pre className="bg-muted mt-2 max-h-48 overflow-auto rounded-md p-3 whitespace-pre-wrap">
            {detail}
          </pre>
        </details>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry ? (
          <Button onClick={onRetry}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {retryLabel}
          </Button>
        ) : null}
        {showHomeLink ? (
          <Button variant={onRetry ? 'outline' : 'default'} asChild>
            <Link to="/">
              <Home className="size-4" aria-hidden="true" />
              Back to home
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
