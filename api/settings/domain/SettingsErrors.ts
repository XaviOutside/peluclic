/**
 * Domain errors for the settings bounded context.
 * These are pure error classes — no framework or DB imports.
 */

export class SettingsNotFoundError extends Error {
  constructor() {
    super('Company settings not found');
    this.name = 'SettingsNotFoundError';
  }
}

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettingsValidationError';
  }
}
