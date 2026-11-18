import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  RefreshCw,
  Search as SearchIcon,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { fetchAdminPatients, queryKeys } from '../api/queries';
import { AdminPatientDetailModal } from '../components/AdminPatientDetailModal';
import { AdminTabs } from '../components/AdminTabs';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Skeleton } from '../components/Loading';
import { Monogram } from '../components/Monogram';
import { PageHeader } from '../components/PageHeader';
import { StatGrid } from '../components/StatGrid';
import { plural } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function AdminPatientsPage() {
  useDocumentTitle('Patient directory');
  const [term, setTerm] = useState('');
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);

  const patients = useQuery({
    queryKey: queryKeys.adminPatients,
    queryFn: ({ signal }) => fetchAdminPatients(signal),
  });

  const all = patients.data ?? [];
  const active = all.filter((patient) => !patient.isDeleted).length;
  const archived = all.length - active;

  const filtered = useMemo(() => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return all;
    return all.filter((patient) =>
      [patient.personName, patient.email, patient.phoneNumber]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [all, term]);

  return (
    <div className="page page--admin">
      <PageHeader
        eyebrow="Network admin · Patients"
        index="02"
        title={
          <>
            The people
            <br />
            <em>it serves.</em>
          </>
        }
        lead="A read-only view of the seeded patient directory — names, contact details, and account status. No medical records are exposed here."
        actions={
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              void patients.refetch();
            }}
            disabled={patients.isFetching}
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={patients.isFetching ? 'spin' : undefined}
            />
            Refresh
          </button>
        }
      />

      <AdminTabs patientCount={patients.data?.length} />

      {patients.isError ? (
        <ErrorPanel
          error={patients.error}
          title="The admin patient list could not be loaded"
          onRetry={() => {
            void patients.refetch();
          }}
        />
      ) : null}

      {patients.isPending ? (
        <>
          <div className="stat-grid stat-grid--loading" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="stat-card">
                <Skeleton width="45%" height="0.7rem" />
                <Skeleton width="30%" height="2.2rem" />
              </div>
            ))}
          </div>
          <div className="table-card" aria-busy="true" aria-label="Loading patients">
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

      {patients.isSuccess ? (
        <>
          <StatGrid
            stats={[
              {
                label: 'Patients',
                value: all.length,
                note: 'Seeded sample accounts',
              },
              {
                label: 'Active',
                value: active,
                note: 'Available in the directory',
                tone: 'scheduled',
              },
              {
                label: 'Archived',
                value: archived,
                note: 'Removed from active use',
                tone: 'pending',
              },
            ]}
          />

          <div className="admin-toolbar">
            <label className="search-compact">
              <SearchIcon size={16} aria-hidden="true" />
              <span className="sr-only">Filter patients</span>
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Filter by name, email, or phone"
              />
            </label>
            <span className="mono-label">
              {term
                ? `${filtered.length} of ${all.length} shown`
                : plural(all.length, 'patient')}
            </span>
          </div>

          {all.length === 0 ? (
            <EmptyState
              icon={<UserRound />}
              title="No patients in the directory."
              description="The patient directory is empty. Try refreshing, or check that the demo data is loaded."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No patients match that filter."
              description="Try a different name, email address, or phone number."
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
                <caption className="sr-only">Seeded patient directory</caption>
                <thead>
                  <tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((patient) => (
                    <tr key={patient.id}>
                      <td data-label="Patient">
                        <div className="table-person">
                          <Monogram name={patient.personName} size="sm" />
                          <div>
                            <strong>{patient.personName}</strong>
                          </div>
                        </div>
                      </td>
                      <td data-label="Contact">
                        <span>{patient.email || 'No email on file'}</span>
                      </td>
                      <td data-label="Phone">
                        <span className="code-value">{patient.phoneNumber ?? '—'}</span>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`status-pill ${patient.isDeleted ? 'status-pill--canceled' : 'status-pill--scheduled'}`}
                        >
                          <span className="status-pill__dot" aria-hidden="true" />
                          {patient.isDeleted ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td data-label="Actions" className="table-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setDetailPatientId(patient.id)}
                        >
                          <Eye size={14} aria-hidden="true" />
                          View
                        </button>
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
              This sandbox reads the patient directory only. Open a row for its
              full account record; patient self-registration can create new
              accounts, but medical history and destructive admin actions stay
              outside the demo.
            </p>
          </div>
        </>
      ) : null}

      {detailPatientId ? (
        <AdminPatientDetailModal
          patientId={detailPatientId}
          onClose={() => setDetailPatientId(null)}
        />
      ) : null}
    </div>
  );
}
