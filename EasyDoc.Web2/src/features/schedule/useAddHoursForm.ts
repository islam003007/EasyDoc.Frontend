import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { createSchedule } from '../../api/queries';
import { dayName, timeSortKey, toTimePayload } from '../../lib/dates';
import type { InvalidateScheduleData, NoticeSetter } from './types';

export function useAddHoursForm({
  availableDays,
  invalidateScheduleData,
  setNotice,
}: {
  availableDays: number[];
  invalidateScheduleData: InvalidateScheduleData;
  setNotice: NoticeSetter;
}) {
  const [scheduleDay, setScheduleDay] = useState(1);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('14:00');

  const addSchedule = useMutation({
    mutationFn: () =>
      createSchedule({
        dayOfWeek: scheduleDay,
        startTime: toTimePayload(scheduleStart),
        endTime: toTimePayload(scheduleEnd),
      }),
    onSuccess: () => {
      setNotice(`Added ${dayName(scheduleDay)} hours to the week.`);
      invalidateScheduleData('schedule');
    },
  });

  const canAddSchedule =
    availableDays.length > 0 &&
    availableDays.includes(scheduleDay) &&
    timeSortKey(scheduleEnd) > timeSortKey(scheduleStart);

  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(scheduleDay)) {
      setScheduleDay(availableDays[0]);
    }
  }, [availableDays, scheduleDay]);

  const scheduleOrder = timeSortKey(scheduleEnd) > timeSortKey(scheduleStart);

  function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAddSchedule) return;
    addSchedule.mutate();
  }

  function prepareScheduleForDay(day: number) {
    setScheduleDay(day);
    document
      .getElementById('add-hours-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return {
    availableDays,
    scheduleDay,
    setScheduleDay,
    scheduleStart,
    setScheduleStart,
    scheduleEnd,
    setScheduleEnd,
    scheduleOrder,
    canAddSchedule,
    addSchedule,
    submitSchedule,
    prepareScheduleForDay,
  };
}

export type AddHoursFormModel = ReturnType<typeof useAddHoursForm>;
