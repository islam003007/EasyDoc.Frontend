import { useQuery } from '@tanstack/react-query';
import { apiRequest, isApiError, withQuery } from './client';
import type {
  AdminDoctor,
  AdminPatient,
  Appointment,
  DemoUser,
  DoctorDetail,
  DoctorSchedule,
  DoctorSummary,
  LookupItem,
  ScheduleOverride,
  Session,
  Slot,
} from './contracts';
import {
  normalizeAdminDoctors,
  normalizeAdminPatients,
  normalizeAppointments,
  normalizeDemoUsers,
  normalizeDoctorDetail,
  normalizeDoctorSummaries,
  normalizeLookups,
  normalizeOverrides,
  normalizeSchedules,
  normalizeSession,
  normalizeSlots,
} from './normalize';

export const queryKeys = {
  session: ['session'] as const,
  demoUsers: ['demo-users'] as const,
  departments: ['lookups', 'departments'] as const,
  cities: ['lookups', 'cities'] as const,
  doctorSearch: (query: string, cityId: string, departmentId: string) =>
    ['doctors', 'search', query, cityId, departmentId] as const,
  doctorDirectory: (cityId: string, departmentId: string) =>
    ['doctors', 'directory', cityId, departmentId] as const,
  doctor: (id: string) => ['doctor', id] as const,
  doctorMe: ['doctor', 'me'] as const,
  slots: (id: string, date: string) => ['doctor', id, 'slots', date] as const,
  patientAppointments: ['appointments', 'patient'] as const,
  doctorAppointments: ['appointments', 'doctor'] as const,
  schedules: (doctorId: string) => ['doctor', doctorId, 'schedules'] as const,
  overrides: (doctorId: string) =>
    ['doctor', doctorId, 'schedule-overrides'] as const,
  adminDoctors: ['admin', 'doctors'] as const,
  adminPatients: ['admin', 'patients'] as const,
};

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

export async function demoLogin(key: string): Promise<void> {
  await apiRequest<unknown>('/auth/demo-login', {
    method: 'POST',
    body: { key },
  });
}

export async function logout(): Promise<void> {
  await apiRequest<unknown>('/auth/logout', { method: 'POST' });
}

export async function fetchDepartments(
  signal?: AbortSignal,
): Promise<LookupItem[]> {
  const payload = await apiRequest<unknown>('/lookups/departments', { signal });
  return normalizeLookups(payload);
}

export async function fetchCities(signal?: AbortSignal): Promise<LookupItem[]> {
  const payload = await apiRequest<unknown>('/lookups/cities', { signal });
  return normalizeLookups(payload);
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: ({ signal }) => fetchDepartments(signal),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities,
    queryFn: ({ signal }) => fetchCities(signal),
    staleTime: 10 * 60 * 1000,
  });
}

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

export async function fetchSlots(
  doctorId: string,
  date: string,
  signal?: AbortSignal,
): Promise<Slot[]> {
  const path = withQuery(`/doctors/${doctorId}/available-slots`, { date });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeSlots(payload);
}

export async function createAppointment(input: {
  doctorId: string;
  date: string;
  startTime: string;
}): Promise<string | undefined> {
  const payload = await apiRequest<unknown>('/appointments', {
    method: 'POST',
    body: input,
  });
  return typeof payload === 'string' ? payload : undefined;
}

export async function fetchPatientAppointments(
  signal?: AbortSignal,
): Promise<Appointment[]> {
  const path = withQuery('/appointments/patient/me', {
    pageNumber: 1,
    pageSize: 50,
  });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeAppointments(payload);
}

export async function fetchDoctorAppointments(
  signal?: AbortSignal,
): Promise<Appointment[]> {
  const path = withQuery('/appointments/doctor/me', {
    pageNumber: 1,
    pageSize: 50,
  });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeAppointments(payload);
}

export async function cancelPatientAppointment(
  appointmentId: string,
): Promise<void> {
  await apiRequest<unknown>(`/appointments/${appointmentId}/cancel/patient`, {
    method: 'POST',
  });
}

export async function acceptAppointment(appointmentId: string): Promise<void> {
  await apiRequest<unknown>(`/appointments/${appointmentId}/accept`, {
    method: 'POST',
  });
}

export async function cancelDoctorAppointment(
  appointmentId: string,
): Promise<void> {
  await apiRequest<unknown>(`/appointments/${appointmentId}/cancel`, {
    method: 'POST',
  });
}

export async function completeAppointment(input: {
  appointmentId: string;
  diagnosis: string;
  prescription: string;
  notes?: string;
}): Promise<void> {
  await apiRequest<unknown>(
    `/appointments/${input.appointmentId}/Complete`,
    {
      method: 'POST',
      body: {
        diagnosis: input.diagnosis,
        prescription: input.prescription,
        notes: input.notes?.trim() ? input.notes.trim() : null,
      },
    },
  );
}

export async function fetchSchedules(
  doctorId: string,
  signal?: AbortSignal,
): Promise<DoctorSchedule[]> {
  const payload = await apiRequest<unknown>(
    `/doctors/${doctorId}/schedules`,
    { signal },
  );
  return normalizeSchedules(payload);
}

export async function createSchedule(input: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): Promise<void> {
  await apiRequest<unknown>('/doctors/me/schedules', {
    method: 'POST',
    body: input,
  });
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await apiRequest<unknown>(`/doctors/me/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
}

export async function fetchOverrides(
  doctorId: string,
  signal?: AbortSignal,
): Promise<ScheduleOverride[]> {
  const payload = await apiRequest<unknown>(
    `/doctors/${doctorId}/schedule-overrides`,
    { signal },
  );
  return normalizeOverrides(payload);
}

export async function createOverride(input: {
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}): Promise<void> {
  await apiRequest<unknown>('/doctors/me/schedule-overrides', {
    method: 'POST',
    body: input,
  });
}

export async function deleteOverride(overrideId: string): Promise<void> {
  await apiRequest<unknown>(
    `/doctors/me/schedule-overrides/${overrideId}`,
    { method: 'DELETE' },
  );
}

export async function fetchAdminDoctors(
  signal?: AbortSignal,
): Promise<AdminDoctor[]> {
  const path = withQuery('/admin/doctors', { pageNumber: 1, pageSize: 100 });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeAdminDoctors(payload);
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
