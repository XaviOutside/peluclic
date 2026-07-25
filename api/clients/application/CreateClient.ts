import { Client, CreateClientInput, CLIENT_STATUS } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { ClientValidationError } from '../domain/ClientErrors';

export class CreateClientUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(input: CreateClientInput): Promise<Client> {
    if (!input.name || !input.name.trim()) {
      throw new ClientValidationError('Name is required');
    }

    if (!input.email || !input.email.trim()) {
      throw new ClientValidationError('Email is required');
    }

    if (!input.email.includes('@')) {
      throw new ClientValidationError('Email must be a valid email address');
    }

    if (!input.phone || !input.phone.trim()) {
      throw new ClientValidationError('Phone is required');
    }

    if (input.consentGivenAt === null || input.consentGivenAt === undefined) {
      throw new ClientValidationError('GDPR consent is required');
    }

    if (isNaN(input.consentGivenAt.getTime())) {
      throw new ClientValidationError('GDPR consent must be a valid date');
    }

    return this.repository.create({
      ...input,
      // status defaults to ACTIVE — set by repository/DB default,
      // not passed here; domain enforces via CLIENT_STATUS constant
    });
  }
}

// Re-export for convenience
export { CLIENT_STATUS };
