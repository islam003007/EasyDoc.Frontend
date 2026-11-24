import { apiRequest, withQuery } from './client';
import type { Appointment } from './contracts';
import { normalizeAppointments } from './normalize';

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

export async function fetchPatientHistory(
  patientId: string,
  signal?: AbortSignal,
): Promise<Appointment[]> {
  const path = withQuery(`/appointments/patients/${patientId}`, {
    pageNumber: 1,
    pageSize: 100,
  });
  const payload = await apiRequest<unknown>(path, { signal });
  return normalizeAppointments(payload);
}

export async function rescheduleAppointment(input: {
  appointmentId: string;
  date: string;
  startTime: string;
}): Promise<void> {
  await apiRequest<unknown>(
    `/appointments/${input.appointmentId}/reschedule`,
    {
      method: 'PATCH',
      body: {
        date: input.date,
        startTime: input.startTime,
      },
    },
  );
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
