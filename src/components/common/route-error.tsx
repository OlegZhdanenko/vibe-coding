import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { ErrorState } from '@/components/common/error-state'
import { toUserMessage } from '@/lib/errors'

/**
 * `errorElement` for every route. Turns thrown responses (404/401/500) and
 * loader exceptions into the same friendly panel.
 */
export function RouteError() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    const isNotFound = error.status === 404
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <ErrorState
          title={isNotFound ? 'Page not found' : `Error ${error.status}`}
          description={
            isNotFound
              ? 'The page you are looking for does not exist or has been moved.'
              : (error.statusText ?? 'The request could not be completed.')
          }
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <ErrorState
        description={toUserMessage(error)}
        detail={import.meta.env.DEV && error instanceof Error ? error.stack : undefined}
        onRetry={() => window.location.reload()}
        retryLabel="Reload page"
      />
    </div>
  )
}
