/**
 * Client-side API utilities for making requests to Next.js API routes.
 * This file is safe to import in client components and stores.
 *
 * NOTE: This fetches from Next.js API routes (e.g., /api/mysteries),
 * NOT directly from the backend. The API routes handle backend authentication.
 */

import type { ErrorResponse } from '@/types/errorResponse';

import { ApiError, createApiError, type ApiResponse } from './apiTypes';

/**
 * Client-side fetch wrapper that handles error responses consistently.
 * Use this in stores, client components, and any browser-side code.
 *
 * This function calls Next.js API routes which proxy to the backend
 * with proper authentication. It does NOT include API keys.
 *
 * @param url - The URL to fetch from (should be a Next.js API route like /api/mysteries)
 * @param options - Optional fetch configuration
 * @returns A discriminated union with success or error
 *
 * @example
 * ```typescript
 * // In a Zustand store or client component
 * const result = await clientFetch<MysteryDetail>('/api/mysteries/123');
 * if (result.ok) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export async function clientFetch<T>(
  url: string | URL,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
