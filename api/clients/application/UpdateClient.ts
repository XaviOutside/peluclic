import { Client, UpdateClientInput } from '../domain/Client';
import { IClientRepository } from '../domain/IClientRepository';
import { ClientNotFoundError } from '../domain/ClientErrors';

export class UpdateClientUseCase {
  constructor(private readonly repository: IClientRepository) {}

  async execute(id: number, input: Omit<UpdateClientInput, 'status'>): Promise<Client> {
    const client = await this.repository.findById(id);

    if (!client || client.deletedAt !== null) {
      throw new ClientNotFoundError(id);
    }

    // Explicitly exclude status — status changes only via DeactivateClient
    const { name, email, phone, phone2, address, notes } = input;
    const updateData: Omit<UpdateClientInput, 'status'> = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (phone2 !== undefined) updateData.phone2 = phone2;
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;

    return this.repository.update(id, updateData);
  }
}
