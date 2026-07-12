# Client Management Backend Specification

## Purpose

REST API for Client CRUD + search at `/api/v1/clients`, returning paginated results with metadata.

## Requirements

### Requirement: Paginated List Clients

`GET /api/v1/clients?page=1&limit=20&status=active` MUST return `{ data: ClientResponseDto[], meta: { total: number, page: number, limit: number, totalPages: number } }`. The repository MUST call `count()` alongside `findMany`, using the same `WHERE deleted_at IS NULL` filter. `meta.totalPages` MUST equal `Math.ceil(total / limit)`. Defaults: `page=1`, `limit=20`.

| Scenario | GIVEN | WHEN | THEN |
|---|---|---|---|
| Paginated with metadata | 42 non-deleted clients | `GET /api/v1/clients?page=2&limit=10` | `meta={total:42,page:2,limit:10,totalPages:5}` |
| Empty list | 0 clients | `GET /api/v1/clients` | `data=[], meta={total:0,page:1,limit:20,totalPages:0}` |
| Count excludes deleted | 5 active + 2 deleted | `GET /api/v1/clients` | `meta.total=5` |
| Last partial page | 25 clients | `GET /api/v1/clients?page=2&limit=20` | `meta.totalPages=2`, 5 items in data |
