import type { ReactNode } from 'react';

export function PageHeader({
  kicker,
  title,
  lead,
  actions,
  meta,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="page-head">
      <div className="page-head__copy">
        {kicker ? <p className="page-head__kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        {lead ? <p className="page-head__lead">{lead}</p> : null}
      </div>
      {actions || meta ? (
        <div className="page-head__side">
          {meta ? <div className="page-head__meta">{meta}</div> : null}
          {actions ? <div className="page-head__actions">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
