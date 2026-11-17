const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE = (configuredBase || '/api').replace(/\/+$/, '');

interface ProblemBody {
  title?: unknown;
  detail?: unknown;
  errors?: unknown;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title?: string;
  readonly detail?: string;
  readonly validationErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    options?: {
      title?: string;
      detail?: string;
      validationErrors?: Record<string, string[]>;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.title = options?.title;
    this.detail = options?.detail;
    this.validationErrors = options?.validationErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function validationErrorsOf(value: unknown): Record<string, string[]> | undefined {
  if (!value || typeof value !== 'object') return undefined;

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => {
        if (typeof entry === 'string') return entry;
        if (entry && typeof entry === 'object') {
          const record = entry as Record<string, unknown>;
          return textOf(record.description) ?? textOf(record.message);
        }
        return undefined;
      })
      .filter((entry): entry is string => Boolean(entry));

    return messages.length > 0 ? { request: messages } : undefined;
  }

  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(value)) {
    if (Array.isArray(messages)) {
      const strings = messages.filter(
        (message): message is string => typeof message === 'string',
      );
      if (strings.length > 0) result[key] = strings;
    } else if (typeof messages === 'string') {
      result[key] = [messages];
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function problemMessage(
  body: ProblemBody | undefined,
  status: number,
): { message: string; title?: string; detail?: string } {
  const title = textOf(body?.title);
  const detail = textOf(body?.detail);
  const validation = validationErrorsOf(body?.errors);
  const validationSummary = validation
    ? Object.values(validation).flat().slice(0, 3).join(' ')
    : undefined;

  return {
    message:
      detail ??
      validationSummary ??
      title ??
      (status === 0
        ? 'The API could not be reached.'
        : `The request failed with status ${status}.`),
    title,
    detail,
  };
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) return undefined;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  const raw = await response.text();
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options;
  const isJsonBody = body !== undefined;
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: isJsonBody ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      0,
      'The EasyDoc API could not be reached. Check that it is running on the proxy target.',
    );
  }

  const parsed = await parseBody(response);

  if (!response.ok) {
    const problem =
      parsed && typeof parsed === 'object'
        ? (parsed as ProblemBody)
        : undefined;
    const { message, title, detail } = problemMessage(problem, response.status);
    throw new ApiError(response.status, message, {
      title,
      detail,
      validationErrors: validationErrorsOf(problem?.errors),
    });
  }

  return parsed as T;
}

export function withQuery(
  path: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function describeError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 401) return 'Your demo session has ended. Sign in again.';
    if (error.status === 403) return 'This action is not allowed for your role.';
    if (error.status === 404) return 'That record could not be found.';
    return error.detail ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Something unexpected happened. Please try again.';
}
