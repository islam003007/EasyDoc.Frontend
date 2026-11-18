import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  RefreshCw,
  Search as SearchIcon,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AdminDoctor } from '../api/contracts';
import { describeError } from '../api/client';
import {
  fetchAdminDoctors,
  queryKeys,
  updateDoctorVisibility,
} from '../api/queries';
import { AdminDoctorEditModal } from '../components/AdminDoctorEditModal';
import { AdminTabs } from '../components/AdminTabs';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Skeleton } from '../components/Loading';
import { Monogram } from '../components/Monogram';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatGrid } from '../components/StatGrid';
import { VisibilityPill } from '../components/StatusPill';
import { plural } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function VisibilityToggle({
  doctor,
  onNotice,
  onError,
}: {
  doctor: AdminDoctor;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: (isVisible: boolean) =>
      updateDoctorVisibility(doctor.id, isVisible),
    onMutate: async (isVisible) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.adminDoctors });
      const previous = queryClient.getQueryData<AdminDoctor[]>(
        queryKeys.adminDoctors,
      );
      queryClient.setQueryData<AdminDoctor[]>(queryKeys.adminDoctors, (current) =>
        current?.map((entry) =>
          entry.id === doctor.id ? { ...entry, isVisible } : entry,
        ),
      );
      return { previous };
    },
    onError: (error, _isVisible, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.adminDoctors, context.previous);
      }
      onError(describeError(error));
    },
    onSuccess: (_data, isVisible) => {
      onNotice(
        `${doctor.personName} is now ${isVisible ? 'listed in' : 'hidden from'} the patient directory.`,
      );
    },
  });

  return (
    <button
      type="button"
      role="switch"
      aria-checked={doctor.isVisible}
      aria-label={`${doctor.isVisible ? 'Hide' : 'List'} ${doctor.personName}`}
      className={`toggle ${doctor.isVisible ? 'is-on' : ''}`.trim()}
      onClick={() => {
        toggle.mutate(!doctor.isVisible);
      }}
      disabled={toggle.isPending}
      aria-busy={toggle.isPending}
    >
      <span className="toggle__track" aria-hidden="true">
        <span className="toggle__thumb" />
      </span>
      <span>
        {toggle.isPending ? 'Saving…' : doctor.isVisible ? 'Hide' : 'List'}
      </span>
    </button>
  );
}

