import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorState } from '@/components/common/error-state'
import { toUserMessage } from '@/lib/errors'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
  /** Rendering a link is unsafe above the router, so it is opt-in. */
  showHomeLink?: boolean
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time crashes that React Router's `errorElement` cannot see
 * (anything thrown below a route element, including in event-free renders).
 * This is the last line of defence against a blank page.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Swap for a real reporter (Sentry, LogRocket) when one is wired up.
    console.error('Unhandled render error:', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  override render() {
    const { error } = this.state
    const { children, fallback, showHomeLink = false } = this.props

    if (!error) return children
    if (fallback) return fallback(error, this.reset)

    return (
      <div className="flex min-h-screen items-center justify-center">
        <ErrorState
          title="This page crashed"
          description={toUserMessage(error)}
          detail={import.meta.env.DEV ? error.stack : undefined}
          onRetry={() => window.location.reload()}
          retryLabel="Reload page"
          showHomeLink={showHomeLink}
        />
      </div>
    )
  }
}
