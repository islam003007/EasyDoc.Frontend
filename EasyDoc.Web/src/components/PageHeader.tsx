import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow: string;
  index?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  index,
  title,
  lead,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-head">
      <div className="page-head__copy">
        <p className="eyebrow">
          {index ? <span className="eyebrow__index">{index}</span> : null}
          {eyebrow}
        </p>
        <h1>{title}</h1>
        {lead ? <p className="page-head__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="page-head__actions">{actions}</div> : null}
    </header>
  );
}
