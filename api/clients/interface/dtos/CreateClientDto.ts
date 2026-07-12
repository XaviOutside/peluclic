/**
 * Request DTO for creating a new client.
 * Validated and parsed in ClientController before passing to the use case.
 */
export interface CreateClientDto {
  /** Client full name — required, non-empty */
  name: string;
  /** Email address — required, must contain @ */
  email: string;
  /** Primary phone number — required, non-empty */
  phone: string;
  /** Secondary phone number — optional */
  phone2?: string;
  /** Physical address — optional */
  address?: string;
  /** Notes — optional */
  notes?: string;
}
