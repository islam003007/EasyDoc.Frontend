import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchDoctorMe, queryKeys } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { ErrorPanel } from '../components/ErrorPanel';
import { Skeleton } from '../components/Loading';
import { Monogram } from '../components/Monogram';
import { PageHeader } from '../components/PageHeader';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function DoctorProfilePage() {
  useDocumentTitle('My profile');
  const { session } = useSession();

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctorMe,
    queryFn: ({ signal }) => fetchDoctorMe(signal),
  });

  const doctor = doctorQuery.data;

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
        lead="This is the directory record patients open when they find you. Availability is managed separately, on the schedule page."
        actions={
          <Link to="/doctor/schedule" className="btn btn--secondary">
            <CalendarDays size={16} aria-hidden="true" />
            Manage schedule
          </Link>
        }
      />

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
                  <dt>Account email</dt>
                  <dd>{doctor.email ?? session?.email ?? '—'}</dd>
                </div>
              </dl>

              <div className="profile-description">
                <p className="mono-label">Biography</p>
                <p>
                  {doctor.description ??
                    'No description is currently attached to this doctor record.'}
                </p>
              </div>
            </section>

            <aside className="side-card side-card--sticky">
              <p className="eyebrow">As patients see it</p>
              <h2>How patients see you.</h2>
              <p>
                The seeded profile-image URLs are placeholders, so this demo uses a
                typographic monogram throughout the directory and booking flow.
              </p>
              <dl className="mini-list">
                <div>
                  <dt>Record</dt>
                  <dd className="code-value">{doctor.id}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>Doctor</dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>Weekly hours + date overrides</dd>
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
                Profile editing and uploads are out of scope for this demo.
              </p>
            </aside>
          </div>

          <section className="profile-callout">
            <Stethoscope size={18} aria-hidden="true" />
            <p>
              The public directory is generated from visible doctor records. Hiding a
              profile is an administrator action, not a doctor one.
            </p>
          </section>
        </>
      ) : null}
    </div>
  );
}
