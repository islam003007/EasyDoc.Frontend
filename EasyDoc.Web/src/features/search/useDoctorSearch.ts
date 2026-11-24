import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DoctorSummary } from '../../api/contracts';
import {
  fetchDoctorDirectory,
  fetchDoctorSearch,
  queryKeys,
  useCities,
  useDepartments,
} from '../../api/queries';
import { useDebouncedValue } from '../../lib/useDebouncedValue';

export function useDoctorSearch() {
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

  return {
    term,
    setTerm,
    activeQuery,
    cityId,
    departmentId,
    departments,
    cities,
    doctors,
    results,
    departmentNames,
    hasFilters,
    isRefreshing,
    lookupsFailed,
    updateFilter,
    submitSearch,
    clearAll,
  };
}

export type DoctorSearchState = ReturnType<typeof useDoctorSearch>;
