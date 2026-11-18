import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Info,
  LogIn,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { DemoUser, Role } from '../api/contracts';
import { demoLogin, fetchDemoUsers, queryKeys } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { Brand } from '../components/Brand';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Skeleton, Spinner } from '../components/Loading';
import { Monogram } from '../components/Monogram';
import { roleBlurb, roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const ROLE_ORDER: Role[] = ['patient', 'doctor', 'admin', 'unknown'];

const ROLE_TITLE: Record<Role, string> = {
  patient: 'I’m here for care',
  doctor: 'I’m here to practise',
  admin: 'A sandbox review seat',
  unknown: 'Another demo seat',
};

const ROLE_CARD_LABEL: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Demo admin',
  unknown: 'Demo guest',
};

const ROLE_ICON: Record<Role, LucideIcon> = {
  patient: UserRound,
  doctor: Stethoscope,
  admin: ShieldCheck,
  unknown: UserRound,
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
          <Spinner label="Opening demo seat" />
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
          'We couldn’t finish opening this demo seat. Refresh the page and try again.',
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
          <span className="login-brand-panel__edition">Portfolio demo · 2026</span>
        </div>

        <div className="login-brand-panel__copy">
          <p className="eyebrow eyebrow--light">EasyDoc · care scheduling</p>
          <h1>
            Care,
            <br />
            <em>scheduled well.</em>
          </h1>
          <p>
            A working clinic directory built around real availability. Find a doctor,
            hold a time, or run the practice — from a seeded demo seat or your own
            patient account.
          </p>
          <div className="login-brand-chips" aria-label="Demo highlights">
            <span>Egypt care network</span>
            <span>Arabic + English</span>
            <span>Live availability</span>
          </div>
        </div>

        <div className="login-brand-panel__mark" aria-hidden="true">
          <img src="/brand/easydoc-mark.png" alt="" />
        </div>

        <ol className="login-steps">
          <li>
            <span>01</span>
            <div>
              <strong>Find the right care</strong>
              <p>Search by name, city, or specialty in Arabic or English.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Pick a real time</strong>
              <p>Open slots come from weekly hours, date overrides, and bookings.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Keep the day moving</strong>
              <p>Patients book. Doctors decide. Admins keep the directory honest.</p>
            </div>
          </li>
        </ol>

        <div className="login-brand-panel__foot">
          <span>Egypt care network</span>
          <span className="mono-label">Sample clinic data · demo accounts</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <p className="eyebrow">
            <span className="eyebrow__index">→</span>
            Demo access
          </p>
          <h2>Choose a demo seat.</h2>
          <p className="login-panel__lead">
            One click opens a seeded patient, doctor, or demo admin seat. Patient
            email sign-in and self-registration are also available below.
          </p>

          <div className="demo-notice">
            <span className="demo-notice__icon" aria-hidden="true">
              <Info size={16} />
            </span>
            <div className="demo-notice__body">
              <p className="demo-notice__title">A demo clinic, open for review.</p>
              <ul>
                <li>Sample data only — no live patients or real records.</li>
                <li>
                  The demo admin seat is intentionally open so every screen can be
                  reviewed.
                </li>
                <li>Please don’t enter real or sensitive patient information.</li>
                <li>Demo data may be reset between reviews.</li>
              </ul>
            </div>
          </div>

          {login.isError ? (
            <ErrorPanel
              error={login.error}
              title="Could not open this demo seat"
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
                Demo seats are unavailable right now. Make sure the demo service is
                running, then try again.
              </p>
            </>
          ) : null}

          {demoUsers.isSuccess && grouped.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck />}
              title="No demo seats found"
              description="The demo service answered, but no seeded seats were found. Try again once the demo data is available."
            />
          ) : null}

          {grouped.length > 0 ? (
            <div className="role-grid">
              {grouped.map(({ role, users }) => {
                const Icon = ROLE_ICON[role];
                return (
                  <article key={role} className={`role-card role-card--${role}`}>
                    <header className="role-card__head">
                      <span className="role-card__icon" aria-hidden="true">
                        <Icon size={18} />
                      </span>
                      <span className="role-card__role">{ROLE_CARD_LABEL[role]}</span>
                      <span className="role-card__index">{ROLE_INDEX[role]}</span>
                    </header>
                    <h3>{ROLE_TITLE[role]}</h3>
                    <p className="role-card__blurb">{roleBlurb(role)}</p>
                    {role === 'admin' ? (
                      <p className="role-card__sandbox">
                        <ShieldCheck size={14} aria-hidden="true" />
                        Open on purpose for portfolio review. Directory changes are
                        limited to safe, reversible visibility toggles.
                      </p>
                    ) : null}
                    <div className="role-card__users">
                      {users.map((user) => (
                        <DemoUserButton
                          key={user.key}
                          user={
                            role === 'admin'
                              ? { ...user, label: 'Demo admin' }
                              : user
                          }
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

          <div className="login-alt-grid">
            <Link to="/login/standard" className="login-alt">
              <span className="login-alt__icon" aria-hidden="true">
                <LogIn size={18} />
              </span>
              <span className="login-alt__copy">
                <strong>Sign in</strong>
                <small>Email and password for registered patients.</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/register" className="login-alt login-alt--pink">
              <span className="login-alt__icon" aria-hidden="true">
                <UserPlus size={18} />
              </span>
              <span className="login-alt__copy">
                <strong>Create a patient account</strong>
                <small>Self-register in under a minute.</small>
              </span>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <p className="login-panel__fineprint">
            Patient accounts use the password chosen at registration. Doctor and
            admin seats are demo accounts, and everything here is sample data that
            may be reset.
          </p>
        </div>
      </section>
    </div>
  );
}
