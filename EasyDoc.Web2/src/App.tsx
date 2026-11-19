import {
  Component,
  useEffect,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { RequireAuth, RequireRole } from './auth/guards';
import { SessionGate, SessionProvider, useSession } from './auth/SessionProvider';
import { roleHome } from './lib/format';
import { AccountScreen } from './screens/AccountScreen';
import { AdminDoctorsScreen } from './screens/AdminDoctorsScreen';
import { AdminPatientsScreen } from './screens/AdminPatientsScreen';
import { DoctorBoardScreen } from './screens/DoctorBoardScreen';
import { DoctorDetailScreen } from './screens/DoctorDetailScreen';
import { DoctorProfileScreen } from './screens/DoctorProfileScreen';
import { DoctorScheduleScreen } from './screens/DoctorScheduleScreen';
import { ForbiddenScreen } from './screens/ForbiddenScreen';
import { LoginScreen } from './screens/LoginScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { PatientSearchScreen } from './screens/PatientSearchScreen';
import { PatientVisitsScreen } from './screens/PatientVisitsScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { StandardLoginScreen } from './screens/StandardLoginScreen';
import { AppShell } from './ui/AppShell';

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
        <div className="centre-screen">
          <div className="fatal">
            <img src="/brand/easydoc-mark.png" alt="" width="56" height="56" />
            <h1>This page did not open.</h1>
            <p className="fatal__lead">
              A screen failed to render. Reload to open this page again, or
              return to the start.
            </p>
            <div className="fatal__actions">
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
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/login/standard" element={<StandardLoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
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
              <PatientSearchScreen />
            </RequireRole>
          }
        />
        <Route
          path="/patient/doctors/:doctorId"
          element={
            <RequireRole role="patient">
              <DoctorDetailScreen />
            </RequireRole>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <RequireRole role="patient">
              <PatientVisitsScreen />
            </RequireRole>
          }
        />

        <Route
          path="/doctor"
          element={
            <RequireRole role="doctor">
              <DoctorBoardScreen />
            </RequireRole>
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            <RequireRole role="doctor">
              <DoctorScheduleScreen />
            </RequireRole>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <RequireRole role="doctor">
              <DoctorProfileScreen />
            </RequireRole>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminDoctorsScreen />
            </RequireRole>
          }
        />
        <Route
          path="/admin/patients"
          element={
            <RequireRole role="admin">
              <AdminPatientsScreen />
            </RequireRole>
          }
        />

        <Route path="/account" element={<AccountScreen />} />
        <Route path="/forbidden" element={<ForbiddenScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
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
