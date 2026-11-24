import type { DoctorDetail, DoctorSummary, Slot } from '../contracts';
import { isRecord, nameOf, numberValue, read, recordsIn, text } from './values';

function normalizeDoctorSummary(entry: unknown): DoctorSummary | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'doctorId', 'id'));
  const personName = text(read(entry, 'personName', 'name', 'displayName'));
  if (!id || !personName) return null;

  return {
    id,
    personName,
    department: nameOf(read(entry, 'department', 'departmentName')),
    city: nameOf(read(entry, 'city', 'cityName')),
    departmentId: text(read(entry, 'departmentId')),
    cityId: text(read(entry, 'cityId')),
    profilePictureUrl: text(
      read(entry, 'profilePictureUrl', 'profilePictureURL', 'profilePicture'),
    ),
  };
}

export function normalizeDoctorSummaries(payload: unknown): DoctorSummary[] {
  return recordsIn(payload, ['doctors', 'items'])
    .map(normalizeDoctorSummary)
    .filter((entry): entry is DoctorSummary => entry !== null);
}

export function normalizeDoctorDetail(payload: unknown): DoctorDetail {
  if (!isRecord(payload)) {
    throw new Error('The doctor response was not a JSON object.');
  }

  const id = text(read(payload, 'id', 'doctorId'));
  if (!id) throw new Error('The doctor response did not include an id.');

  return {
    id,
    personName:
      text(read(payload, 'personName', 'name', 'displayName')) ?? 'Doctor',
    phoneNumber: text(read(payload, 'phoneNumber', 'phone')),
    department: nameOf(read(payload, 'department', 'departmentName')),
    city: nameOf(read(payload, 'city', 'cityName')),
    clinicAddress: text(read(payload, 'clinicAddress', 'address')),
    defaultAppointmentTimeInMinutes: numberValue(
      read(payload, 'defaultAppointmentTimeInMinutes', 'appointmentDuration'),
      30,
    ),
    description: text(read(payload, 'description', 'bio')),
    profilePictureUrl: text(
      read(payload, 'profilePictureUrl', 'profilePictureURL', 'profilePicture'),
    ),
    email: text(read(payload, 'email')),
  };
}

export function normalizeSlots(payload: unknown): Slot[] {
  return recordsIn(payload, ['slots'])
    .map((entry): Slot | null => {
      if (!isRecord(entry)) return null;
      const startTime = text(read(entry, 'startTime', 'start'));
      const endTime = text(read(entry, 'endTime', 'end'));
      if (!startTime || !endTime) return null;
      return { startTime, endTime };
    })
    .filter((entry): entry is Slot => entry !== null);
}
