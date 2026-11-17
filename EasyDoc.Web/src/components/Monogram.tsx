import { initials, monogramTone, type MonogramTone } from '../lib/format';

export function Monogram({
  name,
  size = 'md',
  tone,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  tone?: MonogramTone;
}) {
  return (
    <span
      className={`monogram monogram--${tone ?? monogramTone(name)} monogram--${size}`}
      aria-hidden="true"
    >
      <span>{initials(name)}</span>
    </span>
  );
}
