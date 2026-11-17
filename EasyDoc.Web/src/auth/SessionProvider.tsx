import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '../api/contracts';
import { fetchSession, queryKeys } from '../api/queries';
import { ErrorPanel } from '../components/ErrorPanel';
import { AppLoading } from '../components/Loading';

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
      <div className="fatal-screen">
        <div className="fatal-screen__inner">
          <p className="mono-label">EasyDoc · connection</p>
          <h1>The clinic API is out of reach.</h1>
          <p className="fatal-screen__lead">
            The frontend is running, but it could not read the current session.
            Start the EasyDoc API on port 5215 and try again.
          </p>
          <ErrorPanel
            error={error}
            title="Session check failed"
            onRetry={retry}
          />
          <p className="fatal-screen__hint">
            <code>dotnet run --project EasyDoc.Api</code>
            <span>API target: /api → http://localhost:5215</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
