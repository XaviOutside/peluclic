import { Service, UpdateServiceInput } from '../domain/Service';
import { IServiceRepository } from '../domain/IServiceRepository';
import { NotFoundError, ValidationError } from '@api/shared/domain/errors';

const MAX_NAME_LENGTH = 255;

export class UpdateServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(id: number, input: UpdateServiceInput): Promise<Service> {
    // status is accepted internally for DeactivateService but must not leak
    // through the public update endpoint — the controller layer strips it.
    const service = await this.repository.findById(id);

    if (!service || service.deletedAt !== null) {
      throw new NotFoundError('Service', id);
    }

    // Validate provided fields
    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new ValidationError('Name is required');
      }
      if (input.name.trim().length > MAX_NAME_LENGTH) {
        throw new ValidationError(`Name must be 255 characters or fewer`);
      }
    }

    if (input.price !== undefined && input.price < 0) {
      throw new ValidationError('Price must be a non-negative integer');
    }

    if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
      if (input.durationMinutes <= 0) {
        throw new ValidationError('Duration must be a positive integer');
      }
    }

    const { name, description, durationMinutes, price, status } = input;
    const updateData: UpdateServiceInput = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (durationMinutes !== undefined) updateData.durationMinutes = durationMinutes;
    if (price !== undefined) updateData.price = price;
    if (status !== undefined) updateData.status = status;

    return this.repository.update(id, updateData);
  }
}
