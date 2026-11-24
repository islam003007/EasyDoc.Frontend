import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { DoctorDetail } from '../api/contracts';
import { fetchDoctorMe, queryKeys } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { DoctorProfileEditorDialog } from '../features/profile/DoctorProfileEditorDialog';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';

export function DoctorProfileScreen() {
  useDocumentTitle('Public profile');
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctorMe,
    queryFn: ({ signal }) => fetchDoctorMe(signal),
  });

  const doctor = doctorQuery.data;

  function openEdit() {
    if (!doctor) return;
    setEditOpen(true);
  }

  function applySavedDoctor(updated: DoctorDetail) {
    queryClient.setQueryData(queryKeys.doctorMe, updated);
    queryClient.setQueryData(queryKeys.doctor(updated.id), updated);
    setEditOpen(false);
    setNotice('Your public profile was updated.');
    void queryClient.invalidateQueries({ queryKey: queryKeys.session });
  }

  return (
    <div className="page">
      <PageHeader
        title="Your public profile."
        lead="This is what patients see in the directory. Edit your public details here; manage availability separately."
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
          title="We couldn’t load your profile"
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
              <h1>
                <bdi dir="auto">{doctor.personName}</bdi>
              </h1>
              <p className="doctor-head__lead">
                {doctor.description ??
                  'You haven’t added a biography yet. A short description helps patients know what to expect.'}
              </p>
              <div className="doctor-facts">
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {doctor.clinicAddress ?? 'Clinic address not provided'}
                </span>
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {doctor.defaultAppointmentTimeInMinutes}-minute visits
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
                      'You haven’t added a biography yet. Patients see this space on your profile.'}
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
                    <strong>
                      <bdi dir="auto">{doctor.personName}</bdi>
                    </strong>
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

                <div className="stack--tight profile-shortcuts">
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
                  Profile photos are added by URL. Uploads aren’t supported in this
                  demo.
                </p>
              </div>
            </aside>
          </div>

          <section className="profile-callout">
            <Stethoscope size={17} aria-hidden="true" />
            <p>
              Patients only see profiles an administrator has listed. Listing and
              hiding profiles is an administrator action.
            </p>
          </section>
        </>
      ) : null}

      {editOpen && doctor ? (
        <DoctorProfileEditorDialog
          doctor={doctor}
          onClose={() => setEditOpen(false)}
          onSaved={applySavedDoctor}
        />
      ) : null}
    </div>
  );
}
