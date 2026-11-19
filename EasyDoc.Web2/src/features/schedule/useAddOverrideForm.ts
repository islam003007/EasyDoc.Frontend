import { useMutation } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import { useState, type FormEvent } from 'react';
import { createOverride } from '../../api/queries';
import {
  formatDateLong,
  timeSortKey,
  toDateInputValue,
  toTimePayload,
} from '../../lib/dates';
import type { InvalidateScheduleData, NoticeSetter } from './types';

export function useAddOverrideForm({
  overrideDatesTaken,
  invalidateScheduleData,
  setNotice,
}: {
  overrideDatesTaken: Set<string>;
  invalidateScheduleData: InvalidateScheduleData;
  setNotice: NoticeSetter;
}) {
  const [overrideDate, setOverrideDate] = useState(
    toDateInputValue(addDays(new Date(), 1)),
  );
  const [overrideAvailable, setOverrideAvailable] = useState(false);
  const [overrideStart, setOverrideStart] = useState('09:00');
  const [overrideEnd, setOverrideEnd] = useState('12:00');

  const addOverride = useMutation({
    mutationFn: () =>
      createOverride({
        date: overrideDate,
        isAvailable: overrideAvailable,
        startTime: overrideAvailable ? toTimePayload(overrideStart) : undefined,
        endTime: overrideAvailable ? toTimePayload(overrideEnd) : undefined,
      }),
    onSuccess: () => {
      setNotice(
        overrideAvailable
          ? `Extra hours added for ${formatDateLong(overrideDate)}.`
          : `${formatDateLong(overrideDate)} is now closed.`,
      );
      invalidateScheduleData('override');
    },
  });

  const overrideDateTaken = overrideDatesTaken.has(overrideDate);
  const overrideOrder =
    !overrideAvailable || timeSortKey(overrideEnd) > timeSortKey(overrideStart);
  const canAddOverride =
    Boolean(overrideDate) &&
    !overrideDateTaken &&
    (!overrideAvailable || timeSortKey(overrideEnd) > timeSortKey(overrideStart));

  function submitOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canAddOverride) return;
    addOverride.mutate();
  }

  return {
    overrideDate,
    setOverrideDate,
    overrideDateTaken,
    overrideAvailable,
    setOverrideAvailable,
    overrideStart,
    setOverrideStart,
    overrideEnd,
    setOverrideEnd,
    overrideOrder,
    canAddOverride,
    addOverride,
    submitOverride,
  };
}

export type AddOverrideFormModel = ReturnType<typeof useAddOverrideForm>;
