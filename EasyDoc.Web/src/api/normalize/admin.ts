import type { AdminDoctor, AdminPatient } from '../contracts';
import { bool, isRecord, nameOf, numberValue, read, recordsIn, text } from './values';

export function normalizeAdminDoctor(entry: unknown): AdminDoctor | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'doctorId'));
  if (!id) return null;

  return {
    id,
    userId: text(read(entry, 'userId')),
    personName:
      text(read(entry, 'personName', 'name', 'displayName')) ?? 'Unnamed doctor',
    email: text(read(entry, 'email')) ?? '',
    phoneNumber: text(read(entry, 'phoneNumber', 'phone')),
    department: nameOf(read(entry, 'department', 'departmentName')),
    departmentId: text(read(entry, 'departmentId')),
    city: nameOf(read(entry, 'city', 'cityName')),
    cityId: text(read(entry, 'cityId')),
    clinicAddress: text(read(entry, 'clinicAddress', 'address')),
    description: text(read(entry, 'description', 'bio')),
    profilePictureUrl: text(
      read(entry, 'profilePictureUrl', 'profilePictureURL', 'profilePicture'),
    ),
    defaultAppointmentTimeInMinutes: numberValue(
      read(entry, 'defaultAppointmentTimeInMinutes', 'appointmentDuration'),
      30,
    ),
    isVisible: bool(read(entry, 'isVisible', 'visible', 'active'), true),
    isDeleted: bool(read(entry, 'isDeleted'), false),
  };
}

export function normalizeAdminDoctors(payload: unknown): AdminDoctor[] {
  return recordsIn(payload, ['doctors', 'items'])
    .map(normalizeAdminDoctor)
    .filter((entry): entry is AdminDoctor => entry !== null);
}

export function normalizeAdminPatient(entry: unknown): AdminPatient | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'patientId'));
  if (!id) return null;

  return {
    id,
    userId: text(read(entry, 'userId')),
    personName:
      text(read(entry, 'personName', 'name', 'displayName')) ?? 'Unnamed patient',
    email: text(read(entry, 'email')) ?? '',
    phoneNumber: text(read(entry, 'phoneNumber', 'phone')),
    isDeleted: bool(read(entry, 'isDeleted'), false),
  };
}

export function normalizeAdminPatients(payload: unknown): AdminPatient[] {
  return recordsIn(payload, ['patients', 'items'])
    .map(normalizeAdminPatient)
    .filter((entry): entry is AdminPatient => entry !== null);
}
