/**
 * Shared API types and error classes for both client and server usage.
 * This file is safe to import in client components.
 */

import type { ErrorResponse } from '@/types/errorResponse';

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
export function createApiError(errorResponse: ErrorResponse): ApiError {
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
