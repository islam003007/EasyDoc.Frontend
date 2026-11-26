import { apiRequest, isApiError } from './client';
import type { DemoUser, Session } from './contracts';
import { normalizeDemoUsers, normalizeSession } from './normalize';

export async function fetchSession(signal?: AbortSignal): Promise<Session | null> {
  try {
    const payload = await apiRequest<unknown>('/auth/me', {
      signal,
      cache: 'no-store',
    });
    return normalizeSession(payload);
  } catch (error) {
    if (isApiError(error) && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export async function fetchDemoUsers(signal?: AbortSignal): Promise<DemoUser[]> {
  const payload = await apiRequest<unknown>('/auth/demo-users', { signal });
  return normalizeDemoUsers(payload);
}

export async function warmDemoDatabase(signal?: AbortSignal): Promise<void> {
  await apiRequest<unknown>('/demo/warmup', { signal });
}

export async function demoLogin(key: string): Promise<void> {
  await apiRequest<unknown>('/auth/demo-login', {
    method: 'POST',
    body: { key },
  });
}

export interface PasswordLoginInput {
  email: string;
  password: string;
}

export async function passwordLogin(input: PasswordLoginInput): Promise<void> {
  await apiRequest<unknown>('/auth/login', {
    method: 'POST',
    body: {
      email: input.email.trim(),
      password: input.password,
    },
  });
}

export interface PatientRegistrationInput {
  email: string;
  password: string;
  passwordConfirm: string;
  personName: string;
  phoneNumber: string;
}

export async function registerPatient(
  input: PatientRegistrationInput,
): Promise<string | undefined> {
  const payload = await apiRequest<unknown>('/patients/register', {
    method: 'POST',
    body: {
      email: input.email.trim(),
      password: input.password,
      passwordConfirm: input.passwordConfirm,
      personName: input.personName.trim(),
      phoneNumber: input.phoneNumber.trim(),
    },
  });
  return typeof payload === 'string' ? payload : undefined;
}

export async function logout(): Promise<void> {
  await apiRequest<unknown>('/auth/logout', { method: 'POST' });
}
