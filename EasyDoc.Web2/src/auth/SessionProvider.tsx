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
      <div className="centre-screen">
        <div className="fatal">
          <img src="/brand/easydoc-mark.png" alt="" width="56" height="56" />
          <p className="mini-label">EasyDoc connection</p>
          <h1>We can’t reach EasyDoc right now.</h1>
          <p className="fatal__lead">
            The clinic service did not answer. Check that the demo service is
            running, then try again.
          </p>
          <div style={{ marginTop: '0.9rem' }}>
            <ErrorPanel
              error={error}
              title="Connection check failed"
              onRetry={retry}
            />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
