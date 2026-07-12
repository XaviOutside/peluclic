/**
 * Shared pagination types for the frontend.
 *
 * PaginatedResponse<T> mirrors the backend shape:
 *   { data: T[], meta: { total, page, limit, totalPages } }
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
