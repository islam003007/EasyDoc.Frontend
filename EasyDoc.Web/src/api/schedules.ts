import { apiRequest } from './client';
import type { DoctorSchedule, ScheduleOverride } from './contracts';
import { normalizeOverrides, normalizeSchedules } from './normalize';

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

export async function updateSchedule(input: {
  scheduleId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): Promise<void> {
  await apiRequest<unknown>(`/doctors/me/schedules/${input.scheduleId}`, {
    method: 'PATCH',
    body: {
      // The current API binds start/end only; dayOfWeek is sent for forward
      // compatibility with a window update that can move days.
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
    },
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

export async function updateOverride(input: {
  overrideId: string;
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}): Promise<void> {
  await apiRequest<unknown>(
    `/doctors/me/schedule-overrides/${input.overrideId}`,
    {
      method: 'PATCH',
      body: {
        // The current API binds availability and times only; date is sent for
        // forward compatibility with a movable override.
        date: input.date,
        isAvailable: input.isAvailable,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    },
  );
}

export async function deleteOverride(overrideId: string): Promise<void> {
  await apiRequest<unknown>(
    `/doctors/me/schedule-overrides/${overrideId}`,
    { method: 'DELETE' },
  );
}
