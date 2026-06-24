import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError, ClientAlreadyDeletedError } from '../domain/ClientErrors';

export class SoftDeleteClientUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(id: number): Promise<void> {
    const client = await this.repository.findById(id);

    if (!client) {
      throw new ClientNotFoundError(id);
    }

    if (client.deletedAt !== null) {
      throw new ClientAlreadyDeletedError(id);
    }

    await this.repository.softDelete(id);
  }
}
