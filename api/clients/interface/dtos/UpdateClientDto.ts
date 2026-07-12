/**
 * Request DTO for updating an existing client.
 * All fields are optional. status is intentionally excluded —
 * deactivation is handled exclusively via PATCH /:id/deactivate.
 */
export interface UpdateClientDto {
  /** Updated name — optional */
  name?: string;
  /** Updated email — optional */
  email?: string;
  /** Updated primary phone — optional */
  phone?: string;
  /** Updated secondary phone — optional, null to clear */
  phone2?: string | null;
  /** Updated address — optional, null to clear */
  address?: string | null;
  /** Updated notes — optional, null to clear */
  notes?: string | null;
}
