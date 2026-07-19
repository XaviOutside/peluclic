import { CompanySettings, UpdateSettingsInput, validateUpdateInput } from '../domain/CompanySettings';
import { ISettingsRepository } from '../domain/ISettingsRepository';
import { SettingsValidationError } from '../domain/SettingsErrors';

export class UpdateSettingsUseCase {
  constructor(private readonly repository: ISettingsRepository) {}

  async execute(input: UpdateSettingsInput): Promise<CompanySettings> {
    const errors = validateUpdateInput(input);

    if (errors.length > 0) {
      throw new SettingsValidationError(errors.join('; '));
    }

    return this.repository.upsert(input);
  }
}
