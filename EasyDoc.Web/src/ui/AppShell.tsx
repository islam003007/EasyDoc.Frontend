import { format } from 'date-fns';
import {
  CalendarDays,
  LogOut,
  Search,
  Stethoscope,
  UserRound,
  Users,
} from 'lucide-react';
import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { useLogout } from '../auth/useLogout';
import { roleHome } from '../lib/format';
import { Brand } from './Brand';
import { ScreenLoading } from './Loading';
import { Monogram } from './Monogram';

interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: typeof Search;
  end?: boolean;
}

function navForRole(role: string): NavItem[] {
  switch (role) {
    case 'patient':
      return [
        {
          to: '/patient',
          label: 'Find a doctor',
          shortLabel: 'Find',
          icon: Search,
          end: true,
        },
        {
          to: '/patient/appointments',
          label: 'My visits',
          shortLabel: 'Visits',
          icon: CalendarDays,
        },
      ];
    case 'doctor':
      return [
        {
          to: '/doctor',
          label: 'Practice board',
          shortLabel: 'Board',
          icon: Stethoscope,
          end: true,
        },
        {
          to: '/doctor/schedule',
          label: 'Schedule',
          shortLabel: 'Hours',
          icon: CalendarDays,
        },
        {
          to: '/doctor/profile',
          label: 'Public profile',
          shortLabel: 'Profile',
          icon: UserRound,
        },
      ];
    case 'admin':
      return [
        {
          to: '/admin',
          label: 'Doctors',
          shortLabel: 'Doctors',
          icon: Stethoscope,
          end: true,
        },
        {
          to: '/admin/patients',
          label: 'Patients',
          shortLabel: 'Patients',
          icon: Users,
        },
      ];
    default:
      return [];
  }
}

const ROLE_NOTE: Record<string, string> = {
  patient: 'Open times and visit records, kept in one place.',
  doctor: 'Requests and visits are on the practice board.',
  admin: 'Directory changes stay safe and reversible.',
};

function navClass({ isActive }: { isActive: boolean }) {
  return `rail__link ${isActive ? 'is-active' : ''}`.trim();
}

export function AppShell() {
  const { session } = useSession();
  const logout = useLogout();

  if (!session) return null;

  const items = navForRole(session.role);
  const today = new Date();
  const roleLabel =
    session.role === 'admin'
      ? 'Admin'
      : session.role === 'doctor'
        ? 'Doctor'
        : 'Patient';

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <aside className="rail" aria-label="Sidebar">
        <Brand className="rail__brand" to={roleHome(session.role)} />

        <nav className="rail__nav" aria-label="Primary">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="rail__spacer" />

        <div className="rail__today">
          <div className="rail__today-day">
            <strong className="rail__today-number tnum">
              {format(today, 'd')}
            </strong>
            <span className="rail__today-month">
              <span>{format(today, 'EEEE')}</span>
              <span>
                {format(today, 'MMMM')} {format(today, 'yyyy')}
              </span>
            </span>
          </div>
          <p className="rail__today-note">{ROLE_NOTE[session.role]}</p>
        </div>

        <div className="rail__account">
          <Link
            to="/account"
            className="rail__account-link"
            aria-label="Account details"
          >
            <Monogram name={session.displayName} size="sm" />
            <span className="rail__account-copy">
              <strong>{session.displayName}</strong>
              <span>{roleLabel}</span>
            </span>
          </Link>
          <button
            type="button"
            className="rail__signout"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            aria-label={logout.isPending ? 'Signing out' : 'Sign out'}
            title="Sign out"
          >
            <LogOut size={15} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="topbar">
        <Brand to={roleHome(session.role)} />
        <Link to="/account" className="topbar__account" aria-label="Account details">
          <Monogram name={session.displayName} size="sm" />
          {roleLabel}
        </Link>
      </div>

      <div className="shell__body">
        <main id="main-content">
          <Suspense fallback={<ScreenLoading />}>
            <Outlet />
          </Suspense>
        </main>

        <footer className="shell__foot">
          <span>
            <strong>EasyDoc</strong> — a working clinic day.
          </span>
          <span>Portfolio demo. Sample clinic data may reset.</span>
        </footer>
      </div>

      <nav className="tabbar" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `tabbar__link ${isActive ? 'is-active' : ''}`.trim()
              }
            >
              <Icon size={19} aria-hidden="true" />
              {item.shortLabel}
            </NavLink>
          );
        })}
        <NavLink
          to="/account"
          className={({ isActive }) =>
            `tabbar__link ${isActive ? 'is-active' : ''}`.trim()
          }
        >
          <UserRound size={19} aria-hidden="true" />
          Account
        </NavLink>
      </nav>
    </div>
  );
}
