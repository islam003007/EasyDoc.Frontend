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
import { useSearchParams } from 'react-router-dom';
import type { DoctorSummary } from '../api/contracts';
import {
  fetchDoctorDirectory,
  fetchDoctorSearch,
  queryKeys,
  useCities,
  useDepartments,
} from '../api/queries';
import { DoctorCard } from '../components/DoctorCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Spinner, Skeleton } from '../components/Loading';
import { useSession } from '../auth/SessionProvider';
import { firstName } from '../lib/format';
import { useDebouncedValue } from '../lib/useDebouncedValue';
import { useDocumentTitle } from '../lib/useDocumentTitle';

function DoctorCardSkeleton() {
  return (
    <div className="doctor-card doctor-card--skeleton" aria-hidden="true">
      <Skeleton width="3.4rem" height="3.4rem" className="skeleton--round" />
      <div className="doctor-card__body">
        <Skeleton width="38%" height="0.7rem" />
        <Skeleton width="68%" height="1.25rem" />
        <Skeleton width="48%" height="0.8rem" />
      </div>
    </div>
  );
}

export function PatientSearchPage() {
  useDocumentTitle('Find care');
  const { session } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get('q') ?? '';
  const cityId = searchParams.get('cityId') ?? '';
  const departmentId = searchParams.get('departmentId') ?? '';

  const [term, setTerm] = useState(urlQuery);
  const debouncedTerm = useDebouncedValue(term, 320);
  const activeQuery = debouncedTerm.trim();

  // Keep the deep-linkable query in sync once typing settles. Filter changes
  // write the current term themselves, so this effect only listens to the
  // debounced term.
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
          doctor.city ??
          (doctor.cityId ? cityNames.get(doctor.cityId) : undefined),
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
    <div className="page page--search">
      <section className="search-hero">
        <div className="search-hero__copy">
          <p className="eyebrow">
            <span className="eyebrow__index">01</span>
            Find care · {firstName(session?.displayName ?? 'there')}
          </p>
          <h1>
            Find a doctor.
            <br />
            <em>Keep your week.</em>
          </h1>
          <p className="search-hero__lead">
            Search the seeded Egypt network by name, specialty, or city — then open a
            profile to see the real open times.
          </p>
        </div>
        <div className="search-hero__stamp" aria-hidden="true">
          <span>Egypt</span>
          <strong>ED</strong>
          <span>Care network</span>
        </div>
      </section>

      <form
        className="search-bar"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
      >
        <SearchIcon size={21} className="search-bar__icon" aria-hidden="true" />
        <label htmlFor="doctor-search" className="sr-only">
          Search doctors
        </label>
        <input
          id="doctor-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Try a name, specialty, or Arabic spelling"
          autoComplete="off"
        />
        {term ? (
          <button
            type="button"
            className="search-bar__clear"
            onClick={() => setTerm('')}
            aria-label="Clear search"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
        <button type="submit" className="search-bar__submit">
          {isRefreshing ? <Spinner /> : null}
          Search
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </form>

      <div className="search-tools">
        <div className="filter-chips" aria-label="Filter by department">
          <button
            type="button"
            className={`filter-chip ${!departmentId ? 'is-active' : ''}`.trim()}
            onClick={() => updateFilter('departmentId', '')}
          >
            All departments
          </button>
          {(departments.data ?? []).map((department) => (
            <button
              key={department.id}
              type="button"
              className={`filter-chip ${departmentId === department.id ? 'is-active' : ''}`.trim()}
              onClick={() => updateFilter('departmentId', department.id)}
            >
              {department.name}
            </button>
          ))}
          {departments.isPending ? <Skeleton width="6rem" height="2rem" /> : null}
        </div>

        <div className="filter-selects">
          <label className="select-field">
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
            <MapPin size={15} aria-hidden="true" />
            City and department names could not be loaded. Search still works.
          </span>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              void departments.refetch();
              void cities.refetch();
            }}
          >
            Retry lookups
          </button>
        </div>
      ) : null}

      <section className="results" aria-labelledby="results-heading">
        <div className="results-head">
          <div>
            <p className="mono-label">
              {activeQuery ? 'Search index' : 'Care directory'}
              {activeQuery ? <span className="results-head__term"> “{activeQuery}”</span> : null}
            </p>
            <h2 id="results-heading">
              {doctors.isPending
                ? 'Looking through the clinic…'
                : `${results.length} ${results.length === 1 ? 'doctor' : 'doctors'}`}
            </h2>
          </div>
          <p className="results-head__note">
            <Languages size={15} aria-hidden="true" />
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
          <div className="doctor-grid" aria-busy="true" aria-label="Loading doctors">
            {Array.from({ length: 6 }, (_, index) => (
              <DoctorCardSkeleton key={index} />
            ))}
          </div>
        ) : null}

        {doctors.isSuccess && results.length === 0 ? (
          <EmptyState
            icon={hasFilters ? <SearchIcon /> : <Stethoscope />}
            title={hasFilters ? 'No doctors match that search.' : 'The directory is quiet.'}
            description={
              hasFilters
                ? 'Try a shorter name, another department, or a different city. The demo network is small.'
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
          <div className="doctor-grid">
            {results.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
