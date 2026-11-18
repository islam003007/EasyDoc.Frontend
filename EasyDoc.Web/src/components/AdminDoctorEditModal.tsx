import { useMutation, useQuery } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { describeError } from '../api/client';
import type { AdminDoctor, LookupItem } from '../api/contracts';
import {
  fetchAdminDoctor,
  queryKeys,
  updateAdminDoctor,
  useCities,
} from '../api/queries';
import { ErrorPanel } from './ErrorPanel';
import { Skeleton, Spinner } from './Loading';
import { Modal } from './Modal';
import { Monogram } from './Monogram';

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

interface DoctorEditDialogProps {
  doctor: AdminDoctor;
  cities: LookupItem[];
  onSaved: (doctor: AdminDoctor) => void;
  onClose: () => void;
}

function DoctorEditDialog({
  doctor,
  cities,
  onSaved,
  onClose,
}: DoctorEditDialogProps) {
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
    <Modal
      open
      title="Doctor record."
      eyebrow="Admin · Directory"
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
            form="admin-doctor-edit-form"
            className="btn btn--primary"
            disabled={!canSave || save.isPending}
          >
            {save.isPending ? <Spinner /> : <Save size={16} aria-hidden="true" />}
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="admin-doctor-edit-form" className="form-stack" onSubmit={submit}>
        <div className="modal-context">
          <span className="mono-label">Directory record</span>
          <div className="edit-identity">
            <Monogram name={doctor.personName} size="sm" />
            <div>
              <strong>{doctor.personName}</strong>
              <span>{doctor.email || 'No email on file'}</span>
            </div>
          </div>
          <span className="modal-context__meta">
            {doctor.department ?? 'Care team'}
          </span>
        </div>

        <div className="field-row">
          <label className="field">
            <span>Name *</span>
            <input
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              required
              maxLength={200}
              data-autofocus
            />
          </label>
          <label className="field">
            <span>Phone *</span>
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              required
              inputMode="tel"
              placeholder="+20 100 000 0000"
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            <span>City</span>
            <select
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
          </label>
          <label className="field">
            <span>Default visit length *</span>
            <input
              type="number"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              min={10}
              max={120}
              step={5}
              required
            />
            <span className="field__hint">Minutes per appointment, 10–120.</span>
          </label>
        </div>

        <label className="field">
          <span>Clinic address *</span>
          <input
            value={clinicAddress}
            onChange={(event) => setClinicAddress(event.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>
            Description <span className="field__optional">optional</span>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="How the practice describes itself to patients"
          />
        </label>

        <label className="field">
          <span>
            Profile picture URL <span className="field__optional">optional</span>
          </span>
          <input
            value={profilePictureUrl}
            onChange={(event) => setProfilePictureUrl(event.target.value)}
            placeholder="https://…"
            inputMode="url"
          />
        </label>

        <label className="field">
          <span>Directory visibility</span>
          <select
            value={isVisible ? 'listed' : 'hidden'}
            onChange={(event) => setIsVisible(event.target.value === 'listed')}
          >
            <option value="listed">Listed in patient search</option>
            <option value="hidden">Hidden from patients</option>
          </select>
          <span className="field__hint">
            Visibility is reversible at any time from the same record.
          </span>
        </label>

        {!durationValid ? (
          <p className="form-hint form-hint--error">
            Visit length must be between 10 and 120 minutes.
          </p>
        ) : null}

        {save.isError ? (
          <p className="form-error" role="alert">
            {describeError(save.error)}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

export function AdminDoctorEditModal({
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
      <DoctorEditDialog
        key={doctorQuery.data.id}
        doctor={doctorQuery.data}
        cities={cities.data}
        onSaved={onSaved}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal
      open
      title="Doctor record."
      eyebrow="Admin · Directory"
      description="Edit the profile patients see and the details used by scheduling. Nothing is removed from the directory."
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
          compact
        />
      ) : null}

      {cities.isError ? (
        <ErrorPanel
          error={cities.error}
          title="The city list could not be loaded"
          onRetry={() => {
            void cities.refetch();
          }}
          compact
        />
      ) : null}

      {doctorQuery.isPending || cities.isPending ? (
        <div className="form-stack" aria-busy="true" aria-label="Loading doctor record">
          <Skeleton width="100%" height="4rem" />
          <div className="field-row">
            <Skeleton height="2.8rem" />
            <Skeleton height="2.8rem" />
          </div>
          <Skeleton width="100%" height="2.8rem" />
          <Skeleton width="100%" height="5rem" />
        </div>
      ) : null}
    </Modal>
  );
}
