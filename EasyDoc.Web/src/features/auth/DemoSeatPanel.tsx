import {
  ArrowUpRight,
  Info,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDemoSeats } from './useDemoSeats';
import { ROLE_ORDER } from './demo-seat-content';
import { DemoRoleCard } from './DemoRoleCard';
import { AuthEmpty, AuthErrorPanel, AuthSkeleton } from './AuthFeedback';

export function DemoSeatPanel() {
  const { users, login } = useDemoSeats();

  const groups = ROLE_ORDER.map((role) => ({
    role,
    users: (users.data ?? []).filter((user) => user.role === role),
  })).filter((group) => group.users.length > 0);

  return (
    <section className="login-panel">
      <div className="login-panel__inner">
        <p className="auth-eyebrow">
          <span className="auth-eyebrow__index">→</span>
          Demo access
        </p>
        <h2>Choose a demo seat.</h2>
        <p className="login-panel__lead">
          One click opens a demo patient, doctor, or admin seat. Patient email
          sign-in and self-registration are also available below.
        </p>

        <div className="demo-notice">
          <span className="demo-notice__icon" aria-hidden="true">
            <Info size={16} />
          </span>
          <div className="demo-notice__body">
            <p className="demo-notice__title">A demo clinic, open for review.</p>
            <ul>
              <li>Sample data only. No live patients or real records.</li>
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
          <div className="auth-inline-error" role="alert">
            <strong>We couldn’t open this demo seat.</strong>
            <p>
              {login.error instanceof Error
                ? login.error.message
                : 'EasyDoc didn’t respond. Try again.'}
            </p>
          </div>
        ) : null}

        {users.isPending ? (
          <div className="role-grid" aria-busy="true" aria-label="Loading demo seats">
            {[0, 1, 2].map((index) => (
              <div key={index} className="role-card role-card--loading">
                <AuthSkeleton width="40%" height="0.8rem" />
                <AuthSkeleton width="72%" height="1.6rem" />
                <AuthSkeleton width="100%" height="0.9rem" />
                <AuthSkeleton width="100%" height="3.6rem" />
              </div>
            ))}
          </div>
        ) : null}

        {users.isError ? (
          <>
            <AuthErrorPanel
              error={users.error}
              title="Demo seats are unavailable"
              onRetry={() => {
                void users.refetch();
              }}
            />
            <p className="auth-helper-note">
              Demo seats are unavailable right now. Try again in a moment.
            </p>
          </>
        ) : null}

        {users.isSuccess && groups.length === 0 ? (
          <AuthEmpty
            icon={<ShieldCheck size={19} />}
            title="No demo seats available"
            description="No demo accounts were found. Try again once the demo is ready."
          />
        ) : null}

        {groups.length > 0 ? (
          <div className="role-grid">
            {groups.map(({ role, users: roleUsers }) => (
              <DemoRoleCard
                key={role}
                role={role}
                users={roleUsers}
                pendingUserKey={
                  login.isPending ? login.variables?.key : undefined
                }
                disabled={login.isPending}
                onSelect={(user) => login.mutate(user)}
              />
            ))}
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
              <small>Create an account with your email.</small>
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <p className="login-panel__fineprint">
          Patient accounts use the password chosen at registration. Passwords are
          never stored in this browser. Doctor and admin seats are demo accounts,
          and everything here is sample data that may be reset.
        </p>
      </div>
    </section>
  );
}
