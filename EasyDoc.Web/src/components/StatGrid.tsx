import type { ReactNode } from 'react';

export interface Stat {
  label: string;
  value: ReactNode;
  note?: string;
  tone?: 'default' | 'pending' | 'scheduled' | 'muted';
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <dl className="stat-grid">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`stat-card ${stat.tone ? `stat-card--${stat.tone}` : ''}`.trim()}
        >
          <dt>{stat.label}</dt>
          <dd>{stat.value}</dd>
          {stat.note ? <p className="stat-card__note">{stat.note}</p> : null}
        </div>
      ))}
    </dl>
  );
}
