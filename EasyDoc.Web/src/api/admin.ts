import { apiRequest, withQuery } from './client';
import type { AdminDoctor, AdminPatient } from './contracts';
import {
  normalizeAdminDoctor,
  normalizeAdminDoctors,
  normalizeAdminPatient,
  normalizeAdminPatients,
} from './normalize';

export async function fetchAdminDoctors(
  signal?: AbortSignal,
): Promise<AdminDoctor[]> {
  const path = withQuery('/admin/doctors', { pageNumber: 1, pageSize: 100 });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeAdminDoctors(payload);
}

export async function fetchAdminDoctor(
  doctorId: string,
  signal?: AbortSignal,
): Promise<AdminDoctor> {
  const payload = await apiRequest<unknown>(`/admin/doctors/${doctorId}`, {
    signal,
  });
  const doctor = normalizeAdminDoctor(payload);
  if (!doctor) throw new Error('The doctor response was not usable.');
  return doctor;
}

export async function updateAdminDoctor(input: {
  doctorId: string;
  personName: string;
  phoneNumber: string;
  cityId?: string;
  clinicAddress: string;
  defaultAppointmentTimeInMinutes: number;
  description?: string;
  profilePictureUrl?: string;
  isVisible: boolean;
}): Promise<void> {
  const description = input.description?.trim();
  const profilePictureUrl = input.profilePictureUrl?.trim();

  await apiRequest<unknown>(`/admin/doctors/${input.doctorId}`, {
    method: 'PATCH',
    body: {
      personName: input.personName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      ...(input.cityId ? { cityId: input.cityId } : {}),
      clinicAddress: input.clinicAddress.trim(),
      defaultAppointmentTimeInMinutes: input.defaultAppointmentTimeInMinutes,
      isVisible: input.isVisible,
      ...(description
        ? { description }
        : { description: null, clearDescription: true }),
      ...(profilePictureUrl
        ? { profilePictureUrl }
        : { profilePictureUrl: null, clearProfilePictureUrl: true }),
    },
  });
}

export async function updateDoctorVisibility(
  doctorId: string,
  isVisible: boolean,
): Promise<void> {
  await apiRequest<unknown>(`/admin/doctors/${doctorId}`, {
    method: 'PATCH',
    body: { isVisible },
  });
}

export async function fetchAdminPatients(
  signal?: AbortSignal,
): Promise<AdminPatient[]> {
  const path = withQuery('/admin/patients', { pageNumber: 1, pageSize: 100 });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeAdminPatients(payload);
}

export async function fetchAdminPatient(
  patientId: string,
  signal?: AbortSignal,
): Promise<AdminPatient> {
  const payload = await apiRequest<unknown>(`/admin/patients/${patientId}`, {
    signal,
  });
  const patient = normalizeAdminPatient(payload);
  if (!patient) throw new Error('The patient response was not usable.');
  return patient;
}
