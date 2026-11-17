import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { DemoUser, Role } from '../api/contracts';
import {
  demoLogin,
  fetchDemoUsers,
  queryKeys,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { Brand } from '../components/Brand';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Spinner, Skeleton } from '../components/Loading';
import { Monogram } from '../components/Monogram';
import { roleBlurb, roleHome, roleLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const ROLE_ORDER: Role[] = ['patient', 'doctor', 'admin', 'unknown'];

const ROLE_TITLE: Record<Role, string> = {
  patient: 'I’m here for care',
  doctor: 'I’m here to practise',
  admin: 'I run the network',
  unknown: 'Another demo seat',
};

const ROLE_ICON: Record<Role, LucideIcon> = {
  patient: UserRound,
  doctor: Stethoscope,
  admin: ShieldCheck,
  unknown: KeyRound,
};

const ROLE_INDEX: Record<Role, string> = {
  patient: '01',
  doctor: '02',
  admin: '03',
  unknown: '04',
};

function DemoUserButton({
  user,
  pending,
  disabled,
  onSelect,
}: {
  user: DemoUser;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="demo-user"
      onClick={onSelect}
      disabled={disabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="demo-user__spinner">
          <Spinner label="Opening demo session" />
        </span>
      ) : (
        <Monogram name={user.label} size="sm" />
      )}
      <span className="demo-user__copy">
        <strong>{user.label}</strong>
        <span>{user.email || 'Seeded demo account'}</span>
      </span>
      <span className="demo-user__action">
        {pending ? 'Opening…' : 'Enter'}
        {!pending ? <ArrowRight size={15} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

export function LoginPage() {
  useDocumentTitle('Demo access');
  const { session, refreshSession } = useSession();
  const navigate = useNavigate();

  const demoUsers = useQuery({
    queryKey: queryKeys.demoUsers,
    queryFn: ({ signal }) => fetchDemoUsers(signal),
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: !session,
  });

  const login = useMutation({
    mutationFn: async (user: DemoUser) => {
      await demoLogin(user.key);
      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'The demo sign-in completed, but the session cookie was not visible. Check that cookies are enabled for this site.',
        );
      }
      return next;
    },
    onSuccess: (next) => {
      navigate(roleHome(next.role), { replace: true });
    },
  });

  if (session) {
    return <Navigate to={roleHome(session.role)} replace />;
  }

  const grouped = ROLE_ORDER.map((role) => ({
    role,
    users: (demoUsers.data ?? []).filter((user) => user.role === role),
  })).filter((group) => group.users.length > 0);

  return (
    <div className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand-panel__top">
          <Brand to="/login" light />
          <span className="login-brand-panel__edition">Demo edition · 2026</span>
        </div>

        <div className="login-brand-panel__copy">
          <p className="eyebrow eyebrow--light">EasyDoc · scheduling study</p>
          <h1>
            Care,
            <br />
            <em>scheduled well.</em>
          </h1>
          <p>
            A working clinic directory built around real availability. Search the
            network, hold a time, or run the practice — from one of three seeded
            seats.
          </p>
        </div>

        <ol className="login-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Find the right hands</strong>
              <p>Search by name, city, or department in Arabic or English.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>See the real week</strong>
              <p>Availability comes from the API’s schedules, overrides, and bookings.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Move the day forward</strong>
              <p>Patients book. Doctors decide. Administrators keep the directory honest.</p>
            </div>
          </li>
        </ol>

        <div className="login-brand-panel__foot">
          <span>Egypt care network</span>
          <span className="mono-label">No passwords · seeded data only</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <p className="eyebrow">
            <span className="eyebrow__index">→</span>
            Demo access
          </p>
          <h2>Choose a demo role.</h2>
          <p className="login-panel__lead">
            One click opens a seeded session. The API confirms the identity; this
            client never asks for a password.
          </p>

          {login.isError ? (
            <ErrorPanel
              error={login.error}
              title="Could not start the demo session"
              compact
            />
          ) : null}

          {demoUsers.isPending ? (
            <div className="role-grid" aria-busy="true" aria-label="Loading demo roles">
              {[0, 1, 2].map((index) => (
                <div key={index} className="role-card role-card--loading">
                  <Skeleton width="40%" height="0.8rem" />
                  <Skeleton width="72%" height="1.6rem" />
                  <Skeleton width="100%" height="0.9rem" />
                  <Skeleton width="100%" height="3.6rem" />
                </div>
              ))}
            </div>
          ) : null}

          {demoUsers.isError ? (
            <>
              <ErrorPanel
                error={demoUsers.error}
                title="Demo roles are unavailable"
                onRetry={() => {
                  void demoUsers.refetch();
                }}
              />
              <p className="helper-note">
                Demo access must be enabled on the API (<code>Demo:Enabled</code>),
                and the API must be running behind the <code>/api</code> proxy.
              </p>
            </>
          ) : null}

          {demoUsers.isSuccess && grouped.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck />}
              title="No demo seats found"
              description="The API answered, but did not return any seeded demo accounts. Check the demo configuration and seed data."
            />
          ) : null}

          {grouped.length > 0 ? (
            <div className="role-grid">
              {grouped.map(({ role, users }) => {
                const Icon = ROLE_ICON[role];
                return (
                  <article key={role} className={`role-card role-card--${role}`}>
                    <header className="role-card__head">
                      <span className="role-card__index">{ROLE_INDEX[role]}</span>
                      <span className="role-card__role">
                        <Icon size={15} aria-hidden="true" />
                        {roleLabel(role)}
                      </span>
                    </header>
                    <h3>{ROLE_TITLE[role]}</h3>
                    <p className="role-card__blurb">{roleBlurb(role)}</p>
                    <div className="role-card__users">
                      {users.map((user) => (
                        <DemoUserButton
                          key={user.key}
                          user={user}
                          pending={
                            login.isPending && login.variables?.key === user.key
                          }
                          disabled={login.isPending}
                          onSelect={() => login.mutate(user)}
                        />
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          <div className="login-standard">
            <div>
              <strong>Need the standard account flow?</strong>
              <p>Password sign-in exists on the API, but is intentionally outside this demo.</p>
            </div>
            <Link to="/login/standard" className="text-link">
              Standard sign-in
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <p className="login-panel__fineprint">
            Demo accounts are selected by the server. No registration, email
            confirmation, uploads, or real patient data are part of this build.
          </p>
        </div>
      </section>
    </div>
  );
}
