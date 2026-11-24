import {
  ArrowRight,
  MapPin,
  RotateCcw,
  Search as SearchIcon,
  X,
} from 'lucide-react';
import { Skeleton, Spinner } from '../../ui/Loading';
import type { DoctorSearchState } from './useDoctorSearch';

export function SearchControls({ search }: { search: DoctorSearchState }) {
  return (
    <>
      <form
        className="search-line"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          search.submitSearch();
        }}
      >
        <SearchIcon size={20} aria-hidden="true" />
        <label htmlFor="doctor-search" className="sr-only">
          Search doctors
        </label>
        <input
          id="doctor-search"
          type="search"
          value={search.term}
          onChange={(event) => search.setTerm(event.target.value)}
          placeholder="Try a name or specialty"
          autoComplete="off"
        />
        {search.term ? (
          <button
            type="button"
            className="search-line__clear"
            onClick={() => search.setTerm('')}
            aria-label="Clear search"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : null}
        <button type="submit" className="search-line__submit">
          {search.isRefreshing ? <Spinner label="Searching" /> : null}
          Search
          <ArrowRight size={15} aria-hidden="true" />
        </button>
      </form>

      <div className="folder-tabs" aria-label="Filter by specialty">
        <button
          type="button"
          className={`folder-tab ${!search.departmentId ? 'is-active' : ''}`.trim()}
          onClick={() => search.updateFilter('departmentId', '')}
        >
          All specialties
        </button>
        {(search.departments.data ?? []).map((department) => (
          <button
            key={department.id}
            type="button"
            className={`folder-tab ${search.departmentId === department.id ? 'is-active' : ''}`.trim()}
            onClick={() => search.updateFilter('departmentId', department.id)}
          >
            {department.name}
          </button>
        ))}
        {search.departments.isPending ? (
          <Skeleton width="5rem" height="1.7rem" />
        ) : null}
      </div>

      <div className="filter-row">
        <label className="filter-select">
          <span>City</span>
          <select
            value={search.cityId}
            onChange={(event) =>
              search.updateFilter('cityId', event.target.value)
            }
            disabled={search.cities.isPending}
          >
            <option value="">All cities</option>
            {(search.cities.data ?? []).map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <div className="toolbar__group">
          {search.hasFilters ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={search.clearAll}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          ) : null}
        </div>
      </div>

      {search.lookupsFailed ? (
        <div className="inline-warning" role="status">
          <span>
            <MapPin size={14} aria-hidden="true" /> City and specialty names did
            not load. Search still works.
          </span>
          <button
            type="button"
            className="text-link link-button"
            onClick={() => {
              void search.departments.refetch();
              void search.cities.refetch();
            }}
          >
            Retry
          </button>
        </div>
      ) : null}
    </>
  );
}
