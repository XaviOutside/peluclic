/**
 * Shared frontend types used across multiple domains.
 */

/** Paginated API response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Structured error returned by the service layer. */
export interface ApiError {
  error: string;
  statusCode?: number;
  fieldErrors?: Record<string, string>;
}
