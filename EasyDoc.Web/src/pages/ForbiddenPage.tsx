import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { PageHeader } from '../components/PageHeader';
import { RoleBadge } from '../components/RoleBadge';
import { roleHome, roleLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function ForbiddenPage() {
  useDocumentTitle('Not your role');
  const { session } = useSession();
  const role = session?.role ?? 'unknown';

  return (
    <div className="page page--narrow">
      <PageHeader
        eyebrow="Role guard"
        index="403"
        title={
          <>
            This room isn’t
            <br />
            <em>on your floor.</em>
          </>
        }
        lead="This area belongs to a different role, and the app checks that before showing anything here."
      />

      <div className="forbidden-card">
        <span className="forbidden-card__icon" aria-hidden="true">
          <LockKeyhole />
        </span>
        <div>
          <p className="mono-label">Signed in as</p>
          <h2>
            {session?.displayName} <RoleBadge role={role} />
          </h2>
          <p>
            You are signed in as a {roleLabel(role).toLowerCase()}. This area belongs
            to a different demo role. Switch seats from Account, or return to your own
            workspace.
          </p>
        </div>
      </div>

      <div className="page-actions">
        <Link to={roleHome(role)} className="btn btn--primary">
          Go to my workspace
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/account" className="btn btn--secondary">
          Switch demo role
        </Link>
      </div>
    </div>
  );
}
