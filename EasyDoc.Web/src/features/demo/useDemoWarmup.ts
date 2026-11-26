import { useQuery } from '@tanstack/react-query';
import { queryKeys, warmDemoDatabase } from '../../api/queries';

export function useDemoWarmup(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.demoWarmup,
    queryFn: ({ signal }) => warmDemoDatabase(signal).then(() => true),
    enabled,
    retry: 1,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
