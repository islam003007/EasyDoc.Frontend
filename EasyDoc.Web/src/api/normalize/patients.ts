import type { PatientProfile } from '../contracts';
import { isRecord, read, text } from './values';

export function normalizePatientProfile(payload: unknown): PatientProfile {
  if (!isRecord(payload)) {
    throw new Error('The patient response was not a JSON object.');
  }

  const id = text(read(payload, 'id', 'patientId'));
  if (!id) throw new Error('The patient response did not include an id.');

  return {
    id,
    personName:
      text(read(payload, 'personName', 'name', 'displayName')) ?? 'Patient',
    phoneNumber: text(read(payload, 'phoneNumber', 'phone')),
    email: text(read(payload, 'email')) ?? '',
  };
}
