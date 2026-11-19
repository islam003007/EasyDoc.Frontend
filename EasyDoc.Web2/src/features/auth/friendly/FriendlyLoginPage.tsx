import { Navigate } from 'react-router-dom';
import { useSession } from '../../../auth/SessionProvider';
import { roleHome } from '../../../lib/format';
import { useDocumentTitle } from '../../../lib/useDocumentTitle';
import './fc-fonts';
import '../../../styles/fc-auth.css';
import { DemoSeatPanel } from './DemoSeatPanel';
import { LoginBrandPanel } from './LoginBrandPanel';

export function FriendlyLoginPage() {
  useDocumentTitle('Demo access');
  const { session } = useSession();

  if (session) {
    return <Navigate to={roleHome(session.role)} replace />;
  }

  return (
    <div className="fc-login">
      <div className="login-shell">
        <LoginBrandPanel />
        <DemoSeatPanel />
      </div>
    </div>
  );
}
