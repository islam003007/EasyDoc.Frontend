import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { FcBrand } from './fc-ui';
import './fc-fonts';
import '../../../styles/fc-auth.css';

export function FriendlyAuthScreen({
  mode,
  title,
  lead,
  children,
  footer,
}: {
  mode: string;
  title: ReactNode;
  lead: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="fc-auth">
      <div className="auth-screen">
        <header className="auth-topbar">
          <FcBrand to="/login" />
          <Link to="/login" className="auth-topbar__back">
            <ArrowLeft size={15} aria-hidden="true" />
            All sign-in options
          </Link>
        </header>

        <main className="auth-shell">
          <aside className="auth-aside">
            <div className="auth-aside__art" aria-hidden="true">
              <span className="auth-aside__orb auth-aside__orb--pink" />
              <span className="auth-aside__orb auth-aside__orb--sky" />
              <img src="/brand/easydoc-mark.png" alt="" />
            </div>

            <p className="fc-eyebrow fc-eyebrow--light">{mode} · EasyDoc</p>
            <h1>
              Care that fits
              <br />
              <em>real life.</em>
            </h1>
            <p className="auth-aside__lead">
              Search trusted doctors across Egypt, hold an open time, and keep
              every visit in one calm place.
            </p>

            <ul className="auth-points">
              <li>
                <span>01</span>
                <div>
                  <strong>Real availability</strong>
                  <p>Open times come from the clinic’s live schedule.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>One clear record</strong>
                  <p>Requests, confirmed visits, and notes stay together.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Built in Egypt</strong>
                  <p>Arabic and English names, local cities, local care.</p>
                </div>
              </li>
            </ul>

            <p className="auth-aside__foot">Egypt care network · portfolio demo</p>
          </aside>

          <section className="auth-card">
            <p className="fc-eyebrow">
              <span className="fc-eyebrow__index">→</span>
              {mode}
            </p>
            <h2>{title}</h2>
            <p className="auth-card__lead">{lead}</p>
            {children}
            {footer ? <div className="auth-card__footer">{footer}</div> : null}
          </section>
        </main>
      </div>
    </div>
  );
}
