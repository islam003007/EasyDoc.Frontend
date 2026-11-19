import { Plus } from 'lucide-react';
import { dayName } from '../../lib/dates';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';
import type { AddHoursFormModel } from './useAddHoursForm';

export function AddHoursForm({ form }: { form: AddHoursFormModel }) {
  const {
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
  } = form;

  return (
    <aside className="sheet">
      <div className="sheet__head">
        <div>
          <p className="sheet__kicker">Weekly hours</p>
          <h2>Add consulting time.</h2>
        </div>
      </div>
      <div className="sheet__body">
        <form id="add-hours-form" className="form-stack" onSubmit={submitSchedule}>
          <Field id="add-hours-day" label="Day">
            <select
              id="add-hours-day"
              value={
                availableDays.includes(scheduleDay) ? String(scheduleDay) : ''
              }
              onChange={(event) => setScheduleDay(Number(event.target.value))}
              disabled={availableDays.length === 0}
            >
              {availableDays.map((day) => (
                <option key={day} value={day}>
                  {dayName(day)}
                </option>
              ))}
              {availableDays.length === 0 ? (
                <option value="">No days left</option>
              ) : null}
            </select>
          </Field>
          <div className="form-row">
            <Field id="add-hours-start" label="From">
              <input
                id="add-hours-start"
                type="time"
                value={scheduleStart}
                onChange={(event) => setScheduleStart(event.target.value)}
              />
            </Field>
            <Field id="add-hours-end" label="To">
              <input
                id="add-hours-end"
                type="time"
                value={scheduleEnd}
                onChange={(event) => setScheduleEnd(event.target.value)}
              />
            </Field>
          </div>
          {!scheduleOrder ? (
            <p className="field__error" role="alert">
              The end time must be after the start time.
            </p>
          ) : null}
          {availableDays.length === 0 ? (
            <p className="schedule-note" role="status">
              Every day already has consulting hours. Edit an existing window
              instead.
            </p>
          ) : null}
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={!canAddSchedule || addSchedule.isPending}
          >
            {addSchedule.isPending ? <Spinner /> : <Plus size={15} aria-hidden="true" />}
            {addSchedule.isPending ? 'Adding…' : 'Add hours'}
          </button>
          {addSchedule.isError ? <InlineError error={addSchedule.error} /> : null}
          <p className="schedule-note">
            These windows become the bookable times on the patient side.
            Date overrides replace them for a single day.
          </p>
        </form>
      </div>
    </aside>
  );
}
