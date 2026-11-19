import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../ui/Brand';

export function AuthFrame({
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
    <div className="auth-page">
      <header className="auth-page__top">
        <Brand to="/login" />
        <Link to="/login" className="auth-page__back">
          <ArrowLeft size={15} aria-hidden="true" />
          All sign-in options
        </Link>
      </header>

      <main className="auth-page__grid">
        <section className="auth-card">
          <p className="auth-card__mode">{mode}</p>
          <h1>{title}</h1>
          <p className="auth-card__lead">{lead}</p>
          {children}
          {footer ? <div className="auth-card__foot">{footer}</div> : null}
        </section>

        <aside className="auth-side" aria-label="About EasyDoc">
          <div className="auth-side__plate">
            <img src="/brand/easydoc-mark.png" alt="" width="240" height="240" />
          </div>
          <h2>Every request keeps its place.</h2>
          <ul className="auth-side__list">
            <li>
              <strong>Open times</strong>
              <p>
                come from the clinic&rsquo;s weekly hours and date overrides,
                not a canned list.
              </p>
            </li>
            <li>
              <strong>One record</strong>
              <p>
                follows each request from the first hold to the doctor&rsquo;s
                visit note.
              </p>
            </li>
            <li>
              <strong>Arabic and English</strong>
              <p>
                names sit naturally in the directory, the day sheet, and the
                record.
              </p>
            </li>
          </ul>
          <p className="auth-side__foot">
            Egypt care network. Sample clinic data.
          </p>
        </aside>
      </main>
    </div>
  );
}
