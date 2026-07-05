import { Pet, UpdatePetInput } from '../domain/Pet';
import { IPetRepository } from '../domain/IPetRepository';
import { PetNotFoundError, PetValidationError } from '../domain/PetErrors';

export class UpdatePetUseCase {
  constructor(private readonly repository: IPetRepository) {}

  async execute(id: number, input: Omit<UpdatePetInput, 'status'>): Promise<Pet> {
    const pet = await this.repository.findById(id);

    if (!pet || pet.deletedAt !== null) {
      throw new PetNotFoundError(id);
    }

    // Validate client_id if provided
    if (input.client_id !== undefined) {
      const clientIsActive = await this.repository.clientExistsAndIsActive(input.client_id);
      if (!clientIsActive) {
        throw new PetValidationError('client_id is not an active client');
      }
    }

    // Build update data with only the allowed fields
    const { name, species, breed, client_id, sex, dateOfBirth, weightKg, notes } = input;
    const updateData: Omit<UpdatePetInput, 'status'> = {};

    if (name !== undefined) updateData.name = name;
    if (species !== undefined) updateData.species = species;
    if (breed !== undefined) updateData.breed = breed;
    if (client_id !== undefined) updateData.client_id = client_id;
    if (sex !== undefined) updateData.sex = sex;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (weightKg !== undefined) updateData.weightKg = weightKg;
    if (notes !== undefined) updateData.notes = notes;

    return this.repository.update(id, updateData);
  }
}