export function AdminDoctorsPage() {
  useDocumentTitle('Doctor directory');
  const queryClient = useQueryClient();
  const [term, setTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);

  const doctors = useQuery({
    queryKey: queryKeys.adminDoctors,
    queryFn: ({ signal }) => fetchAdminDoctors(signal),
  });

  function applySavedDoctor(updated: AdminDoctor) {
    queryClient.setQueryData<AdminDoctor[]>(queryKeys.adminDoctors, (current) =>
      current?.map((entry) => (entry.id === updated.id ? updated : entry)),
    );
    queryClient.setQueryData(queryKeys.adminDoctor(updated.id), updated);
    setEditDoctorId(null);
    setToggleError(null);
    setNotice(
      `${updated.personName} saved. The row and directory counts are already up to date.`,
    );
  }

  const all = doctors.data ?? [];
  const listed = all.filter((doctor) => doctor.isVisible).length;
  const hidden = all.length - listed;

  const filtered = useMemo(() => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return all;
    return all.filter((doctor) =>
      [
        doctor.personName,
        doctor.email,
        doctor.phoneNumber,
        doctor.department,
        doctor.city,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [all, term]);

  return (
    <div className="page page--admin">
      <PageHeader
        eyebrow="Network admin · Directory"
        index="01"
        title={
          <>
            The doctor
            <br />
            <em>directory.</em>
          </>
        }
        lead="Every doctor profile, including the ones patients cannot see. Open a record to edit its public details, or toggle visibility directly in the table."
        actions={
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              void doctors.refetch();
            }}
            disabled={doctors.isFetching}
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={doctors.isFetching ? 'spin' : undefined}
            />
            Refresh
          </button>
        }
      />

      <AdminTabs doctorCount={doctors.data?.length} />

      {notice ? <Notice onDismiss={() => setNotice(null)}>{notice}</Notice> : null}

      {toggleError ? (
        <Notice tone="error" onDismiss={() => setToggleError(null)}>
          {toggleError}
        </Notice>
      ) : null}

      {doctors.isError ? (
        <ErrorPanel
          error={doctors.error}
          title="The admin doctor list could not be loaded"
          onRetry={() => {
            void doctors.refetch();
          }}
        />
      ) : null}

      {doctors.isPending ? (
        <>
          <div className="stat-grid stat-grid--loading" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="stat-card">
                <Skeleton width="45%" height="0.7rem" />
                <Skeleton width="30%" height="2.2rem" />
              </div>
            ))}
          </div>
          <div className="table-card" aria-busy="true" aria-label="Loading doctors">
            {[0, 1, 2, 3].map((index) => (
              <div key={index} className="table-skeleton">
                <Skeleton width="3rem" height="3rem" className="skeleton--round" />
                <Skeleton width="35%" height="1rem" />
                <Skeleton width="22%" height="0.8rem" />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {doctors.isSuccess ? (
        <>
          <StatGrid
            stats={[
              {
                label: 'Doctors',
                value: all.length,
                note: 'Includes hidden profiles',
              },
              {
                label: 'Listed',
                value: listed,
                note: 'Visible to patient search',
                tone: 'scheduled',
              },
              {
                label: 'Hidden',
                value: hidden,
                note: 'Not shown in the directory',
                tone: 'pending',
              },
            ]}
          />

          <div className="admin-toolbar">
            <label className="search-compact">
              <SearchIcon size={16} aria-hidden="true" />
              <span className="sr-only">Filter doctors</span>
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Filter by name, email, city, or specialty"
              />
            </label>
            <span className="mono-label">
              {term
                ? `${filtered.length} of ${all.length} shown`
                : plural(all.length, 'doctor')}
            </span>
          </div>

          {all.length === 0 ? (
            <EmptyState
              icon={<Stethoscope />}
              title="No doctors in the admin list."
              description="The directory is empty. Try refreshing, or check that the demo data is loaded."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No doctors match that filter."
              description="Try a different name, email, city, or department."
              action={
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setTerm('')}
                >
                  Clear filter
                </button>
              }
            />
          ) : (
            <div className="table-card">
              <table className="data-table">
                <caption className="sr-only">
                  Doctors with visibility controls and editable records
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Doctor</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Practice</th>
                    <th scope="col">Visibility</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doctor) => (
                    <tr key={doctor.id}>
                      <td data-label="Doctor">
                        <div className="table-person">
                          <Monogram name={doctor.personName} size="sm" />
                          <div>
                            <strong>{doctor.personName}</strong>
                          </div>
                        </div>
                      </td>
                      <td data-label="Contact">
                        <div>
                          <span>{doctor.email || 'No email on file'}</span>
                          <span className="table-muted">{doctor.phoneNumber ?? '—'}</span>
                        </div>
                      </td>
                      <td data-label="Practice">
                        <div>
                          <span>{doctor.department ?? '—'}</span>
                          <span className="table-muted">{doctor.city ?? '—'}</span>
                        </div>
                      </td>
                      <td data-label="Visibility">
                        <VisibilityPill visible={doctor.isVisible} />
                      </td>
                      <td data-label="Actions" className="table-actions">
                        <div className="table-actions__group">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => {
                              setToggleError(null);
                              setEditDoctorId(doctor.id);
                            }}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit
                          </button>
                          <VisibilityToggle
                            doctor={doctor}
                            onNotice={(message) => {
                              setToggleError(null);
                              setNotice(message);
                            }}
                            onError={(message) => {
                              setNotice(null);
                              setToggleError(message);
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              Hidden doctors stay in this table but disappear from patient search
              and the public directory. Editing a record updates that row in place,
              and every visibility change can be reversed with the same switch.
              Nothing is deleted or archived here.
            </p>
          </div>
        </>
      ) : null}

      {editDoctorId ? (
        <AdminDoctorEditModal
          doctorId={editDoctorId}
          onClose={() => setEditDoctorId(null)}
          onSaved={applySavedDoctor}
        />
      ) : null}
    </div>
  );
}
