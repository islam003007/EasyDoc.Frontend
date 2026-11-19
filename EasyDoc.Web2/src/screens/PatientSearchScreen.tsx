import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Languages,
  MapPin,
  RotateCcw,
  Search as SearchIcon,
  Stethoscope,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { DoctorSummary } from '../api/contracts';
import {
  fetchDoctorDirectory,
  fetchDoctorSearch,
  queryKeys,
  useCities,
  useDepartments,
} from '../api/queries';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { PageHeader } from '../ui/PageHeader';

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

export function PatientSearchScreen() {
  useDocumentTitle('Find care');
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const cityId = searchParams.get('cityId') ?? '';
  const departmentId = searchParams.get('departmentId') ?? '';

  const [term, setTerm] = useState(urlQuery);
  const debouncedTerm = useDebouncedValue(term, 320);
  const activeQuery = debouncedTerm.trim();

  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    if (activeQuery === currentQ) return;
    const next = new URLSearchParams(searchParams);
    if (activeQuery) next.set('q', activeQuery);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }, [activeQuery]);

  const departments = useDepartments();
  const cities = useCities();

  const doctors = useQuery({
    queryKey: activeQuery
      ? queryKeys.doctorSearch(activeQuery, cityId, departmentId)
      : queryKeys.doctorDirectory(cityId, departmentId),
    queryFn: ({ signal }) =>
      activeQuery
        ? fetchDoctorSearch(activeQuery, { cityId, departmentId }, signal)
        : fetchDoctorDirectory({ cityId, departmentId }, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const departmentNames = useMemo(
    () => new Map((departments.data ?? []).map((item) => [item.id, item.name])),
    [departments.data],
  );
  const cityNames = useMemo(
    () => new Map((cities.data ?? []).map((item) => [item.id, item.name])),
    [cities.data],
  );

  const results: DoctorSummary[] = useMemo(
    () =>
      (doctors.data ?? []).map((doctor) => ({
        ...doctor,
        department:
          doctor.department ??
          (doctor.departmentId
            ? departmentNames.get(doctor.departmentId)
            : undefined),
        city:
          doctor.city ?? (doctor.cityId ? cityNames.get(doctor.cityId) : undefined),
      })),
    [doctors.data, departmentNames, cityNames],
  );

  const hasFilters = Boolean(activeQuery || cityId || departmentId);

  function applyQueryToUrl(next: URLSearchParams) {
    if (term.trim()) next.set('q', term.trim());
    else next.delete('q');
  }

  function updateFilter(key: 'cityId' | 'departmentId', value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    applyQueryToUrl(next);
    setSearchParams(next, { replace: true });
  }

  function submitSearch() {
    const next = new URLSearchParams(searchParams);
    applyQueryToUrl(next);
    setSearchParams(next, { replace: true });
    if (doctors.isError) void doctors.refetch();
  }

  function clearAll() {
    setTerm('');
    setSearchParams(new URLSearchParams(), { replace: true });
  }

  const lookupsFailed = departments.isError || cities.isError;
  const isRefreshing = doctors.isFetching && !doctors.isPending;

  return (
    <div className="page">
      <PageHeader
        kicker="Care directory"
        title="Find the right care."
        lead="Search the seeded Egypt network by name, specialty, or city — then open a practice to see its real open times."
      />

      <form
        className="search-line"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <SearchIcon size={20} aria-hidden="true" />
        <label htmlFor="doctor-search" className="sr-only">
          Search doctors
        </label>
        <input
          id="doctor-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Try a name or specialty"
          autoComplete="off"
        />
        {term ? (
          <button
            type="button"
            className="search-line__clear"
            onClick={() => setTerm('')}
            aria-label="Clear search"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
        <button type="submit" className="search-line__submit">
          {isRefreshing ? <Spinner label="Searching" /> : null}
          Search
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </form>

      <div className="folder-tabs" aria-label="Filter by specialty">
        <button
          type="button"
          className={`folder-tab ${!departmentId ? 'is-active' : ''}`.trim()}
          onClick={() => updateFilter('departmentId', '')}
        >
          All specialties
        </button>
        {(departments.data ?? []).map((department) => (
          <button
            key={department.id}
            type="button"
            className={`folder-tab ${departmentId === department.id ? 'is-active' : ''}`.trim()}
            onClick={() => updateFilter('departmentId', department.id)}
          >
            {department.name}
          </button>
        ))}
        {departments.isPending ? <Skeleton width="5rem" height="1.7rem" /> : null}
      </div>

      <div className="filter-row">
        <label className="filter-select">
          <span>City</span>
          <select
            value={cityId}
            onChange={(event) => updateFilter('cityId', event.target.value)}
            disabled={cities.isPending}
          >
            <option value="">All cities</option>
            {(cities.data ?? []).map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar__group">
          {hasFilters ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={clearAll}>
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {lookupsFailed ? (
        <div className="inline-warning" role="status">
          <span>
            <MapPin size={14} aria-hidden="true" /> City and specialty names did
            not load. Search still works.
          </span>
          <button
            type="button"
            className="text-link link-button"
            onClick={() => {
              void departments.refetch();
              void cities.refetch();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      <section aria-labelledby="results-heading">
        <div className="results-head">
          <div>
            <h2 id="results-heading">
              {activeQuery ? (
                <>
                  Results for <span className="results-head__term">“{activeQuery}”</span>
                </>
              ) : departmentId ? (
                departmentNames.get(departmentId) ?? 'Specialty'
              ) : (
                'All practices'
              )}
            </h2>
            <p className="mini-label">
              {doctors.isPending
                ? 'Looking through the clinic…'
                : doctors.isError
                  ? 'The directory did not answer'
                  : `${results.length} visible ${results.length === 1 ? 'profile' : 'profiles'}`}
            </p>
          </div>
          <p className="results-head__note">
            <Languages size={14} aria-hidden="true" />
            Name search understands Arabic and English spellings.
          </p>
        </div>

        {doctors.isError ? (
          <ErrorPanel
            error={doctors.error}
            title="The directory did not answer"
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
            icon={hasFilters ? <SearchIcon size={19} /> : <Stethoscope size={19} />}
            title={hasFilters ? 'No practices match that search.' : 'The directory is quiet.'}
            description={
              hasFilters
                ? 'Try a shorter name, another specialty, or a different city. The demo network is small.'
                : 'No visible doctors were returned. An administrator may have hidden the directory.'
            }
            action={
              hasFilters ? (
                <button type="button" className="btn btn--secondary" onClick={clearAll}>
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
                    <h3><bdi dir="auto">{doctor.personName}</bdi></h3>
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
    </div>
  );
}
