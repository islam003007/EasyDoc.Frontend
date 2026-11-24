import { useMutation } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { DoctorDetail } from '../../api/contracts';
import { updateDoctorMe } from '../../api/queries';
import { Dialog } from '../../ui/Dialog';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';

export function DoctorProfileEditorDialog({
  doctor,
  onClose,
  onSaved,
}: {
  doctor: DoctorDetail;
  onClose: () => void;
  onSaved: (doctor: DoctorDetail) => void;
}) {
  const [personName, setPersonName] = useState(doctor.personName);
  const [phoneNumber, setPhoneNumber] = useState(doctor.phoneNumber ?? '');
  const [clinicAddress, setClinicAddress] = useState(doctor.clinicAddress ?? '');
  const [duration, setDuration] = useState(
    String(doctor.defaultAppointmentTimeInMinutes || 30),
  );
  const [description, setDescription] = useState(doctor.description ?? '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    doctor.profilePictureUrl ?? '',
  );

  const saveProfile = useMutation({
    mutationFn: () => {
      const numericDuration = Number(duration);
      return updateDoctorMe({
        personName,
        phoneNumber,
        clinicAddress,
        defaultAppointmentTimeInMinutes: numericDuration,
        description,
        profilePictureUrl,
      }).then(() => numericDuration);
    },
    onSuccess: (numericDuration) => {
      onSaved({
        ...doctor,
        personName: personName.trim(),
        phoneNumber: phoneNumber.trim(),
        clinicAddress: clinicAddress.trim(),
        defaultAppointmentTimeInMinutes: numericDuration,
        description: description.trim() || undefined,
        profilePictureUrl: profilePictureUrl.trim() || undefined,
      });
    },
  });

  const numericDuration = Number(duration);
  const durationValid =
    Number.isFinite(numericDuration) &&
    numericDuration >= 10 &&
    numericDuration <= 120;
  const canSave =
    personName.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    clinicAddress.trim().length > 0 &&
    durationValid;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    saveProfile.mutate();
  }

  return (
    <Dialog
      open
      title="Edit your profile"
      kicker="Doctor profile"
      description="These details appear in the patient directory. City and specialty are managed by the clinic administrator."
      onClose={() => {
        if (!saveProfile.isPending) onClose();
      }}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={saveProfile.isPending}
          >
            Keep current profile
          </button>
          <button
            type="submit"
            form="doctor-profile-form"
            className="btn btn--primary"
            disabled={!canSave || saveProfile.isPending}
          >
            {saveProfile.isPending ? <Spinner /> : <Pencil size={15} aria-hidden="true" />}
            {saveProfile.isPending ? 'Saving profile…' : 'Save profile'}
          </button>
        </>
      }
    >
      <form id="doctor-profile-form" className="form-stack" onSubmit={submit}>
        <div className="form-row">
          <Field id="profile-name" label="Full name">
            <input
              id="profile-name"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              dir="auto"
              required
            />
          </Field>
          <Field id="profile-phone" label="Public phone">
            <input
              id="profile-phone"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              dir="ltr"
              required
            />
          </Field>
        </div>

        <Field id="profile-address" label="Clinic address">
          <input
            id="profile-address"
            value={clinicAddress}
            onChange={(event) => setClinicAddress(event.target.value)}
            required
          />
        </Field>

        <div className="form-row">
          <Field
            id="profile-duration"
            label="Visit length (minutes)"
            hint="Between 10 and 120 minutes."
          >
            <input
              id="profile-duration"
              type="number"
              min={10}
              max={120}
              step={5}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              aria-invalid={!durationValid}
              aria-describedby="profile-duration-hint"
            />
          </Field>
          <Field
            id="profile-picture"
            label="Profile picture URL"
            hint="Optional. This demo uses initials instead of a photo."
          >
            <input
              id="profile-picture"
              type="url"
              value={profilePictureUrl}
              onChange={(event) => setProfilePictureUrl(event.target.value)}
              placeholder="https://…"
              aria-describedby="profile-picture-hint"
            />
          </Field>
        </div>

        {!durationValid ? (
          <p className="field__error" role="alert">
            Enter a visit length between 10 and 120 minutes.
          </p>
        ) : null}

        <Field id="profile-description" label="Biography">
          <textarea
            id="profile-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What should patients know before they book?"
          />
        </Field>

        {saveProfile.isError ? <InlineError error={saveProfile.error} /> : null}
      </form>
    </Dialog>
  );
}
