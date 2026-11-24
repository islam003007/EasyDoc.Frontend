import { ClipboardCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Appointment } from '../../api/contracts';
import { formatDateMedium, formatTimeRange } from '../../lib/dates';
import { Dialog } from '../../ui/Dialog';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';

export function CompleteVisitDialog({
  target,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  target: Appointment | null;
  pending: boolean;
  error: unknown;
  onClose: () => void;
  onSubmit: (input: {
    appointment: Appointment;
    diagnosis: string;
    prescription: string;
    notes: string;
  }) => void;
}) {
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  const canComplete =
    Boolean(target) &&
    diagnosis.trim().length > 0 &&
    prescription.trim().length > 0;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || !canComplete) return;
    onSubmit({
      appointment: target,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <Dialog
      open={Boolean(target)}
      title="Write the visit record"
      kicker={target?.patientName ?? 'Patient'}
      description="Diagnosis and prescription are saved to the visit and visible to the patient. Notes are optional."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={pending}
          >
            Go back
          </button>
          <button
            type="submit"
            form="complete-visit-form"
            className="btn btn--primary"
            disabled={!canComplete || pending}
          >
            {pending ? <Spinner /> : <ClipboardCheck size={15} aria-hidden="true" />}
            {pending ? 'Saving notes…' : 'Complete visit'}
          </button>
        </>
      }
    >
      {target ? (
        <form id="complete-visit-form" className="form-stack" onSubmit={submit}>
          <p className="quiet">
            {formatDateMedium(target.date)} ·{' '}
            {formatTimeRange(target.startTime, target.endTime)}
          </p>
          <Field id="visit-diagnosis" label="Diagnosis">
            <input
              id="visit-diagnosis"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
              placeholder="What did the visit find?"
              required
            />
          </Field>
          <Field id="visit-prescription" label="Prescription">
            <textarea
              id="visit-prescription"
              value={prescription}
              onChange={(event) => setPrescription(event.target.value)}
              placeholder="Medicine, dose, and instructions."
              required
            />
          </Field>
          <Field
            id="visit-notes"
            label="Notes"
            hint="Optional. Anything the next visit should know."
          >
            <textarea
              id="visit-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional notes"
            />
          </Field>
          {error ? <InlineError error={error} /> : null}
        </form>
      ) : null}
    </Dialog>
  );
}
