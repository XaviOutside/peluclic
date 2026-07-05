import { Service, CreateServiceInput } from '../domain/Service';
import { IServiceRepository } from '../domain/IServiceRepository';
import { ValidationError } from '@api/shared/domain/errors';

const MAX_NAME_LENGTH = 255;

export class CreateServiceUseCase {
  constructor(private readonly repository: IServiceRepository) {}

  async execute(input: CreateServiceInput): Promise<Service> {
    if (!input.name || !input.name.trim()) {
      throw new ValidationError('Name is required');
    }

    if (input.name.trim().length > MAX_NAME_LENGTH) {
      throw new ValidationError(`Name must be 255 characters or fewer`);
    }

    if (input.price < 0) {
      throw new ValidationError('Price must be a non-negative integer');
    }

    if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
      if (input.durationMinutes <= 0) {
        throw new ValidationError('Duration must be a positive integer');
      }
    }

    return this.repository.create(input);
  }
}
