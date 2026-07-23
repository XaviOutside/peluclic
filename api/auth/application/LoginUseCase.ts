import { IAuthRepository } from '../domain/IAuthRepository';
import { IPasswordService } from '../domain/IPasswordService';
import { InvalidCredentialsError } from '../domain/AuthErrors';

/** Default session duration in hours. Overridable via env var in infrastructure layer. */
const DEFAULT_SESSION_DURATION_HOURS = 24;

export interface LoginResult {
  token: string;
  user: {
    id: number;
    email: string;
    role: number;
    companyId: number;
    companyName: string;
  };
}

export class LoginUseCase {
  constructor(
    private readonly repository: IAuthRepository,
    private readonly passwordService: IPasswordService,
    private readonly sessionDurationHours: number = DEFAULT_SESSION_DURATION_HOURS,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    if (!email || !email.trim()) {
      throw new Error('Email is required');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const user = await this.repository.findUserByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordService.verify(password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const expiresAt = new Date(Date.now() + this.sessionDurationHours * 60 * 60 * 1000);
    const session = await this.repository.createSession(user.id, user.companyId, expiresAt);

    return {
      token: session.token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.companyName,
      },
    };
  }
}
