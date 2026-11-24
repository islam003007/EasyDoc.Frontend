import { Pencil } from 'lucide-react';
import { Dialog } from '../../ui/Dialog';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';
import type { PatientDetailsState } from './usePatientDetails';

export function PatientDetailsDialog({
  details,
}: {
  details: PatientDetailsState;
}) {
  return (
    <Dialog
      open={details.editOpen}
      title="Edit your details"
      kicker="Patient account"
      description="Your name and phone number appear on your visits. The email on the account stays fixed."
      onClose={details.closeEdit}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={details.closeEdit}
            disabled={details.savePatient.isPending}
          >
            Keep current details
          </button>
          <button
            type="submit"
            form="account-form"
            className="btn btn--primary"
            disabled={!details.canSave || details.savePatient.isPending}
          >
            {details.savePatient.isPending ? (
              <Spinner />
            ) : (
              <Pencil size={15} aria-hidden="true" />
            )}
            {details.savePatient.isPending ? 'Saving…' : 'Save details'}
          </button>
        </>
      }
    >
      <form
        id="account-form"
        className="form-stack"
        onSubmit={details.submitPatient}
      >
        <Field id="account-name" label="Full name">
          <input
            id="account-name"
            value={details.personName}
            onChange={(event) => details.setPersonName(event.target.value)}
            dir="auto"
            required
          />
        </Field>
        <Field id="account-phone" label="Phone number">
          <input
            id="account-phone"
            type="tel"
            value={details.phoneNumber}
            onChange={(event) => details.setPhoneNumber(event.target.value)}
            dir="ltr"
            required
          />
        </Field>
        {details.savePatient.isError ? (
          <InlineError error={details.savePatient.error} />
        ) : null}
      </form>
    </Dialog>
  );
}
