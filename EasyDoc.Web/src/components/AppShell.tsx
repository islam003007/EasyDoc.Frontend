import {
  CalendarDays,
  LogOut,
  Search,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { roleHome } from '../lib/format';
import { useSession } from '../auth/SessionProvider';
import { useLogout } from '../auth/useLogout';
import { Brand } from './Brand';
import { Monogram } from './Monogram';
import { RoleBadge } from './RoleBadge';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Search;
  end?: boolean;
}

function navForRole(role: string): NavItem[] {
  switch (role) {
    case 'patient':
      return [
        { to: '/patient', label: 'Find care', icon: Search },
        { to: '/patient/appointments', label: 'My visits', icon: CalendarDays },
      ];
    case 'doctor':
      return [
        { to: '/doctor', label: 'Practice board', icon: Stethoscope, end: true },
        { to: '/doctor/schedule', label: 'Schedule', icon: CalendarDays },
        { to: '/doctor/profile', label: 'My profile', icon: UserRound },
      ];
    case 'admin':
      return [
        { to: '/admin', label: 'Doctors', icon: Stethoscope, end: true },
        { to: '/admin/patients', label: 'Patients', icon: UserRound },
      ];
    default:
      return [];
  }
}

export function AppShell() {
  const { session } = useSession();
  const logout = useLogout();

  if (!session) return null;

  const navItems = navForRole(session.role);

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="masthead">
        <div className="utility-bar">
          <div className="utility-bar__left">
            <span className="utility-bar__dot" aria-hidden="true" />
            <span>EasyDoc demo sandbox</span>
            <span className="utility-bar__rule" aria-hidden="true" />
            <span className="utility-bar__muted">Sample clinic data</span>
          </div>
          <div className="utility-bar__right">
            <span className="utility-bar__muted">Signed in as {session.email}</span>
            <button
              type="button"
              className="utility-bar__logout"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut size={13} aria-hidden="true" />
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>

        <div className="masthead__main">
          <Brand to={roleHome(session.role)} />

          <nav className="primary-nav" aria-label="Primary">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className="primary-nav__link"
                >
                  <Icon size={15} aria-hidden="true" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <Link to="/account" className="account-chip" aria-label="Account details">
            <Monogram name={session.displayName} size="sm" />
            <span className="account-chip__copy">
              <strong>{session.displayName}</strong>
              <RoleBadge role={session.role} />
            </span>
          </Link>
        </div>
      </header>

      <main id="main-content" className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div>
          <span className="app-footer__word">EasyDoc</span>
          <span className="app-footer__note">
            A scheduling study in ASP.NET Core, React, and SQL Server.
          </span>
        </div>
        <p className="mono-label">
          Role-based portfolio demo · sample clinic data
        </p>
      </footer>
    </div>
  );
}
