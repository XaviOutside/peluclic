import { CompanySettings } from '../domain/CompanySettings';
import { ISettingsRepository } from '../domain/ISettingsRepository';
import { SettingsNotFoundError } from '../domain/SettingsErrors';

export class GetSettingsUseCase {
  constructor(private readonly repository: ISettingsRepository) {}

  async execute(): Promise<CompanySettings> {
    const settings = await this.repository.findSettings();

    if (!settings) {
      throw new SettingsNotFoundError();
    }

    return settings;
  }
}
