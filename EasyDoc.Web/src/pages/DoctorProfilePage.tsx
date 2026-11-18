import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../api/client';
import type { DoctorDetail } from '../api/contracts';
import {
  fetchDoctorMe,
  queryKeys,
  updateDoctorMe,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { ErrorPanel } from '../components/ErrorPanel';
import { Spinner, Skeleton } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Monogram } from '../components/Monogram';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function DoctorProfilePage() {
  useDocumentTitle('My profile');
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [duration, setDuration] = useState('30');
  const [description, setDescription] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctorMe,
    queryFn: ({ signal }) => fetchDoctorMe(signal),
  });

  const saveProfile = useMutation({
    mutationFn: () =>
      updateDoctorMe({
        personName,
        phoneNumber,
        clinicAddress,
        defaultAppointmentTimeInMinutes: Number(duration),
        description,
        profilePictureUrl,
      }),
    onSuccess: () => {
      if (doctorQuery.data) {
        const updated: DoctorDetail = {
          ...doctorQuery.data,
          personName: personName.trim(),
          phoneNumber: phoneNumber.trim(),
          clinicAddress: clinicAddress.trim(),
          defaultAppointmentTimeInMinutes: Number(duration),
          description: description.trim() || undefined,
          profilePictureUrl: profilePictureUrl.trim() || undefined,
        };
        queryClient.setQueryData(queryKeys.doctorMe, updated);
        queryClient.setQueryData(queryKeys.doctor(updated.id), updated);
      }
      setEditOpen(false);
      setNotice('Your public profile was updated.');
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });

  const doctor = doctorQuery.data;
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

  function openEdit() {
    if (!doctor) return;
    setPersonName(doctor.personName);
    setPhoneNumber(doctor.phoneNumber ?? '');
    setClinicAddress(doctor.clinicAddress ?? '');
    setDuration(String(doctor.defaultAppointmentTimeInMinutes || 30));
    setDescription(doctor.description ?? '');
    setProfilePictureUrl(doctor.profilePictureUrl ?? '');
    saveProfile.reset();
    setEditOpen(true);
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    saveProfile.mutate();
  }

  return (
    <div className="page page--doctor-profile">
      <PageHeader
        eyebrow="Profile · Doctor"
        index="03"
        title={
          <>
            Your public
            <br />
            <em>face in the clinic.</em>
          </>
        }
        lead="This is the profile patients see when they find you in the directory. Edit the public record here; availability is managed separately, on the schedule page."
        actions={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={openEdit}
              disabled={!doctor}
            >
              <Pencil size={16} aria-hidden="true" />
              Edit profile
            </button>
            <Link to="/doctor/schedule" className="btn btn--secondary">
              <CalendarDays size={16} aria-hidden="true" />
              Manage schedule
            </Link>
          </>
        }
      />

      {notice ? (
        <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      ) : null}

      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="Your profile could not be loaded"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {doctorQuery.isPending ? (
        <div className="profile-layout" aria-busy="true" aria-label="Loading profile">
          <div className="paper-section">
            <Skeleton width="6rem" height="6rem" className="skeleton--round" />
            <Skeleton width="45%" height="2rem" />
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="90%" height="1rem" />
          </div>
          <div className="side-card">
            <Skeleton width="45%" height="1rem" />
            <Skeleton width="100%" height="8rem" />
          </div>
        </div>
      ) : null}

      {doctor ? (
        <>
          <section className="profile-hero">
            <Monogram name={doctor.personName} size="xl" />
            <div>
              <p className="eyebrow">
                <span className="eyebrow__index">Public</span>
                {doctor.department ?? 'Care team'} · {doctor.city ?? 'Egypt'}
              </p>
              <h1>{doctor.personName}</h1>
              <p className="profile-hero__lead">
                {doctor.description ??
                  'No biography has been written yet. A short description helps patients understand your practice before they book.'}
              </p>
              <div className="doctor-hero__facts">
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {doctor.clinicAddress ?? 'Clinic address on file'}
                </span>
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {doctor.defaultAppointmentTimeInMinutes} minute visits
                </span>
                <span>
                  <Mail size={14} aria-hidden="true" />
                  {doctor.email ?? session?.email}
                </span>
              </div>
            </div>
          </section>

          <div className="profile-layout">
            <section className="paper-section">
              <p className="eyebrow">Directory entry</p>
              <h2>The details patients rely on.</h2>
              <dl className="practice-list practice-list--wide">
                <div>
                  <dt>Specialty</dt>
                  <dd>{doctor.department ?? '—'}</dd>
                </div>
                <div>
                  <dt>City</dt>
                  <dd>{doctor.city ?? '—'}</dd>
                </div>
                <div>
                  <dt>Clinic address</dt>
                  <dd>{doctor.clinicAddress ?? '—'}</dd>
                </div>
                <div>
                  <dt>Visit length</dt>
                  <dd>{doctor.defaultAppointmentTimeInMinutes} minutes</dd>
                </div>
                <div>
                  <dt>Public phone</dt>
                  <dd>
                    {doctor.phoneNumber ? (
                      <a className="text-link" href={`tel:${doctor.phoneNumber}`}>
                        <Phone size={14} aria-hidden="true" />
                        {doctor.phoneNumber}
                      </a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Contact email</dt>
                  <dd>{doctor.email ?? session?.email ?? '—'}</dd>
                </div>
              </dl>

              <div className="profile-description">
                <p className="mono-label">Biography</p>
                <p>
                  {doctor.description ??
                    'No biography has been added yet.'}
                </p>
              </div>
            </section>

            <aside className="side-card side-card--sticky">
              <p className="eyebrow">As patients see it</p>
              <h2>How patients see you.</h2>
              <p>
                This demo uses a typographic monogram throughout the directory and
                booking flow; a profile picture URL is stored with the record for
                other clients.
              </p>
              <dl className="mini-list">
                <div>
                  <dt>Role</dt>
                  <dd>Doctor</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>Weekly hours + date overrides</dd>
                </div>
                <div>
                  <dt>Directory</dt>
                  <dd>Listed by an administrator</dd>
                </div>
              </dl>
              <div className="side-card__actions">
                <Link to="/doctor" className="btn btn--primary btn--block">
                  Open practice board
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/doctor/schedule" className="btn btn--secondary btn--block">
                  <CalendarDays size={15} aria-hidden="true" />
                  Edit availability
                </Link>
              </div>
              <p className="helper-note">
                Profile photos are managed by URL. Uploads are out of scope for
                this demo.
              </p>
            </aside>
          </div>

          <section className="profile-callout">
            <Stethoscope size={18} aria-hidden="true" />
            <p>
              Patients only see profiles an administrator has listed. Hiding a
              profile is an administrator action, not a doctor one.
            </p>
          </section>
        </>
      ) : null}

      <Modal
        open={editOpen}
        title="Edit your profile."
        eyebrow="Doctor · Public record"
        description="These details appear in the patient directory. City and specialty are managed by the clinic administrator."
        onClose={() => {
          if (!saveProfile.isPending) {
            setEditOpen(false);
            saveProfile.reset();
          }
        }}
        wide
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setEditOpen(false);
                saveProfile.reset();
              }}
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
        {doctor ? (
          <form
            id="doctor-profile-form"
            className="form-stack"
            onSubmit={submitProfile}
          >
            <p className="modal-context">
              <span className="mono-label">Account email</span>
              {doctor.email ?? session?.email ?? '—'}
            </p>

            <div className="field-row">
              <label className="field">
                <span>Name *</span>
                <input
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                  maxLength={200}
                  required
                  data-autofocus
                />
              </label>
              <label className="field">
                <span>Phone *</span>
                <input
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  inputMode="tel"
                  required
                />
              </label>
            </div>

            <div className="field-row">
              <label className="field">
                <span>Clinic address *</span>
                <input
                  value={clinicAddress}
                  onChange={(event) => setClinicAddress(event.target.value)}
                  required
                />
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
                <span className="field__hint">Minutes per appointment.</span>
              </label>
            </div>

            <label className="field">
              <span>
                Biography <span className="field__optional">optional</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="A short introduction for patients"
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

            {!durationValid ? (
              <p className="form-hint form-hint--error">
                Visit length must be between 10 and 120 minutes.
              </p>
            ) : null}

            {saveProfile.isError ? (
              <p className="form-error" role="alert">
                {describeError(saveProfile.error)}
              </p>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
