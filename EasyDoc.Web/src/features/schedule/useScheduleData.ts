import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchDoctorMe,
  fetchOverrides,
  fetchSchedules,
  queryKeys,
} from '../../api/queries';
import { useSession } from '../../auth/SessionProvider';
import { timeSortKey, todayIso } from '../../lib/dates';
import { availableScheduleDays, takenOverrideDates } from '../../lib/schedule';
import type { InvalidateScheduleData, ScheduleStats } from './types';

export function useScheduleData() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctorMe,
    queryFn: ({ signal }) => fetchDoctorMe(signal),
  });

  const doctorId = session?.doctorId ?? doctorQuery.data?.id ?? '';

  const schedules = useQuery({
    queryKey: queryKeys.schedules(doctorId),
    queryFn: ({ signal }) => fetchSchedules(doctorId, signal),
    enabled: Boolean(doctorId),
  });

  const overrides = useQuery({
    queryKey: queryKeys.overrides(doctorId),
    queryFn: ({ signal }) => fetchOverrides(doctorId, signal),
    enabled: Boolean(doctorId),
  });

  const invalidateScheduleData: InvalidateScheduleData = (kind) => {
    if (!doctorId) return;
    if (!kind || kind === 'schedule') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules(doctorId) });
    }
    if (!kind || kind === 'override') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.overrides(doctorId) });
    }
  };

  const weeklySchedules = schedules.data ?? [];
  const overrideList = overrides.data ?? [];

  const availableDays = useMemo(
    () => availableScheduleDays(weeklySchedules),
    [weeklySchedules],
  );

  const overrideDatesTaken = useMemo(
    () => takenOverrideDates(overrideList),
    [overrideList],
  );

  const stats = useMemo<ScheduleStats>(() => {
    const totalMinutes = weeklySchedules.reduce(
      (total, schedule) =>
        total +
        Math.max(0, timeSortKey(schedule.endTime) - timeSortKey(schedule.startTime)),
      0,
    );
    const days = new Set(weeklySchedules.map((schedule) => schedule.dayOfWeek)).size;
    const futureOverrides = overrideList.filter(
      (override) => override.date >= todayIso(),
    ).length;

    return {
      hours:
        totalMinutes % 60 === 0
          ? String(totalMinutes / 60)
          : (totalMinutes / 60).toFixed(1),
      days,
      futureOverrides,
    };
  }, [weeklySchedules, overrideList]);

  const sortedOverrides = useMemo(
    () => [...overrideList].sort((a, b) => a.date.localeCompare(b.date)),
    [overrideList],
  );

  return {
    doctorQuery,
    schedules,
    overrides,
    weeklySchedules,
    overrideList,
    availableDays,
    overrideDatesTaken,
    stats,
    sortedOverrides,
    invalidateScheduleData,
  };
}
