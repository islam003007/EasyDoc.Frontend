import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Info,
  KeyRound,
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
import { Brand } from '../ui/Brand';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { roleBlurb, roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const ROLE_ORDER: Role[] = ['patient', 'doctor', 'admin', 'unknown'];

const ROLE_LABEL: Record<Role, string> = {
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

function SeatTicket({
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
      className="seat-ticket"
      onClick={onSelect}
      disabled={disabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="seat-ticket__spinner">
          <Spinner label="Opening demo seat" />
        </span>
      ) : (
        <Monogram name={user.label} size="sm" />
      )}
      <span className="seat-ticket__copy">
        <strong><bdi dir="auto">{user.label}</bdi></strong>
        <span dir="ltr">{user.email || 'Seeded demo account'}</span>
      </span>
      <span className="seat-ticket__go">
        {pending ? 'Opening…' : 'Enter'}
        {!pending ? <ArrowRight size={14} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

export function LoginScreen() {
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
          'We could not finish opening this seat. Refresh the page and try again.',
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

  const groups = ROLE_ORDER.map((role) => ({
    role,
    users: (demoUsers.data ?? []).filter((user) => user.role === role),
  })).filter((group) => group.users.length > 0);

  return (
    <div className="desk">
      <section className="desk__plate">
        <header className="desk__plate-head">
          <Brand to="/login" />
          <span className="desk__edition">Portfolio demo 2026</span>
        </header>

        <div className="desk__centre">
          <div className="desk__mark">
            <img src="/brand/easydoc-mark.png" alt="EasyDoc" width="280" height="280" />
          </div>
          <h1>Care that keeps the day moving.</h1>
          <p className="desk__lead">
            Find a doctor, hold an open time, or run the practice. Requests,
            bookings, and visit notes live in one working book.
          </p>
          <dl className="desk__facts">
            <div>
              <dt>Network</dt>
              <dd>Egypt, Arabic and English</dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>Patient, doctor, demo admin</dd>
            </div>
            <div>
              <dt>Data</dt>
              <dd>Seeded clinic sample</dd>
            </div>
          </dl>
        </div>

        <p className="desk__foot">
          EasyDoc Open Hours. A scheduling study in ASP.NET Core and React.
        </p>
      </section>

      <section className="seats" aria-labelledby="seats-heading">
        <div className="seats__inner">
          <header className="seats__head">
            <p className="seats__kicker">Demo access</p>
            <h2 id="seats-heading">Take a seat.</h2>
            <p className="seats__lead">
              One click opens a seeded role. Patient email sign-in and
              self-registration are below.
            </p>
          </header>

          <p className="seats__notice">
            <Info size={15} aria-hidden="true" />
            <span>
              Sample clinic data only. Please do not enter real patient
              information; seats may reset between reviews.
            </span>
          </p>

          {login.isError ? (
            <div className="seat-alert" role="alert">
              <strong>That seat did not open.</strong>
              <p>
                {login.error instanceof Error
                  ? login.error.message
                  : 'The demo service did not answer. Try again.'}
              </p>
            </div>
          ) : null}

          {demoUsers.isPending ? (
            <div className="seat-group" aria-busy="true" aria-label="Loading demo seats">
              {[0, 1, 2].map((index) => (
                <div key={index} className="seat-ticket seat-ticket--loading">
                  <Skeleton width="30px" height="30px" />
                  <span className="seat-ticket__copy">
                    <Skeleton width="45%" height="0.8rem" />
                    <Skeleton width="70%" height="0.65rem" />
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {demoUsers.isError ? (
            <div className="seat-panel">
              <ErrorPanel
                error={demoUsers.error}
                title="Demo seats are unavailable"
                onRetry={() => {
                  void demoUsers.refetch();
                }}
              />
              <p className="seat-panel__note">
                Make sure the EasyDoc service is running, then try again.
              </p>
            </div>
          ) : null}

          {demoUsers.isSuccess && groups.length === 0 ? (
            <div className="seat-panel">
              <Empty
                icon={<ShieldCheck size={19} />}
                title="No demo seats found"
                description="The demo service answered, but no seeded seats were returned. Try again once the demo data is available."
              />
            </div>
          ) : null}

          {groups.map(({ role, users }) => {
            const Icon = ROLE_ICON[role];
            return (
              <section key={role} className="seat-group">
                <header className="seat-group__head">
                  <span className="seat-group__icon" aria-hidden="true">
                    <Icon size={15} />
                  </span>
                  <div>
                    <h3>{ROLE_LABEL[role]}</h3>
                    <p>{roleBlurb(role)}</p>
                  </div>
                </header>

                {users.map((user) => (
                  <SeatTicket
                    key={user.key}
                    user={
                      role === 'admin' ? { ...user, label: 'Demo admin' } : user
                    }
                    pending={login.isPending && login.variables?.key === user.key}
                    disabled={login.isPending}
                    onSelect={() => login.mutate(user)}
                  />
                ))}

                {role === 'admin' ? (
                  <p className="seat-group__note">
                    <ShieldCheck size={13} aria-hidden="true" />
                    Open so every screen can be reviewed. Admin changes are
                    limited to safe, reversible visibility controls.
                  </p>
                ) : null}
              </section>
            );
          })}

          <div className="seats__alt">
            <Link to="/login/standard" className="seat-alt">
              <span className="seat-alt__icon" aria-hidden="true">
                <KeyRound size={17} />
              </span>
              <span>
                <strong>Sign in with a patient account</strong>
                <small>Email and password</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/register" className="seat-alt">
              <span className="seat-alt__icon" aria-hidden="true">
                <UserPlus size={17} />
              </span>
              <span>
                <strong>Create a patient account</strong>
                <small>Self-register in this demo</small>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>

          <p className="seats__fineprint">
            Doctor and demo-admin seats are seeded. Patient accounts use the
            password chosen at registration. Nothing here is real clinical
            data.
          </p>
        </div>
      </section>
    </div>
  );
}
