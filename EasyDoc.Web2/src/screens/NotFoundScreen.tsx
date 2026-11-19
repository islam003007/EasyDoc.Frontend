import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundScreen() {
  useDocumentTitle('Page not found');
  const { session } = useSession();
  const home = session ? roleHome(session.role) : '/login';

  return (
    <div className="page page--narrow">
      <div className="error-page">
        <p className="error-page__code" aria-hidden="true">
          404
        </p>
        <p className="mini-label">Missing page</p>
        <h1>That page is not in the book.</h1>
        <p className="error-page__lead">
          The address may be old, or the page may have moved. Return to your
          workspace and pick up the day from there.
        </p>
        <div className="error-page__actions">
          <Link to={home} className="btn btn--primary">
            Back to my workspace
          </Link>
          <Link to="/account" className="btn btn--secondary">
            View this seat
          </Link>
        </div>
      </div>
    </div>
  );
}
