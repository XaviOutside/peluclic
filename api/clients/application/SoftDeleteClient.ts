import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError, ClientAlreadyDeletedError } from '../domain/ClientErrors';
import { IPetRepository } from '../../pets/domain/IPetRepository';

export class SoftDeleteClientUseCase {
  constructor(
    private readonly repository: IClientRepository,
    private readonly petRepository: IPetRepository,
  ) {}

  async execute(id: number): Promise<void> {
    const exists = await this.repository.existsById(id);

    if (!exists) {
      throw new ClientNotFoundError(id);
    }

    const client = await this.repository.findById(id);

    if (!client) {
      throw new ClientAlreadyDeletedError(id);
    }

    await this.repository.softDelete(id);

    await this.petRepository.softDeleteAllByClientId(id);
  }
}
