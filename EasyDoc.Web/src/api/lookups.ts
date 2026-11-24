import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './client';
import type { LookupItem } from './contracts';
import { normalizeLookups } from './normalize';
import { queryKeys } from './queryKeys';

export async function fetchDepartments(
  signal?: AbortSignal,
): Promise<LookupItem[]> {
  const payload = await apiRequest<unknown>('/lookups/departments', { signal });
  return normalizeLookups(payload);
}

export async function fetchCities(signal?: AbortSignal): Promise<LookupItem[]> {
  const payload = await apiRequest<unknown>('/lookups/cities', { signal });
  return normalizeLookups(payload);
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: ({ signal }) => fetchDepartments(signal),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: queryKeys.cities,
    queryFn: ({ signal }) => fetchCities(signal),
    staleTime: 10 * 60 * 1000,
  });
}
