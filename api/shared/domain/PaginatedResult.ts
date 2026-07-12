/**
 * PaginatedResult<T> — cross-bounded-context pagination contract.
 *
 * Every list query (findAll) in the domain layer returns this shape.
 * Repositories compute meta from count() + findMany(), controllers
 * serialize to { data, meta } for the API response.
 *
 * Located in api/shared/domain/ because it is imported by all three
 * bounded contexts (clients, pets, services).
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
