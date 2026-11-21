import { Dialog } from '../../ui/Dialog';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';
import type { OverrideEditDialogModel } from './useOverrideEditDialog';

export function OverrideEditDialog({
  dialog,
}: {
  dialog: OverrideEditDialogModel;
}) {
  const {
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
    submitOverrideEdit,
    closeOverrideEdit,
  } = dialog;

  return (
    <Dialog
      open={Boolean(overrideEditTarget)}
      title="Edit date override"
      kicker="One date"
      onClose={() => {
        if (!saveOverride.isPending) {
          closeOverrideEdit();
        }
      }}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={closeOverrideEdit}
            disabled={saveOverride.isPending}
          >
            Keep current override
          </button>
          <button
            type="submit"
            form="edit-override-form"
            className="btn btn--primary"
            disabled={
              !overrideEditOrder || editOverrideDateTaken || saveOverride.isPending
            }
          >
            {saveOverride.isPending ? <Spinner /> : null}
            {saveOverride.isPending ? 'Saving…' : 'Save override'}
          </button>
        </>
      }
    >
      {overrideEditTarget ? (
        <form
          id="edit-override-form"
          className="form-stack"
          onSubmit={submitOverrideEdit}
        >
          <Field id="edit-override-date" label="Date">
            <input
              id="edit-override-date"
              type="date"
              value={overrideEditDate}
              onChange={(event) => setOverrideEditDate(event.target.value)}
            />
          </Field>
          {editOverrideDateTaken ? (
            <p className="field__error" role="alert">
              That date already has an override. Choose another date.
            </p>
          ) : null}
          <label className="check-line">
            <input
              type="checkbox"
              checked={overrideEditAvailable}
              onChange={(event) =>
                setOverrideEditAvailable(event.target.checked)
              }
            />
            <span>Add extra hours instead of closing</span>
          </label>
          {overrideEditAvailable ? (
            <div className="form-row">
              <Field id="edit-override-start" label="From">
                <input
                  id="edit-override-start"
                  type="time"
                  value={overrideEditStart}
                  onChange={(event) => setOverrideEditStart(event.target.value)}
                />
              </Field>
              <Field id="edit-override-end" label="To">
                <input
                  id="edit-override-end"
                  type="time"
                  value={overrideEditEnd}
                  onChange={(event) => setOverrideEditEnd(event.target.value)}
                />
              </Field>
            </div>
          ) : null}
          {!overrideEditOrder ? (
            <p className="field__error" role="alert">
              The end time must be after the start time.
            </p>
          ) : null}
          {saveOverride.isError ? <InlineError error={saveOverride.error} /> : null}
        </form>
      ) : null}
    </Dialog>
  );
}
