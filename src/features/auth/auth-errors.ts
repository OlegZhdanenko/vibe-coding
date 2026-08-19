import { AuthError } from '@supabase/supabase-js'
import { AppError, appError } from '@/lib/errors'

/**
 * Supabase returns terse, sometimes cryptic auth messages. Translate the ones
 * users actually hit into plain language; pass anything else through so we
 * never swallow a real diagnostic.
 */
export function mapAuthError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (error instanceof AuthError) {
    const message = error.message.toLowerCase()

    if (message.includes('invalid login credentials')) {
      return appError('unauthorized', {
        userMessage: 'Incorrect email or password.',
        cause: error,
      })
    }
    if (message.includes('email not confirmed')) {
      return appError('forbidden', {
        userMessage: 'Please confirm your email address before signing in.',
        cause: error,
      })
    }
    if (message.includes('already registered') || message.includes('already been registered')) {
      return appError('invalid_input', {
        userMessage: 'An account with this email already exists. Try signing in instead.',
        cause: error,
      })
    }
    if (message.includes('password') && message.includes('should be')) {
      return appError('invalid_input', {
        userMessage: 'That password is too weak. Use at least 8 characters.',
        cause: error,
      })
    }
    if (error.status === 429 || message.includes('rate limit')) {
      return appError('rate_limited', {
        userMessage: 'Too many attempts. Please wait a minute and try again.',
        cause: error,
      })
    }

    return appError('unknown', { userMessage: error.message, status: error.status, cause: error })
  }

  if (error instanceof Error) {
    return appError('unknown', { userMessage: error.message, cause: error })
  }

  return appError('unknown')
}
