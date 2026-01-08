export interface ErrorResponse {
  error: string;
  message: string;
  status_code: number;
  details?: Record<string, unknown>;
  path?: string;
}
