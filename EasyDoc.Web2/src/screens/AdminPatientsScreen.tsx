import { useQuery } from '@tanstack/react-query';
import { Eye, RefreshCw, Search as SearchIcon, UserRound } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fetchAdminPatients, queryKeys } from '../api/queries';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { AdminTabs } from '../ui/AdminTabs';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { PageHeader } from '../ui/PageHeader';
import { Stamp } from '../ui/Stamp';
import { StatStrip } from '../ui/StatStrip';
import { AdminPatientDialog } from './AdminPatientDialog';

export function AdminPatientsScreen() {
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
    <div className="page">
      <PageHeader
        kicker="Network admin"
        title="Patient directory."
        lead="A read-only view of patient accounts: names, contact details, and account status. Medical records are not included."
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
          title="We couldn’t load the patient directory"
          onRetry={() => {
            void patients.refetch();
          }}
        />
      ) : null}

      {patients.isPending ? (
        <div className="table-loading" aria-busy="true" aria-label="Loading patients">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className="table-loading__row">
              <Skeleton width="30px" height="30px" />
              <Skeleton width="28%" height="0.8rem" />
              <Skeleton width="24%" height="0.7rem" />
              <Skeleton width="14%" height="1.5rem" />
            </div>
          ))}
        </div>
      ) : null}

      {patients.isSuccess ? (
        <>
          <StatStrip
            items={[
              {
                label: 'Patient accounts',
                value: all.length,
                note: 'Including archived accounts',
              },
              {
                label: 'Active',
                value: active,
                note: 'Accounts in use',
              },
              {
                label: 'Archived',
                value: archived,
                note: 'Kept on file, not active',
              },
            ]}
          />

          <div className="toolbar">
            <label className="search-compact">
              <SearchIcon size={15} aria-hidden="true" />
              <span className="sr-only">Filter patients</span>
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Filter by name, email, or phone"
              />
            </label>
            <span className="mini-label tnum">
              {term ? `${filtered.length} of ${all.length} shown` : ''}
            </span>
          </div>

          {all.length === 0 ? (
            <Empty
              icon={<UserRound size={19} />}
              title="No patients in the directory."
              description="No patient accounts are listed. Refresh to check for new records."
            />
          ) : filtered.length === 0 ? (
            <Empty
              icon={<SearchIcon size={19} />}
              title="No patients match that filter."
              description="Try a different name, email, or phone number."
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
                  Read-only patient directory with account status
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Email</th>
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
                        <div className="cell-person">
                          <Monogram name={patient.personName} size="sm" />
                          <div>
                            <strong><bdi dir="auto">{patient.personName}</bdi></strong>
                            <span>Patient account</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Email">
                        <span className="cell-text">
                          {patient.email || 'No email on file'}
                        </span>
                      </td>
                      <td data-label="Phone">
                        <span className="cell-text tnum" dir="ltr">
                          {patient.phoneNumber ?? '—'}
                        </span>
                      </td>
                      <td data-label="Status">
                        <Stamp tone={patient.isDeleted ? 'void' : 'done'}>
                          {patient.isDeleted ? 'Archived' : 'Active'}
                        </Stamp>
                      </td>
                      <td data-label="Actions" className="cell-actions">
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
        </>
      ) : null}

      {detailPatientId ? (
        <AdminPatientDialog
          patientId={detailPatientId}
          onClose={() => setDetailPatientId(null)}
        />
      ) : null}
    </div>
  );
}
