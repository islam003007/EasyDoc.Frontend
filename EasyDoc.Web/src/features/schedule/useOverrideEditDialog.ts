import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import type { ScheduleOverride } from '../../api/contracts';
import { updateOverride } from '../../api/queries';
import { formatDateLong, timeSortKey, toTimePayload } from '../../lib/dates';
import { takenOverrideDates } from '../../lib/schedule';
import type { InvalidateScheduleData, NoticeSetter } from './types';

export function useOverrideEditDialog({
  overrideList,
  invalidateScheduleData,
  setNotice,
}: {
  overrideList: ScheduleOverride[];
  invalidateScheduleData: InvalidateScheduleData;
  setNotice: NoticeSetter;
}) {
  const [overrideEditTarget, setOverrideEditTarget] =
    useState<ScheduleOverride | null>(null);
  const [overrideEditDate, setOverrideEditDate] = useState('');
  const [overrideEditAvailable, setOverrideEditAvailable] = useState(false);
  const [overrideEditStart, setOverrideEditStart] = useState('09:00');
  const [overrideEditEnd, setOverrideEditEnd] = useState('12:00');

  const saveOverride = useMutation({
    mutationFn: (input: {
      overrideId: string;
      date: string;
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
    }) =>
      updateOverride({
        ...input,
        startTime: input.isAvailable ? input.startTime : undefined,
        endTime: input.isAvailable ? input.endTime : undefined,
      }),
    onSuccess: (_data, input) => {
      setOverrideEditTarget(null);
      setNotice(
        input.isAvailable
          ? `Extra hours updated for ${formatDateLong(input.date)}.`
          : `${formatDateLong(input.date)} is still closed.`,
      );
      invalidateScheduleData('override');
    },
  });

  const editOverrideDateTaken = overrideEditTarget
    ? takenOverrideDates(overrideList, overrideEditTarget.id).has(
        overrideEditDate,
      )
    : false;

  const overrideEditOrder =
    !overrideEditAvailable ||
    timeSortKey(overrideEditEnd) > timeSortKey(overrideEditStart);

  function openOverrideEdit(override: ScheduleOverride) {
    setOverrideEditTarget(override);
    setOverrideEditDate(override.date);
    setOverrideEditAvailable(override.isAvailable);
    setOverrideEditStart(override.startTime?.slice(0, 5) ?? '09:00');
    setOverrideEditEnd(override.endTime?.slice(0, 5) ?? '12:00');
    saveOverride.reset();
  }

  function submitOverrideEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !overrideEditTarget ||
      !overrideEditDate ||
      !overrideEditOrder ||
      editOverrideDateTaken
    ) {
      return;
    }
    saveOverride.mutate({
      overrideId: overrideEditTarget.id,
      date: overrideEditDate,
      isAvailable: overrideEditAvailable,
      startTime: overrideEditAvailable
        ? toTimePayload(overrideEditStart)
        : undefined,
      endTime: overrideEditAvailable ? toTimePayload(overrideEditEnd) : undefined,
    });
  }

  function closeOverrideEdit() {
    setOverrideEditTarget(null);
    saveOverride.reset();
  }

  return {
    overrideEditTarget,
    overrideEditDate,
    setOverrideEditDate,
    overrideEditAvailable,
    setOverrideEditAvailable,
    overrideEditStart,
    setOverrideEditStart,
    overrideEditEnd,
    setOverrideEditEnd,
    editOverrideDateTaken,
    overrideEditOrder,
    saveOverride,
    openOverrideEdit,
    submitOverrideEdit,
    closeOverrideEdit,
  };
}

export type OverrideEditDialogModel = ReturnType<typeof useOverrideEditDialog>;
