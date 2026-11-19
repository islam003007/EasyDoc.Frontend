import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout as logoutRequest, queryKeys } from '../api/queries';
import { useSession } from './SessionProvider';

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { setSession } = useSession();

  return useMutation({
    mutationFn: async () => {
      try {
        await logoutRequest();
      } catch {
        // Even if the API is unreachable, drop the local demo session.
      }
    },
    onSettled: () => {
      // Clear the session first so the login page cannot briefly see the old
      // user, then drop every other cached query. (queryClient.clear() can race
      // the active session observer, so it is deliberately not used here.)
      setSession(null);
      void queryClient.cancelQueries();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== queryKeys.session[0],
      });
      navigate('/login', { replace: true });
    },
  });
}
