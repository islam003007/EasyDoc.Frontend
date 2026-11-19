export interface StatItem {
  label: string;
  value: number | string;
  note?: string;
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <dl className="stat-strip">
      {items.map((item) => (
        <div key={item.label} className="stat-strip__item">
          <dt className="stat-strip__label">{item.label}</dt>
          <dd className="stat-strip__value tnum">{item.value}</dd>
          {item.note ? <dd className="stat-strip__note">{item.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}
