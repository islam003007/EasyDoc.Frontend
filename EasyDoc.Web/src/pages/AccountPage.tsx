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
          description: 'Browse the seeded patient list in the sandbox.',
          icon: ShieldCheck,
        },
      ];
    default:
      return [];
  }
}

function workspaceLabel(role: string): string {
  switch (role) {
    case 'patient':
      return 'Patient care';
    case 'doctor':
      return 'Doctor practice';
    case 'admin':
      return 'Network admin';
    default:
      return 'Demo workspace';
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
        lead="The name, email, and role for this seat — plus the quickest way back to your work. Demo seats open in one click; patient accounts use the password chosen at registration."
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
            </div>
          </div>
        </div>

        <dl className="account-list">
          <div>
            <dt>Role</dt>
            <dd>{roleLabel(session.role)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session.email}</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>{workspaceLabel(session.role)}</dd>
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
            Signing out returns you to the demo sign-in screen, where you can pick
            another seat. Demo seats open in one click; patient accounts keep their
            own password.
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
