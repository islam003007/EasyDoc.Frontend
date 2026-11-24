import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '../api/contracts';
import { fetchSession, queryKeys } from '../api/queries';
import { ErrorPanel } from '../ui/ErrorPanel';
import { AppLoading } from '../ui/Loading';
import { RecoveryScreen } from '../ui/RecoveryScreen';

interface SessionContextValue {
  session: Session | null;
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  setSession: (session: Session | null) => void;
  refreshSession: () => Promise<Session | null>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => fetchSession(signal),
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const setSession = useCallback(
    (session: Session | null) => {
      queryClient.setQueryData(queryKeys.session, session);
    },
    [queryClient],
  );

  const refreshSession = useCallback(async () => {
    const session = await fetchSession();
    queryClient.setQueryData(queryKeys.session, session);
    return session;
  }, [queryClient]);

  return (
    <SessionContext.Provider
      value={{
        session: query.data ?? null,
        isLoading: query.isPending,
        error: query.error,
        retry: () => {
          void query.refetch();
        },
        setSession,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return context;
}

export function SessionGate({ children }: { children: ReactNode }) {
  const { isLoading, error, retry } = useSession();

  if (isLoading) return <AppLoading />;

  if (error) {
    return (
      <RecoveryScreen
        eyebrow="EasyDoc · connection"
        title="We can’t reach EasyDoc right now."
        lead="The clinic service didn’t answer. Check that the demo API is running and that this browser can reach it, then try again. Your sign-in is safe; nothing was submitted."
      >
        <ErrorPanel
          error={error}
          title="Connection check failed"
          onRetry={retry}
        />
      </RecoveryScreen>
    );
  }

  return <>{children}</>;
}
