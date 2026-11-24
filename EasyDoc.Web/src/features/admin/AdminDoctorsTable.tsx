import {
  Pencil,
  Search as SearchIcon,
  Stethoscope,
} from 'lucide-react';
import { Empty } from '../../ui/Empty';
import { Skeleton } from '../../ui/Loading';
import { Monogram } from '../../ui/Monogram';
import { StatStrip } from '../../ui/StatStrip';
import type { AdminDoctorsState } from './useAdminDoctors';

export function AdminDoctorsTable({
  state,
  onEdit,
}: {
  state: AdminDoctorsState;
  onEdit: (doctorId: string) => void;
}) {
  const { doctors, toggle, all, listed, hidden, filtered, term, setTerm } = state;

  if (doctors.isPending) {
    return (
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
    );
  }

  if (!doctors.isSuccess) return null;

  return (
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
                          <strong>
                            <bdi dir="auto">{doctor.personName}</bdi>
                          </strong>
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
                        onClick={() => onEdit(doctor.id)}
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
  );
}
