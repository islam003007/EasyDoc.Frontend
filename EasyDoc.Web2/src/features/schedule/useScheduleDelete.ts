import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { DoctorSchedule, ScheduleOverride } from '../../api/contracts';
import { deleteOverride, deleteSchedule } from '../../api/queries';
import type { DeleteTarget, InvalidateScheduleData, NoticeSetter } from './types';

export function useScheduleDelete({
  invalidateScheduleData,
  setNotice,
}: {
  invalidateScheduleData: InvalidateScheduleData;
  setNotice: NoticeSetter;
}) {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const remove = useMutation({
    mutationFn: (target: DeleteTarget) =>
      target.kind === 'schedule'
        ? deleteSchedule(target.schedule.id)
        : deleteOverride(target.override.id),
    onSuccess: (_data, target) => {
      setDeleteTarget(null);
      setNotice(
        target.kind === 'schedule'
          ? 'Consulting hours removed.'
          : 'Date override removed.',
      );
      invalidateScheduleData(target.kind === 'schedule' ? 'schedule' : 'override');
    },
  });

  function openScheduleDelete(schedule: DoctorSchedule) {
    remove.reset();
    setDeleteTarget({ kind: 'schedule', schedule });
  }

  function openOverrideDelete(override: ScheduleOverride) {
    remove.reset();
    setDeleteTarget({ kind: 'override', override });
  }

  function confirmDelete() {
    if (deleteTarget) remove.mutate(deleteTarget);
  }

  function closeDelete() {
    setDeleteTarget(null);
    remove.reset();
  }

  return {
    deleteTarget,
    remove,
    openScheduleDelete,
    openOverrideDelete,
    confirmDelete,
    closeDelete,
  };
}

export type ScheduleDeleteModel = ReturnType<typeof useScheduleDelete>;
