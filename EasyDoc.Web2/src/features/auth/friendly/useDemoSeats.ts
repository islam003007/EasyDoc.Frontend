import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { DemoUser } from '../../../api/contracts';
import { demoLogin, fetchDemoUsers, queryKeys } from '../../../api/queries';
import { useSession } from '../../../auth/SessionProvider';
import { roleHome } from '../../../lib/format';

export function useDemoSeats() {
  const { refreshSession } = useSession();
  const navigate = useNavigate();

  const users = useQuery({
    queryKey: queryKeys.demoUsers,
    queryFn: ({ signal }) => fetchDemoUsers(signal),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const login = useMutation({
    mutationFn: async (user: DemoUser) => {
      await demoLogin(user.key);
      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'We could not finish opening this demo seat. Refresh the page and try again.',
        );
      }
      return next;
    },
    onSuccess: (next) => {
      navigate(roleHome(next.role), { replace: true });
    },
  });

  return { users, login };
}
