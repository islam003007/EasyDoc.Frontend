import { initials, monogramTone, type MonogramTone } from '../lib/format';

const SIZES = {
  sm: 'monogram--sm',
  md: 'monogram--md',
  lg: 'monogram--lg',
  xl: 'monogram--xl',
} as const;

export function Monogram({
  name,
  size = 'md',
  tone,
}: {
  name: string;
  size?: keyof typeof SIZES;
  tone?: MonogramTone | 'ink';
}) {
  const resolved = tone ?? monogramTone(name);
  return (
    <span
      className={`monogram monogram--${resolved} ${SIZES[size]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
