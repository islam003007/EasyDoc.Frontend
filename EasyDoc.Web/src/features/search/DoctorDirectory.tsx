import {
  ArrowRight,
  Languages,
  Search as SearchIcon,
  Stethoscope,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Empty } from '../../ui/Empty';
import { ErrorPanel } from '../../ui/ErrorPanel';
import { Skeleton } from '../../ui/Loading';
import { Monogram } from '../../ui/Monogram';
import type { DoctorSearchState } from './useDoctorSearch';

function DoctorRowSkeleton() {
  return (
    <div className="practice-row" aria-hidden="true">
      <Skeleton width="40px" height="40px" />
      <div className="stack--tight">
        <Skeleton width="42%" height="0.75rem" />
        <Skeleton width="28%" height="0.65rem" />
      </div>
      <Skeleton width="70%" height="0.75rem" />
      <Skeleton width="5rem" height="0.75rem" />
    </div>
  );
}

export function DoctorDirectory({ search }: { search: DoctorSearchState }) {
  const { doctors, results } = search;

  return (
    <section aria-labelledby="results-heading">
      <div className="results-head">
        <div>
          <h2 id="results-heading">
            {search.activeQuery ? (
              <>
                Results for{' '}
                <span className="results-head__term">“{search.activeQuery}”</span>
              </>
            ) : search.departmentId ? (
              search.departmentNames.get(search.departmentId) ?? 'Specialty'
            ) : (
              'All doctors'
            )}
          </h2>
          <p className="mini-label">
            {doctors.isPending
              ? 'Looking through the clinic…'
              : doctors.isError
                ? 'We couldn’t load the directory'
                : `${results.length} ${results.length === 1 ? 'doctor' : 'doctors'}`}
          </p>
        </div>
        <p className="results-head__note">
          <Languages size={14} aria-hidden="true" />
          Search works with Arabic and English spellings.
        </p>
      </div>

      {doctors.isError ? (
        <ErrorPanel
          error={doctors.error}
          title="We couldn’t load the directory"
          onRetry={() => {
            void doctors.refetch();
          }}
        />
      ) : null}

      {doctors.isPending ? (
        <div className="practice-list" aria-busy="true" aria-label="Loading doctors">
          {Array.from({ length: 6 }, (_, index) => (
            <DoctorRowSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {doctors.isSuccess && results.length === 0 ? (
        <Empty
          icon={
            search.hasFilters ? <SearchIcon size={19} /> : <Stethoscope size={19} />
          }
          title={
            search.hasFilters
              ? 'No doctors match your search.'
              : 'No doctors are listed yet.'
          }
          description={
            search.hasFilters
              ? 'Try a shorter name, another specialty, or a different city.'
              : 'No doctors are visible right now. An administrator can check the directory.'
          }
          action={
            search.hasFilters ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={search.clearAll}
              >
                Clear search and filters
              </button>
            ) : null
          }
        />
      ) : null}

      {doctors.isSuccess && results.length > 0 ? (
        <div className="practice-list">
          {results.map((doctor) => (
            <Link
              key={doctor.id}
              to={`/patient/doctors/${doctor.id}`}
              className="practice-row"
            >
              <Monogram name={doctor.personName} size="md" />
              <div className="practice-row__identity">
                <div className="practice-row__name">
                  <h3>
                    <bdi dir="auto">{doctor.personName}</bdi>
                  </h3>
                </div>
                <p className="practice-row__specialty">
                  {doctor.department ?? 'Care team'}, {doctor.city ?? 'Egypt'}
                </p>
              </div>
              <span className="practice-row__go">
                <span className="practice-row__go-label">View times</span>
                <span className="practice-row__go-short">Times</span>
                <ArrowRight size={14} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
