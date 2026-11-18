import { ArrowRight, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { PageHeader } from '../components/PageHeader';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { session } = useSession();

  return (
    <div className="page page--narrow">
      <PageHeader
        eyebrow="404"
        index="Lost chart"
        title={
          <>
            This page has
            <br />
            <em>no appointment.</em>
          </>
        }
        lead="The address doesn’t match a route in this demo. Nothing was booked, changed, or lost."
      />
      <div className="forbidden-card">
        <span className="forbidden-card__icon" aria-hidden="true">
          <Compass />
        </span>
        <div>
          <p className="mono-label">Try a known destination</p>
          <h2>Return to the clinic map.</h2>
          <p>
            Your sign-in is still active. Head back to your role’s workspace and
            continue from there.
          </p>
        </div>
      </div>
      <div className="page-actions">
        <Link
          to={session ? roleHome(session.role) : '/login'}
          className="btn btn--primary"
        >
          {session ? 'Back to my workspace' : 'Back to demo access'}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
