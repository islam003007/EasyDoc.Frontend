import { formatDateLong, formatTimeRange, dayName } from '../../lib/dates';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import type { ScheduleDeleteModel } from './useScheduleDelete';

export function ScheduleDeleteDialog({
  dialog,
}: {
  dialog: ScheduleDeleteModel;
}) {
  const { deleteTarget, remove, confirmDelete, closeDelete } = dialog;

  return (
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title={
        deleteTarget?.kind === 'schedule'
          ? 'Remove these consulting hours?'
          : 'Remove this date override?'
      }
      description={
        deleteTarget?.kind === 'schedule'
          ? `${formatTimeRange(
              deleteTarget.schedule.startTime,
              deleteTarget.schedule.endTime,
            )} on ${dayName(deleteTarget.schedule.dayOfWeek)} will no longer be bookable.`
          : deleteTarget?.kind === 'override'
            ? `The override on ${formatDateLong(deleteTarget.override.date)} will be removed, and your weekly hours will apply again.`
            : ''
      }
      confirmLabel="Remove"
      pendingLabel="Removing…"
      pending={remove.isPending}
      error={remove.error}
      onConfirm={confirmDelete}
      onClose={closeDelete}
    />
  );
}
