/**
 * A single error vocabulary for the whole app.
 *
 * Anything that can fail — Supabase auth, the generation endpoint, a route
 * loader — is normalised into an `AppError` so the UI never has to guess what
 * shape it received, and the user never sees a raw stack trace.
 */

export type AppErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'invalid_input'
  | 'not_configured'
  | 'provider_error'
  | 'unknown'

export class AppError extends Error {
  readonly code: AppErrorCode
  /** Safe to render verbatim; `message` may carry developer detail. */
  readonly userMessage: string
  readonly status?: number
  override readonly cause?: unknown

  constructor(
    code: AppErrorCode,
    userMessage: string,
    options: { message?: string; status?: number; cause?: unknown } = {},
  ) {
    super(options.message ?? userMessage)
    this.name = 'AppError'
    this.code = code
    this.userMessage = userMessage
    this.status = options.status
    this.cause = options.cause
  }
}

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  network: 'Cannot reach the server. Check your connection and try again.',
  unauthorized: 'Your session has expired. Please sign in again.',
  forbidden: 'You do not have access to this resource.',
  not_found: 'We could not find what you were looking for.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  quota_exceeded: 'You have used all generations on your current plan.',
  invalid_input: 'Some of the details you entered are not valid.',
  not_configured: 'This feature is not configured on this deployment yet.',
  provider_error: 'The AI provider could not complete this request.',
  unknown: 'Something went wrong on our side. Please try again.',
}

/** Map an HTTP status onto the closest error code. */
export function codeFromStatus(status: number): AppErrorCode {
  if (status === 400 || status === 422) return 'invalid_input'
  if (status === 401) return 'unauthorized'
  if (status === 402) return 'quota_exceeded'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 429) return 'rate_limited'
  if (status >= 500) return 'provider_error'
  return 'unknown'
}

export function appError(
  code: AppErrorCode,
  options: { userMessage?: string; message?: string; status?: number; cause?: unknown } = {},
): AppError {
  const { userMessage, ...rest } = options
  return new AppError(code, userMessage ?? DEFAULT_MESSAGES[code], rest)
}

/** Turn anything thrown into a message that is safe to show a user. */
export function toUserMessage(error: unknown): string {
  if (error instanceof AppError) return error.userMessage
  if (error instanceof TypeError && /fetch|network/i.test(error.message)) {
    return DEFAULT_MESSAGES.network
  }
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return DEFAULT_MESSAGES.unknown
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  return appError('unknown', { userMessage: toUserMessage(error), cause: error })
}
