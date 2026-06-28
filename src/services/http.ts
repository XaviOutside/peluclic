import type { ApiError } from '@/shared/types';

const BASE_URL = '/api/v1';

/**
 * Thin wrapper around fetch with:
 * - Base URL prefix (/api/v1)
 * - JSON content-type headers
 * - Structured error normalization (ApiError)
 * - Empty response handling (204 No Content)
 */
export class HttpError extends Error {
  public statusCode: number;
  public fieldErrors?: Record<string, string>;

  constructor(statusCode: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const body = await res.json() as Partial<ApiError>;
    return {
      error: body.error ?? `Request failed with status ${res.status}`,
      statusCode: res.status,
      fieldErrors: body.fieldErrors,
    };
  } catch {
    return {
      error: `Request failed with status ${res.status}`,
      statusCode: res.status,
    };
  }
}

export async function http<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customHeaders as Record<string, string> | undefined),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorPayload = await parseErrorResponse(response);
    throw new HttpError(
      errorPayload.statusCode ?? response.status,
      errorPayload.error,
      errorPayload.fieldErrors,
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
