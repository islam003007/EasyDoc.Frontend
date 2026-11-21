import { useMutation } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import type { DoctorSchedule } from '../../api/contracts';
import { updateSchedule } from '../../api/queries';
import { dayName, timeSortKey, toTimePayload } from '../../lib/dates';
import { availableScheduleDays } from '../../lib/schedule';
import type { InvalidateScheduleData, NoticeSetter } from './types';

export function useScheduleEditDialog({
  weeklySchedules,
  invalidateScheduleData,
  setNotice,
}: {
  weeklySchedules: DoctorSchedule[];
  invalidateScheduleData: InvalidateScheduleData;
  setNotice: NoticeSetter;
}) {
  const [scheduleEditTarget, setScheduleEditTarget] =
    useState<DoctorSchedule | null>(null);
  const [scheduleEditDay, setScheduleEditDay] = useState(1);
  const [scheduleEditStart, setScheduleEditStart] = useState('09:00');
  const [scheduleEditEnd, setScheduleEditEnd] = useState('14:00');

  const saveSchedule = useMutation({
    mutationFn: (input: {
      scheduleId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => updateSchedule(input),
    onSuccess: (_data, input) => {
      setScheduleEditTarget(null);
      setNotice(`${dayName(input.dayOfWeek)} hours updated.`);
      invalidateScheduleData('schedule');
    },
  });

  const editAvailableDays = useMemo(
    () =>
      scheduleEditTarget
        ? availableScheduleDays(weeklySchedules, scheduleEditTarget.id)
        : [],
    [weeklySchedules, scheduleEditTarget],
  );
  const editDayTaken =
    Boolean(scheduleEditTarget) && !editAvailableDays.includes(scheduleEditDay);
  const scheduleEditOrder =
    timeSortKey(scheduleEditEnd) > timeSortKey(scheduleEditStart);

  function openScheduleEdit(schedule: DoctorSchedule) {
    setScheduleEditTarget(schedule);
    setScheduleEditDay(schedule.dayOfWeek);
    setScheduleEditStart(schedule.startTime.slice(0, 5));
    setScheduleEditEnd(schedule.endTime.slice(0, 5));
    saveSchedule.reset();
  }

  function submitScheduleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleEditTarget || !scheduleEditOrder || editDayTaken) return;
    saveSchedule.mutate({
      scheduleId: scheduleEditTarget.id,
      dayOfWeek: scheduleEditDay,
      startTime: toTimePayload(scheduleEditStart),
      endTime: toTimePayload(scheduleEditEnd),
    });
  }

  function closeScheduleEdit() {
    setScheduleEditTarget(null);
    saveSchedule.reset();
  }

  return {
    scheduleEditTarget,
    scheduleEditDay,
    setScheduleEditDay,
    scheduleEditStart,
    setScheduleEditStart,
    scheduleEditEnd,
    setScheduleEditEnd,
    editAvailableDays,
    editDayTaken,
    scheduleEditOrder,
    saveSchedule,
    openScheduleEdit,
    submitScheduleEdit,
    closeScheduleEdit,
  };
}

export type ScheduleEditDialogModel = ReturnType<typeof useScheduleEditDialog>;
