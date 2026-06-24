import { Client, CLIENT_STATUS } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError } from '../domain/ClientErrors';

export class DeactivateClientUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(id: number): Promise<Client> {
    const client = await this.repository.findById(id);

    if (!client || client.deletedAt !== null) {
      throw new ClientNotFoundError(id);
    }

    return this.repository.update(id, { status: CLIENT_STATUS.INACTIVE });
  }
}
