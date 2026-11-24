import { Plus } from 'lucide-react';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';
import type { AddOverrideFormModel } from './useAddOverrideForm';

export function AddOverrideForm({ form }: { form: AddOverrideFormModel }) {
  const {
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
  } = form;

  return (
    <aside className="sheet">
      <div className="sheet__head">
        <div>
          <p className="sheet__kicker">One date</p>
          <h2>Change a day.</h2>
        </div>
      </div>
      <div className="sheet__body">
        <form className="form-stack" onSubmit={submitOverride}>
          <Field id="override-date" label="Date">
            <input
              id="override-date"
              type="date"
              value={overrideDate}
              onChange={(event) => setOverrideDate(event.target.value)}
            />
          </Field>

          {overrideDateTaken ? (
            <p className="schedule-note" role="status">
              This date already has an override. Edit it in the list instead.
            </p>
          ) : null}

          <label className="check-line">
            <input
              type="checkbox"
              checked={overrideAvailable}
              onChange={(event) =>
                setOverrideAvailable(event.target.checked)
              }
            />
            <span>Add extra hours instead of closing</span>
          </label>

          {overrideAvailable ? (
            <div className="form-row">
              <Field id="override-start" label="From">
                <input
                  id="override-start"
                  type="time"
                  value={overrideStart}
                  onChange={(event) => setOverrideStart(event.target.value)}
                />
              </Field>
              <Field id="override-end" label="To">
                <input
                  id="override-end"
                  type="time"
                  value={overrideEnd}
                  onChange={(event) => setOverrideEnd(event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {!overrideOrder ? (
            <p className="field__error" role="alert">
              The end time must be after the start time.
            </p>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={!canAddOverride || addOverride.isPending}
          >
            {addOverride.isPending ? (
              <Spinner />
            ) : (
              <Plus size={15} aria-hidden="true" />
            )}
            {addOverride.isPending ? 'Saving…' : 'Add override'}
          </button>
          {addOverride.isError ? <InlineError error={addOverride.error} /> : null}
          <p className="schedule-note">
            Leave the box unchecked to close the whole day. This override replaces
            your weekly hours for that date only.
          </p>
        </form>
      </div>
    </aside>
  );
}
