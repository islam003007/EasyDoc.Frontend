import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../api/contracts';
import { ForbiddenScreen } from '../screens/ForbiddenScreen';
import { useSession } from './SessionProvider';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const { session } = useSession();

  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <ForbiddenScreen />;

  return <>{children}</>;
}
