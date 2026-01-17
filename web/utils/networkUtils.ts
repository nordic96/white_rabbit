import { API_KEY } from '@/config';
import type { ErrorResponse } from '@/types/errorResponse';
import { URL } from 'url';

/**
 * Base API Error class that wraps backend error responses
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly error: string;
  public readonly details?: Record<string, unknown>;
  public readonly path?: string;

  constructor(response: ErrorResponse) {
    super(response.message);
    this.name = 'ApiError';
    this.statusCode = response.status_code;
    this.error = response.error;
    this.details = response.details;
    this.path = response.path;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Database connection error (503)
 */
export class DatabaseConnectionError extends ApiError {
  constructor(response: ErrorResponse) {
    super(response);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Database query error (500)
 */
export class DatabaseQueryError extends ApiError {
  constructor(response: ErrorResponse) {
    super(response);
    this.name = 'DatabaseQueryError';
  }
}

/**
 * Resource not found error (404)
 */
export class ResourceNotFoundError extends ApiError {
  constructor(response: ErrorResponse) {
    super(response);
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * Validation error with field-level details (422)
 */
export class ValidationError extends ApiError {
  public readonly errors?: Array<{
    field?: string;
    message: string;
    type?: string;
  }>;

  constructor(response: ErrorResponse) {
    super(response);
    this.name = 'ValidationError';
    // Extract validation errors from details if available
    if (response.details && 'errors' in response.details) {
      this.errors = response.details.errors as Array<{
        field?: string;
        message: string;
        type?: string;
      }>;
    }
  }
}

/**
 * Invalid node type error (400)
 */
export class InvalidNodeTypeError extends ApiError {
  constructor(response: ErrorResponse) {
    super(response);
    this.name = 'InvalidNodeTypeError';
  }
}

/**
 * Invalid parameter error (400)
 */
export class InvalidParameterError extends ApiError {
  constructor(response: ErrorResponse) {
    super(response);
    this.name = 'InvalidParameterError';
  }
}

/**
 * Map error types to their corresponding exception classes
 */
const ERROR_CLASS_MAP: Record<string, typeof ApiError> = {
  DatabaseConnectionError,
  DatabaseQueryError,
  ResourceNotFoundError,
  ValidationError,
  InvalidNodeTypeError,
  InvalidParameterError,
};

/**
 * Create an appropriate ApiError instance based on the error response
 */
function createApiError(errorResponse: ErrorResponse): ApiError {
  const ErrorClass = ERROR_CLASS_MAP[errorResponse.error] || ApiError;
  return new ErrorClass(errorResponse);
}

/**
 * Success response type
 */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

/**
 * Error response type
 */
export interface ApiFailure {
  ok: false;
  error: ApiError;
}

/**
 * Discriminated union for API responses
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/**
 * Fetch API wrapper that handles error responses consistently
 *
 * @param url - The URL to fetch from
 * @param options - Optional fetch configuration
 * @returns A discriminated union with success or error
 *
 * @example
 * ```typescript
 * const result = await fetchApi<Mystery>('/api/mysteries/123');
 * if (result.ok) {
 *   console.log(result.data); // Type-safe access to Mystery
 * } else {
 *   console.error(result.error.message);
 *   if (result.error instanceof ResourceNotFoundError) {
 *     // Handle 404
 *   }
 * }
 * ```
 */
export async function fetchApi<T>(
  url: string | URL,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'X-API-Key': API_KEY }),
        ...options?.headers,
      },
    });

    // Parse JSON response
    const data = await response.json();

    if (response.ok) {
      return {
        ok: true,
        data: data as T,
      };
    }

    // Handle error response
    const errorResponse = data as ErrorResponse;
    const error = createApiError(errorResponse);

    return {
      ok: false,
      error,
    };
  } catch (err) {
    // Handle network errors or JSON parsing errors
    const networkError = new ApiError({
      error: 'NetworkError',
      message:
        err instanceof Error ? err.message : 'An unexpected error occurred',
      status_code: 0,
    });

    return {
      ok: false,
      error: networkError,
    };
  }
}
