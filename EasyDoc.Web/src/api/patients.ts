import { apiRequest } from './client';
import type { PatientProfile } from './contracts';
import { normalizePatientProfile } from './normalize';

export async function fetchPatientMe(
  signal?: AbortSignal,
): Promise<PatientProfile> {
  const payload = await apiRequest<unknown>('/patients/me', { signal });
  return normalizePatientProfile(payload);
}

export async function updatePatientMe(input: {
  personName: string;
  phoneNumber: string;
}): Promise<void> {
  await apiRequest<unknown>('/patients/me', {
    method: 'PATCH',
    body: {
      personName: input.personName.trim(),
      phoneNumber: input.phoneNumber.trim(),
    },
  });
}
