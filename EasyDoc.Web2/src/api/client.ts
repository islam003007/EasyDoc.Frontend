import { ApiError, humanizeMessage } from './errors';
export {
  ApiError,
  describeError,
  describeFormError,
  humanizeMessage,
  isApiError,
} from './errors';

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE = (configuredBase || '/api').replace(/\/+$/, '');

interface ProblemBody {
  title?: unknown;
  detail?: unknown;
  errors?: unknown;
  [key: string]: unknown;
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function collectMessages(value: unknown, depth = 0): string[] {
  if (depth > 4 || value === null || value === undefined) return [];

  if (typeof value === 'string') {
    const message = value.trim();
    return message.length > 0 ? [message] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectMessages(entry, depth + 1));
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const direct =
      textOf(record.description) ??
      textOf(record.message) ??
      textOf(record.detail);
    if (direct) return [direct];

    return Object.values(record).flatMap((entry) =>
      collectMessages(entry, depth + 1),
    );
  }

  return [];
}

function uniqueMessages(messages: string[]): string[] {
  return Array.from(new Set(messages.map((message) => message.trim()).filter(Boolean)));
}

function validationErrorsOf(value: unknown): Record<string, string[]> | undefined {
  if (!value || typeof value !== 'object') return undefined;

  if (Array.isArray(value)) {
    const messages = uniqueMessages(collectMessages(value));
    return messages.length > 0 ? { request: messages } : undefined;
  }

  const result: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(value)) {
    const strings = uniqueMessages(collectMessages(messages));
    if (strings.length > 0) result[key] = strings;
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
      humanizeMessage(
        detail ??
          validationSummary ??
          title ??
          (status === 0
            ? 'We couldn’t reach the clinic.'
            : 'Something went wrong. Try again.'),
      ),
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
      'We couldn’t reach the clinic. Check your connection and try again.',
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
