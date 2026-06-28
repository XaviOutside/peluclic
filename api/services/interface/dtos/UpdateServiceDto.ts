/**
 * Request DTO for updating an existing service.
 * All fields are optional. status is intentionally excluded —
 * deactivation is handled exclusively via PATCH /:id/deactivate.
 *
 * Price is in dollar format — controller converts to cents.
 */
export interface UpdateServiceDto {
  /** Updated name — optional, 1-255 chars */
  name?: string;
  /** Updated description — optional */
  description?: string | null;
  /** Updated duration in minutes — optional, positive integer */
  durationMinutes?: number | null;
  /** Updated price in dollars — optional, non-negative */
  price?: number;
  /** Link service to a pet (set to null to unlink) */
  petId?: number | null;
}
