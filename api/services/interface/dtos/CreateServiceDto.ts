/**
 * Request DTO for creating a new service.
 * Fields use camelCase for the API boundary — the controller maps to
 * snake_case domain inputs before passing to the use case.
 *
 * Price is in dollar format (e.g. 49.99) — controller converts to cents.
 */
export interface CreateServiceDto {
  /** Service name — required, 1-255 chars */
  name: string;
  /** Description — optional */
  description?: string;
  /** Duration in minutes — optional, positive integer */
  durationMinutes?: number;
  /** Price in dollars — required, non-negative; controller converts to cents */
  price: number;
  /** Optional pet to link this service to */
  petId?: number;
}
