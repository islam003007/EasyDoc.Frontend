import { ArrowRight, CalendarDays, LogOut, Search, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { useLogout } from '../auth/useLogout';
import { PageHeader } from '../components/PageHeader';
import { Monogram } from '../components/Monogram';
import { RoleBadge } from '../components/RoleBadge';
import { roleLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface Shortcut {
  to: string;
  label: string;
  description: string;
  icon: typeof Search;
}

function shortcutsForRole(role: string): Shortcut[] {
  switch (role) {
    case 'patient':
      return [
        {
          to: '/patient',
          label: 'Find care',
          description: 'Search the directory and book an open time.',
          icon: Search,
        },
        {
          to: '/patient/appointments',
          label: 'My visits',
          description: 'Review the status of every request and visit.',
          icon: CalendarDays,
        },
      ];
    case 'doctor':
      return [
        {
          to: '/doctor',
          label: 'Practice board',
          description: 'Respond to requests and complete scheduled visits.',
          icon: Stethoscope,
        },
        {
          to: '/doctor/schedule',
          label: 'Weekly schedule',
          description: 'Read your hours and manage date overrides.',
          icon: CalendarDays,
        },
        {
          to: '/doctor/profile',
          label: 'Public profile',
          description: 'See the profile patients see in the directory.',
          icon: UserRound,
        },
      ];
    case 'admin':
      return [
        {
          to: '/admin',
          label: 'Doctor directory',
          description: 'Control which profiles are visible to patients.',
          icon: Stethoscope,
        },
        {
          to: '/admin/patients',
          label: 'Patient directory',
          description: 'Review the seeded patient records.',
          icon: ShieldCheck,
        },
      ];
    default:
      return [];
  }
}

export function AccountPage() {
  useDocumentTitle('Account');
  const { session } = useSession();
  const logout = useLogout();

  if (!session) return null;

  const shortcuts = shortcutsForRole(session.role);

  return (
    <div className="page page--account">
      <PageHeader
        eyebrow="Account"
        index="Seat"
        title={
          <>
            Your demo
            <br />
            <em>place in the clinic.</em>
          </>
        }
        lead="Your session is cookie-based and role-scoped. Patient accounts use the password chosen at registration; demo seats are one click."
        actions={
          <button
            type="button"
            className="btn btn--danger btn--sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut size={15} aria-hidden="true" />
            {logout.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        }
      />

      <section className="account-card">
        <div className="account-card__identity">
          <Monogram name={session.displayName} size="xl" />
          <div>
            <p className="mono-label">Signed in as</p>
            <h2>{session.displayName}</h2>
            <div className="account-card__meta">
              <RoleBadge role={session.role} />
              <span>{session.email}</span>
            </div>
          </div>
        </div>

        <dl className="account-list">
          <div>
            <dt>User ID</dt>
            <dd className="code-value">{session.userId || 'Not returned by session'}</dd>
          </div>
          {session.patientId ? (
            <div>
              <dt>Patient record</dt>
              <dd className="code-value">{session.patientId}</dd>
            </div>
          ) : null}
          {session.doctorId ? (
            <div>
              <dt>Doctor record</dt>
              <dd className="code-value">{session.doctorId}</dd>
            </div>
          ) : null}
          <div>
            <dt>Role</dt>
            <dd>{roleLabel(session.role)}</dd>
          </div>
          <div>
            <dt>Session transport</dt>
            <dd>HTTP-only identity cookie · same-origin API</dd>
          </div>
        </dl>
      </section>

      {shortcuts.length > 0 ? (
        <section className="account-section">
          <div className="section-heading">
            <p className="eyebrow">Role shortcuts</p>
            <h2>Carry on with the work.</h2>
          </div>
          <div className="shortcut-grid">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link key={shortcut.to} to={shortcut.to} className="shortcut-card">
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{shortcut.label}</strong>
                    <p>{shortcut.description}</p>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="account-note">
        <div>
          <p className="eyebrow">Switching seats</p>
          <h2>Switch roles any time.</h2>
          <p>
            Signing out clears the session and every cached query, then returns to
            the sign-in screen. Demo seats open in one click; patient accounts use
            their own password.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Switch role
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>
    </div>
  );
}
