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
import type { DoctorDetail } from '../api/contracts';
import { fetchDoctorMe, queryKeys, updateDoctorMe } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Dialog } from '../ui/Dialog';
import { ErrorPanel, InlineError } from '../ui/ErrorPanel';
import { Field } from '../ui/Field';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';

export function DoctorProfileScreen() {
  useDocumentTitle('Public profile');
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
    <div className="page">
      <PageHeader
        title="Your public face in the clinic."
        lead="This is the profile patients see in the directory. Edit the public record here; availability is managed separately."
        actions={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={openEdit}
              disabled={!doctor}
            >
              <Pencil size={15} aria-hidden="true" />
              Edit profile
            </button>
            <Link to="/doctor/schedule" className="btn btn--ghost">
              <CalendarDays size={15} aria-hidden="true" />
              Manage schedule
            </Link>
          </>
        }
      />

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
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
        <div className="split" aria-busy="true" aria-label="Loading profile">
          <div className="sheet">
            <div className="sheet__body stack">
              <Skeleton width="86px" height="86px" />
              <Skeleton width="45%" height="2rem" />
              <Skeleton width="100%" height="1rem" />
              <Skeleton width="90%" height="1rem" />
            </div>
          </div>
          <div className="sheet">
            <div className="sheet__body stack">
              <Skeleton width="45%" height="1rem" />
              <Skeleton width="100%" height="8rem" />
            </div>
          </div>
        </div>
      ) : null}

      {doctor ? (
        <>
          <header className="doctor-head">
            <Monogram name={doctor.personName} size="xl" />
            <div className="doctor-head__copy">
              <p className="doctor-head__kicker">
                {doctor.department ?? 'Care team'}, {doctor.city ?? 'Egypt'}
              </p>
              <h1><bdi dir="auto">{doctor.personName}</bdi></h1>
              <p className="doctor-head__lead">
                {doctor.description ??
                  'No biography has been written yet. A short description helps patients understand the practice before they book.'}
              </p>
              <div className="doctor-facts">
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
          </header>

          <div className="split">
            <section className="sheet">
              <div className="sheet__head">
                <div>
                  <p className="sheet__kicker">Directory entry</p>
                  <h2>The details patients rely on.</h2>
                </div>
              </div>
              <div className="sheet__body">
                <dl className="facts-grid">
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
                        <a
                          className="phone-link"
                          href={`tel:${doctor.phoneNumber}`}
                          dir="ltr"
                        >
                          <Phone size={12} aria-hidden="true" />
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

                <div className="profile-bio">
                  <p className="mini-label">Biography</p>
                  <p>
                    {doctor.description ??
                      'No biography has been added yet. Patients see this space when they open your profile.'}
                  </p>
                </div>
              </div>
            </section>

            <aside className="sheet sticky-panel">
              <div className="sheet__head">
                <div>
                  <p className="sheet__kicker">As patients see it</p>
                  <h2>Your directory card.</h2>
                </div>
              </div>
              <div className="sheet__body">
                <div className="profile-preview">
                  <Monogram name={doctor.personName} size="md" />
                  <div className="profile-preview__copy">
                    <strong><bdi dir="auto">{doctor.personName}</bdi></strong>
                    <span>
                      {doctor.department ?? 'Care team'}, {doctor.city ?? 'Egypt'}
                    </span>
                  </div>
                  <span className="profile-preview__go">
                    View times
                    <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>

                <dl className="mini-facts">
                  <div>
                    <dt>Role</dt>
                    <dd>Doctor</dd>
                  </div>
                  <div>
                    <dt>Availability</dt>
                    <dd>Weekly hours and date overrides</dd>
                  </div>
                  <div>
                    <dt>Directory</dt>
                    <dd>Listed by an administrator</dd>
                  </div>
                </dl>

                <div className="stack--tight" style={{ marginTop: '0.9rem' }}>
                  <Link to="/doctor" className="btn btn--primary btn--block">
                    Open practice board
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                  <Link
                    to="/doctor/schedule"
                    className="btn btn--secondary btn--block"
                  >
                    <CalendarDays size={15} aria-hidden="true" />
                    Edit availability
                  </Link>
                </div>
                <p className="profile-preview__note">
                  Profile photos are managed by URL in this demo; uploads are out
                  of scope.
                </p>
              </div>
            </aside>
          </div>

          <section className="profile-callout">
            <Stethoscope size={17} aria-hidden="true" />
            <p>
              Patients only see profiles an administrator has listed. Hiding a
              profile is an administrator action, not a doctor one.
            </p>
          </section>
        </>
      ) : null}

      <Dialog
        open={editOpen}
        title="Edit your profile"
        kicker="Doctor profile"
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
                hint="Stored for other clients; this demo draws a monogram."
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
        ) : null}
      </Dialog>
    </div>
  );
}
