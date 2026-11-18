import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { RequireAuth, RequireRole } from './auth/guards';
import { SessionGate, SessionProvider, useSession } from './auth/SessionProvider';
import { AppShell } from './components/AppShell';
import { roleHome } from './lib/format';
import { AccountPage } from './pages/AccountPage';
import { AdminDoctorsPage } from './pages/AdminDoctorsPage';
import { AdminPatientsPage } from './pages/AdminPatientsPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { DoctorDetailPage } from './pages/DoctorDetailPage';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { DoctorSchedulePage } from './pages/DoctorSchedulePage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PatientAppointmentsPage } from './pages/PatientAppointmentsPage';
import { PatientSearchPage } from './pages/PatientSearchPage';
import { RegisterPage } from './pages/RegisterPage';
import { StandardLoginPage } from './pages/StandardLoginPage';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EasyDoc render error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-screen">
          <div className="fatal-screen__inner">
            <p className="mono-label">EasyDoc · interface error</p>
            <h1>Something went wrong on this page.</h1>
            <p className="fatal-screen__lead">
              A screen failed to render. Your session is still on the server; reload
              to try the route again.
            </p>
            <div className="page-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => window.location.reload()}
              >
                Reload EasyDoc
              </button>
              <a className="btn btn--secondary" href="/">
                Return to the start
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return null;
}

function RootRedirect() {
  const { session } = useSession();
  return <Navigate to={session ? roleHome(session.role) : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/standard" element={<StandardLoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route
          path="/patient"
          element={
            <RequireRole role="patient">
              <PatientSearchPage />
            </RequireRole>
          }
        />
        <Route
          path="/patient/doctors/:doctorId"
          element={
            <RequireRole role="patient">
              <DoctorDetailPage />
            </RequireRole>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <RequireRole role="patient">
              <PatientAppointmentsPage />
            </RequireRole>
          }
        />

        <Route
          path="/doctor"
          element={
            <RequireRole role="doctor">
              <DoctorDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            <RequireRole role="doctor">
              <DoctorSchedulePage />
            </RequireRole>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <RequireRole role="doctor">
              <DoctorProfilePage />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminDoctorsPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <RequireRole role="admin">
              <AdminPatientsPage />
            </RequireRole>
          }
        />

        <Route path="/account" element={<AccountPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <ScrollToTop />
        <SessionGate>
          <AppErrorBoundary>
            <AppRoutes />
          </AppErrorBoundary>
        </SessionGate>
      </SessionProvider>
    </BrowserRouter>
  );
}
