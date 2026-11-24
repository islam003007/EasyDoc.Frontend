import { apiRequest, withQuery } from './client';
import type { DoctorDetail, DoctorSummary, Slot } from './contracts';
import {
  normalizeDoctorDetail,
  normalizeDoctorSummaries,
  normalizeSlots,
} from './normalize';

interface DoctorFilters {
  cityId?: string;
  departmentId?: string;
}

export async function fetchDoctorSearch(
  query: string,
  filters: DoctorFilters,
  signal?: AbortSignal,
): Promise<DoctorSummary[]> {
  const path = withQuery('/doctors/search', {
    query,
    cityId: filters.cityId,
    departmentId: filters.departmentId,
    pageNumber: 1,
    pageSize: 50,
  });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeDoctorSummaries(payload);
}

export async function fetchDoctorDirectory(
  filters: DoctorFilters,
  signal?: AbortSignal,
): Promise<DoctorSummary[]> {
  const path = withQuery('/doctors', {
    cityId: filters.cityId,
    departmentId: filters.departmentId,
    pageNumber: 1,
    pageSize: 50,
  });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeDoctorSummaries(payload);
}

export async function fetchDoctor(
  doctorId: string,
  signal?: AbortSignal,
): Promise<DoctorDetail> {
  const payload = await apiRequest<unknown>(`/doctors/${doctorId}`, { signal });
  return normalizeDoctorDetail(payload);
}

export async function fetchDoctorMe(signal?: AbortSignal): Promise<DoctorDetail> {
  const payload = await apiRequest<unknown>('/doctors/me', { signal });
  return normalizeDoctorDetail(payload);
}

export async function updateDoctorMe(input: {
  personName: string;
  phoneNumber: string;
  clinicAddress: string;
  defaultAppointmentTimeInMinutes: number;
  description?: string;
  profilePictureUrl?: string;
}): Promise<void> {
  const description = input.description?.trim();
  const profilePictureUrl = input.profilePictureUrl?.trim();

  await apiRequest<unknown>('/doctors/Me', {
    method: 'PATCH',
    body: {
      personName: input.personName.trim(),
      phoneNumber: input.phoneNumber.trim(),
      clinicAddress: input.clinicAddress.trim(),
      defaultAppointmentTimeInMinutes: input.defaultAppointmentTimeInMinutes,
      ...(description
        ? { description }
        : { description: null, clearDescription: true }),
      ...(profilePictureUrl
        ? { profilePictureUrl }
        : { profilePictureUrl: null, clearProfilePictureUrl: true }),
    },
  });
}

export async function fetchSlots(
  doctorId: string,
  date: string,
  signal?: AbortSignal,
): Promise<Slot[]> {
  const path = withQuery(`/doctors/${doctorId}/available-slots`, { date });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeSlots(payload);
}
