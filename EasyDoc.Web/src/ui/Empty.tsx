import type { ReactNode } from 'react';

export function Empty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon ? <div className="empty__icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  );
}
