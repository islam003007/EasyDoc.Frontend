import { dayName } from '../../lib/dates';
import { Dialog } from '../../ui/Dialog';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';
import type { ScheduleEditDialogModel } from './useScheduleEditDialog';

export function ScheduleEditDialog({
  dialog,
}: {
  dialog: ScheduleEditDialogModel;
}) {
  const {
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
    submitScheduleEdit,
    closeScheduleEdit,
  } = dialog;

  return (
    <Dialog
      open={Boolean(scheduleEditTarget)}
      title="Edit consulting hours"
      kicker="Weekly schedule"
      onClose={() => {
        if (!saveSchedule.isPending) {
          closeScheduleEdit();
        }
      }}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={closeScheduleEdit}
            disabled={saveSchedule.isPending}
          >
            Keep current hours
          </button>
          <button
            type="submit"
            form="edit-hours-form"
            className="btn btn--primary"
            disabled={!scheduleEditOrder || editDayTaken || saveSchedule.isPending}
          >
            {saveSchedule.isPending ? <Spinner /> : null}
            {saveSchedule.isPending ? 'Saving…' : 'Save hours'}
          </button>
        </>
      }
    >
      {scheduleEditTarget ? (
        <form
          id="edit-hours-form"
          className="form-stack"
          onSubmit={submitScheduleEdit}
        >
          <Field id="edit-hours-day" label="Day">
            <select
              id="edit-hours-day"
              value={
                editAvailableDays.includes(scheduleEditDay)
                  ? String(scheduleEditDay)
                  : ''
              }
              onChange={(event) => setScheduleEditDay(Number(event.target.value))}
              disabled={editAvailableDays.length === 0}
            >
              {editAvailableDays.map((day) => (
                <option key={day} value={day}>
                  {dayName(day)}
                </option>
              ))}
              {editAvailableDays.length === 0 ? (
                <option value="">No days available</option>
              ) : null}
            </select>
          </Field>
          <div className="form-row">
            <Field id="edit-hours-start" label="From">
              <input
                id="edit-hours-start"
                type="time"
                value={scheduleEditStart}
                onChange={(event) => setScheduleEditStart(event.target.value)}
              />
            </Field>
            <Field id="edit-hours-end" label="To">
              <input
                id="edit-hours-end"
                type="time"
                value={scheduleEditEnd}
                onChange={(event) => setScheduleEditEnd(event.target.value)}
              />
            </Field>
          </div>
          {!scheduleEditOrder ? (
            <p className="field__error" role="alert">
              The end time must be after the start time.
            </p>
          ) : null}
          {editDayTaken ? (
            <p className="field__error" role="alert">
              That day already has consulting hours. Choose another day.
            </p>
          ) : null}
          {saveSchedule.isError ? <InlineError error={saveSchedule.error} /> : null}
        </form>
      ) : null}
    </Dialog>
  );
}
