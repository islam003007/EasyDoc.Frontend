import {
  Component,
  lazy,
  Suspense,
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
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { StandardLoginPage } from './features/auth/StandardLoginPage';
import { ForbiddenScreen } from './screens/ForbiddenScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { AppLoading } from './ui/Loading';
import { RecoveryScreen } from './ui/RecoveryScreen';

const AppShell = lazy(() =>
  import('./ui/AppShell').then((module) => ({
    default: module.AppShell,
  })),
);

const AccountScreen = lazy(() =>
  import('./screens/AccountScreen').then((module) => ({
    default: module.AccountScreen,
  })),
);
const AdminDoctorsScreen = lazy(() =>
  import('./screens/AdminDoctorsScreen').then((module) => ({
    default: module.AdminDoctorsScreen,
  })),
);
const AdminPatientsScreen = lazy(() =>
  import('./screens/AdminPatientsScreen').then((module) => ({
    default: module.AdminPatientsScreen,
  })),
);
const DoctorBoardScreen = lazy(() =>
  import('./screens/DoctorBoardScreen').then((module) => ({
    default: module.DoctorBoardScreen,
  })),
);
const DoctorDetailScreen = lazy(() =>
  import('./screens/DoctorDetailScreen').then((module) => ({
    default: module.DoctorDetailScreen,
  })),
);
const DoctorProfileScreen = lazy(() =>
  import('./screens/DoctorProfileScreen').then((module) => ({
    default: module.DoctorProfileScreen,
  })),
);
const DoctorScheduleScreen = lazy(() =>
  import('./screens/DoctorScheduleScreen').then((module) => ({
    default: module.DoctorScheduleScreen,
  })),
);
const PatientSearchScreen = lazy(() =>
  import('./screens/PatientSearchScreen').then((module) => ({
    default: module.PatientSearchScreen,
  })),
);
const PatientVisitsScreen = lazy(() =>
  import('./screens/PatientVisitsScreen').then((module) => ({
    default: module.PatientVisitsScreen,
  })),
);

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
        <RecoveryScreen
          eyebrow="EasyDoc · page error"
          title="This page didn’t open."
          lead="A screen failed to render. Reload to try this page again, or return to the start of EasyDoc."
          actions={
            <>
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
            </>
          }
        />
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
            <Suspense fallback={<AppLoading label="Opening your workspace…" />}>
              <AppShell />
            </Suspense>
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
