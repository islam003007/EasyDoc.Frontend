import type { ReactNode } from 'react';

export function RecoveryScreen({
  eyebrow,
  title,
  lead,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="recovery-screen">
      <div className="recovery">
        <div className="recovery__mark" aria-hidden="true">
          <img src="/brand/easydoc-mark.png" alt="" width="72" height="72" />
        </div>
        <p className="mini-label">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="recovery__lead">{lead}</p>
        {children ? <div className="recovery__detail">{children}</div> : null}
        {actions ? <div className="recovery__actions">{actions}</div> : null}
      </div>
    </div>
  );
}
