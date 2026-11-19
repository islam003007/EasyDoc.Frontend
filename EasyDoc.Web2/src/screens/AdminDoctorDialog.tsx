import { useMutation, useQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AdminDoctor, LookupItem } from '../api/contracts';
import {
  fetchAdminDoctor,
  queryKeys,
  updateAdminDoctor,
  useCities,
} from '../api/queries';
import { Dialog } from '../ui/Dialog';
import { ErrorPanel, InlineError } from '../ui/ErrorPanel';
import { Field } from '../ui/Field';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';

function matchingCityId(doctor: AdminDoctor, cities: LookupItem[]): string {
  if (doctor.cityId && cities.some((city) => city.id === doctor.cityId)) {
    return doctor.cityId;
  }
  const normalized = doctor.city?.trim().toLowerCase();
  if (!normalized) return '';
  return (
    cities.find((city) => city.name.trim().toLowerCase() === normalized)?.id ?? ''
  );
}

function DoctorForm({
  doctor,
  cities,
  onClose,
  onSaved,
}: {
  doctor: AdminDoctor;
  cities: LookupItem[];
  onClose: () => void;
  onSaved: (doctor: AdminDoctor) => void;
}) {
  const [personName, setPersonName] = useState(doctor.personName);
  const [phoneNumber, setPhoneNumber] = useState(doctor.phoneNumber ?? '');
  const [cityId, setCityId] = useState(() => matchingCityId(doctor, cities));
  const [clinicAddress, setClinicAddress] = useState(doctor.clinicAddress ?? '');
  const [duration, setDuration] = useState(
    String(doctor.defaultAppointmentTimeInMinutes || 30),
  );
  const [description, setDescription] = useState(doctor.description ?? '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    doctor.profilePictureUrl ?? '',
  );
  const [isVisible, setIsVisible] = useState(doctor.isVisible);

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

  const save = useMutation({
    mutationFn: () =>
      updateAdminDoctor({
        doctorId: doctor.id,
        personName,
        phoneNumber,
        cityId: cityId || undefined,
        clinicAddress,
        defaultAppointmentTimeInMinutes: numericDuration,
        description,
        profilePictureUrl,
        isVisible,
      }),
    onSuccess: () => {
      const selectedCity = cities.find((city) => city.id === cityId);
      onSaved({
        ...doctor,
        personName: personName.trim(),
        phoneNumber: phoneNumber.trim(),
        cityId: cityId || undefined,
        city: selectedCity?.name ?? doctor.city,
        clinicAddress: clinicAddress.trim(),
        defaultAppointmentTimeInMinutes: numericDuration,
        description: description.trim() || undefined,
        profilePictureUrl: profilePictureUrl.trim() || undefined,
        isVisible,
      });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    save.mutate();
  }

  return (
    <Dialog
      open
      title="Doctor record"
      kicker="Admin directory"
      description="Edit the profile patients see and the details used by scheduling. Nothing is removed from the directory."
      onClose={() => {
        if (!save.isPending) onClose();
      }}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={save.isPending}
          >
            Close
          </button>
          <button
            type="submit"
            form="admin-doctor-form"
            className="btn btn--primary"
            disabled={!canSave || save.isPending}
          >
            {save.isPending ? <Spinner /> : <Save size={15} aria-hidden="true" />}
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="admin-doctor-form" className="form-stack" onSubmit={submit}>
        <div className="dialog-context">
          <Monogram name={doctor.personName} size="sm" />
          <div>
            <strong><bdi dir="auto">{doctor.personName}</bdi></strong>
            <span>{doctor.email || 'No email on file'}</span>
          </div>
          <span className="mini-label">{doctor.department ?? 'Care team'}</span>
        </div>

        <div className="form-row">
          <Field id="admin-doctor-name" label="Name">
            <input
              id="admin-doctor-name"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              dir="auto"
              required
            />
          </Field>
          <Field id="admin-doctor-phone" label="Phone">
            <input
              id="admin-doctor-phone"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+20 100 000 0000"
              required
            />
          </Field>
        </div>

        <div className="form-row">
          <Field id="admin-doctor-city" label="City">
            <select
              id="admin-doctor-city"
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
            >
              <option value="">Choose a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="admin-doctor-duration"
            label="Default visit length"
            hint="Minutes per appointment, 10–120."
          >
            <input
              id="admin-doctor-duration"
              type="number"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              min={10}
              max={120}
              step={5}
              required
            />
          </Field>
        </div>

        <Field id="admin-doctor-address" label="Clinic address">
          <input
            id="admin-doctor-address"
            value={clinicAddress}
            onChange={(event) => setClinicAddress(event.target.value)}
            required
          />
        </Field>

        <Field id="admin-doctor-description" label="Description">
          <textarea
            id="admin-doctor-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="How the practice describes itself to patients"
          />
        </Field>

        <Field
          id="admin-doctor-picture"
          label="Profile picture URL"
          hint="Optional. This demo draws a monogram instead."
        >
          <input
            id="admin-doctor-picture"
            type="url"
            value={profilePictureUrl}
            onChange={(event) => setProfilePictureUrl(event.target.value)}
            placeholder="https://…"
          />
        </Field>

        <Field
          id="admin-doctor-visibility"
          label="Directory visibility"
          hint="Visibility is reversible at any time from the same record."
        >
          <select
            id="admin-doctor-visibility"
            value={isVisible ? 'listed' : 'hidden'}
            onChange={(event) => setIsVisible(event.target.value === 'listed')}
          >
            <option value="listed">Listed in patient search</option>
            <option value="hidden">Hidden from patients</option>
          </select>
        </Field>

        {!durationValid ? (
          <p className="field__error" role="alert">
            Visit length must be between 10 and 120 minutes.
          </p>
        ) : null}

        {save.isError ? <InlineError error={save.error} /> : null}
      </form>
    </Dialog>
  );
}

export function AdminDoctorDialog({
  doctorId,
  onClose,
  onSaved,
}: {
  doctorId: string;
  onClose: () => void;
  onSaved: (doctor: AdminDoctor) => void;
}) {
  const doctorQuery = useQuery({
    queryKey: queryKeys.adminDoctor(doctorId),
    queryFn: ({ signal }) => fetchAdminDoctor(doctorId, signal),
  });
  const cities = useCities();

  if (doctorQuery.data && cities.isSuccess) {
    return (
      <DoctorForm
        key={doctorQuery.data.id}
        doctor={doctorQuery.data}
        cities={cities.data}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <Dialog
      open
      title="Doctor record"
      kicker="Admin directory"
      onClose={onClose}
      wide
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="This doctor record could not be loaded"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {cities.isError ? (
        <ErrorPanel
          error={cities.error}
          title="The city list could not be loaded"
          onRetry={() => {
            void cities.refetch();
          }}
        />
      ) : null}

      {doctorQuery.isPending || cities.isPending ? (
        <div className="form-stack" aria-busy="true" aria-label="Loading doctor record">
          <Skeleton width="100%" height="4rem" />
          <div className="form-row">
            <Skeleton height="2.8rem" />
            <Skeleton height="2.8rem" />
          </div>
          <Skeleton width="100%" height="2.8rem" />
          <Skeleton width="100%" height="5rem" />
        </div>
      ) : null}
    </Dialog>
  );
}
