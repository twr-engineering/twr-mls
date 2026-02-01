/**
 * Standardized error handling utilities for the MLS application
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHORIZATION_FAILED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SERVER_ERROR'

export type AppError = {
  code: ErrorCode
  message: string
  details?: Record<string, unknown>
  statusCode: number
}

/**
 * Create a standardized validation error
 */
export function createValidationError(message: string, details?: Record<string, unknown>): AppError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    details,
    statusCode: 400,
  }
}

/**
 * Create a standardized authentication error
 */
export function createAuthenticationError(
  message = 'Authentication required',
): AppError {
  return {
    code: 'AUTHENTICATION_REQUIRED',
    message,
    statusCode: 401,
  }
}

/**
 * Create a standardized authorization error
 */
export function createAuthorizationError(
  message = 'You do not have permission to perform this action',
): AppError {
  return {
    code: 'AUTHORIZATION_FAILED',
    message,
    statusCode: 403,
  }
}

/**
 * Create a standardized not found error
 */
export function createNotFoundError(
  resource: string,
  identifier?: string | number,
): AppError {
  const message = identifier
    ? `${resource} with identifier "${identifier}" not found`
    : `${resource} not found`

  return {
    code: 'NOT_FOUND',
    message,
    statusCode: 404,
  }
}

/**
 * Create a standardized conflict error
 */
export function createConflictError(message: string, details?: Record<string, unknown>): AppError {
  return {
    code: 'CONFLICT',
    message,
    details,
    statusCode: 409,
  }
}

/**
 * Create a standardized server error
 */
export function createServerError(
  message = 'An unexpected error occurred',
  details?: Record<string, unknown>,
): AppError {
  return {
    code: 'SERVER_ERROR',
    message,
    details,
    statusCode: 500,
  }
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: AppError | Error): {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
} {
  if ('code' in error && 'statusCode' in error) {
    // AppError
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    }
  }

  // Standard Error
  return {
    error: {
      code: 'SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    },
  }
}

/**
 * Log error with context
 */
export function logError(
  error: Error | AppError,
  context?: {
    operation?: string
    user?: string
    resource?: string
    [key: string]: unknown
  },
): void {
  const timestamp = new Date().toISOString()
  const errorInfo = {
    timestamp,
    message: error.message,
    ...(context && { context }),
    ...('stack' in error && { stack: error.stack }),
    ...('code' in error && { code: error.code }),
    ...('details' in error && { details: error.details }),
  }

  console.error('[MLS Error]', JSON.stringify(errorInfo, null, 2))
}

/**
 * Handle errors in API routes
 */
export function handleApiError(
  error: unknown,
  context?: {
    operation?: string
    user?: string
    resource?: string
    [key: string]: unknown
  },
): {
  response: ReturnType<typeof formatErrorResponse>
  statusCode: number
} {
  // Convert unknown error to Error or AppError
  let appError: AppError

  if (error instanceof Error) {
    // Check if it's already an AppError
    if ('code' in error && 'statusCode' in error) {
      appError = error as AppError
    } else {
      // Convert standard Error to AppError
      appError = createServerError(error.message)
    }
  } else if (typeof error === 'string') {
    appError = createServerError(error)
  } else {
    appError = createServerError('An unexpected error occurred')
  }

  // Log the error
  logError(appError, context)

  // Return formatted response
  return {
    response: formatErrorResponse(appError),
    statusCode: appError.statusCode,
  }
}
