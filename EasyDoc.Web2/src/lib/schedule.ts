import type { DoctorSchedule, ScheduleOverride } from '../api/contracts';

export const WEEK = [1, 2, 3, 4, 5, 6, 0];

export function takenScheduleDays(
  schedules: DoctorSchedule[] | undefined,
  excludedScheduleId?: string,
): Set<number> {
  return new Set(
    (schedules ?? [])
      .filter((schedule) => schedule.id !== excludedScheduleId)
      .map((schedule) => schedule.dayOfWeek),
  );
}

export function availableScheduleDays(
  schedules: DoctorSchedule[] | undefined,
  excludedScheduleId?: string,
): number[] {
  const taken = takenScheduleDays(schedules, excludedScheduleId);
  return WEEK.filter((day) => !taken.has(day));
}

export function takenOverrideDates(
  overrides: ScheduleOverride[] | undefined,
  excludedOverrideId?: string,
): Set<string> {
  return new Set(
    (overrides ?? [])
      .filter((override) => override.id !== excludedOverrideId)
      .map((override) => override.date),
  );
}
