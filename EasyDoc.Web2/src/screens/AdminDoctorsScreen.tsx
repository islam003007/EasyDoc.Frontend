import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  RefreshCw,
  Search as SearchIcon,
  Stethoscope,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { AdminDoctor } from '../api/contracts';
import {
  fetchAdminDoctors,
  queryKeys,
  updateDoctorVisibility,
} from '../api/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { AdminTabs } from '../ui/AdminTabs';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { StatStrip } from '../ui/StatStrip';
import { AdminDoctorDialog } from './AdminDoctorDialog';

export function AdminDoctorsScreen() {
  useDocumentTitle('Doctor directory');
  const queryClient = useQueryClient();
  const [term, setTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);

  const doctors = useQuery({
    queryKey: queryKeys.adminDoctors,
    queryFn: ({ signal }) => fetchAdminDoctors(signal),
  });

  const toggle = useMutation({
    mutationFn: (input: { doctor: AdminDoctor; next: boolean }) =>
      updateDoctorVisibility(input.doctor.id, input.next),
    onSuccess: (_data, input) => {
      setNotice(
        `${input.doctor.personName} is now ${
          input.next ? 'listed in' : 'hidden from'
        } the patient directory.`,
      );
      queryClient.setQueryData(
        queryKeys.adminDoctors,
        (current: AdminDoctor[] | undefined) =>
          current?.map((doctor) =>
            doctor.id === input.doctor.id
              ? { ...doctor, isVisible: input.next }
              : doctor,
          ),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminDoctor(input.doctor.id),
      });
    },
  });

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
        doctor.city,
        doctor.department,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [all, term]);

  return (
    <div className="page">
      <PageHeader
        kicker="Network admin"
        title="The doctor directory."
        lead="Every doctor profile, including the ones patients can’t see. Open a record to edit its public details, or switch visibility directly in the table."
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

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
      ) : null}

      {toggle.isError ? (
        <Notice tone="error" onDismiss={() => toggle.reset()}>
          {toggle.error instanceof Error
            ? toggle.error.message
            : 'We couldn’t change visibility.'}
        </Notice>
      ) : null}

      {doctors.isError ? (
        <ErrorPanel
          error={doctors.error}
          title="We couldn’t load the doctor directory"
          onRetry={() => {
            void doctors.refetch();
          }}
        />
      ) : null}

      {doctors.isPending ? (
        <div className="table-loading" aria-busy="true" aria-label="Loading doctors">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="table-loading__row">
              <Skeleton width="30px" height="30px" />
              <Skeleton width="30%" height="0.8rem" />
              <Skeleton width="20%" height="0.7rem" />
              <Skeleton width="15%" height="1.5rem" />
            </div>
          ))}
        </div>
      ) : null}

      {doctors.isSuccess ? (
        <>
          <StatStrip
            items={[
              {
                label: 'Doctors',
                value: all.length,
                note: 'Includes hidden profiles',
              },
              {
                label: 'Listed',
                value: listed,
                note: 'Visible to patient search',
              },
              {
                label: 'Hidden',
                value: hidden,
                note: 'Not shown in the directory',
              },
            ]}
          />

          <div className="toolbar">
            <label className="search-compact">
              <SearchIcon size={15} aria-hidden="true" />
              <span className="sr-only">Filter doctors</span>
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Filter by name, email, city, or specialty"
              />
            </label>
            <span className="mini-label tnum">
              {term ? `${filtered.length} of ${all.length} shown` : ''}
            </span>
          </div>

          {all.length === 0 ? (
            <Empty
              icon={<Stethoscope size={19} />}
              title="No doctors in the directory."
              description="The directory is empty. Refresh to check for new records."
            />
          ) : filtered.length === 0 ? (
            <Empty
              icon={<SearchIcon size={19} />}
              title="No doctors match that filter."
              description="Try a different name, email, city, or specialty."
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
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">
                  Doctors with visibility controls and editable records
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Doctor</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Specialty</th>
                    <th scope="col">Visibility</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doctor) => {
                    const pending =
                      toggle.isPending &&
                      toggle.variables?.doctor.id === doctor.id;
                    return (
                      <tr key={doctor.id}>
                        <td data-label="Doctor">
                          <div className="cell-person">
                            <Monogram name={doctor.personName} size="sm" />
                            <div>
                              <strong><bdi dir="auto">{doctor.personName}</bdi></strong>
                              <span>{doctor.department ?? 'Care team'}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Contact">
                          <div className="cell-stack">
                            <span>{doctor.email || 'No email on file'}</span>
                            <span className="muted">{doctor.phoneNumber ?? '—'}</span>
                          </div>
                        </td>
                        <td data-label="Specialty">
                          <div className="cell-stack">
                            <span>{doctor.department ?? '—'}</span>
                            <span className="muted">{doctor.city ?? '—'}</span>
                          </div>
                        </td>
                        <td data-label="Visibility">
                          <button
                            type="button"
                            className="switch"
                            role="switch"
                            aria-checked={doctor.isVisible}
                            aria-label={`Directory visibility for ${doctor.personName}`}
                            onClick={() =>
                              toggle.mutate({ doctor, next: !doctor.isVisible })
                            }
                            disabled={pending}
                          >
                            <span className="switch__track" aria-hidden="true" />
                            {pending
                              ? 'Saving…'
                              : doctor.isVisible
                                ? 'Listed'
                                : 'Hidden'}
                          </button>
                        </td>
                        <td data-label="Actions" className="cell-actions">
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => setEditDoctorId(doctor.id)}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}

      {editDoctorId ? (
        <AdminDoctorDialog
          doctorId={editDoctorId}
          onClose={() => setEditDoctorId(null)}
          onSaved={(updated) => {
            setEditDoctorId(null);
            setNotice('Doctor profile updated.');
            queryClient.setQueryData(
              queryKeys.adminDoctors,
              (current: AdminDoctor[] | undefined) =>
                current?.map((doctor) =>
                  doctor.id === updated.id ? updated : doctor,
                ),
            );
            void queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
          }}
        />
      ) : null}
    </div>
  );
}
