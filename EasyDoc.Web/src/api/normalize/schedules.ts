import type { DoctorSchedule, ScheduleOverride } from '../contracts';
import { bool, isRecord, read, recordsIn, text } from './values';

export function parseDayOfWeek(value: unknown): number {
  if (typeof value === 'number' && value >= 0 && value <= 6) return value;
  const normalized = text(value)?.toLowerCase();
  if (!normalized) return 0;
  if (/^[0-6]$/.test(normalized)) return Number(normalized);

  const days: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  return days[normalized] ?? 0;
}

export function normalizeSchedule(entry: unknown): DoctorSchedule | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'scheduleId'));
  const startTime = text(read(entry, 'startTime'));
  const endTime = text(read(entry, 'endTime'));
  if (!id || !startTime || !endTime) return null;

  return {
    id,
    dayOfWeek: parseDayOfWeek(read(entry, 'dayOfWeek', 'day')),
    startTime,
    endTime,
  };
}

export function normalizeSchedules(payload: unknown): DoctorSchedule[] {
  return recordsIn(payload, ['schedules'])
    .map(normalizeSchedule)
    .filter((entry): entry is DoctorSchedule => entry !== null);
}

export function normalizeOverride(entry: unknown): ScheduleOverride | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'scheduleOverrideId'));
  const date = text(read(entry, 'date'));
  if (!id || !date) return null;

  return {
    id,
    date: date.slice(0, 10),
    isAvailable: bool(
      read(entry, 'isAvailable', 'isAvaiable', 'available'),
      true,
    ),
    startTime: text(read(entry, 'startTime')),
    endTime: text(read(entry, 'endTime')),
  };
}

export function normalizeOverrides(payload: unknown): ScheduleOverride[] {
  return recordsIn(payload, ['scheduleOverrides', 'overrides'])
    .map(normalizeOverride)
    .filter((entry): entry is ScheduleOverride => entry !== null);
}
