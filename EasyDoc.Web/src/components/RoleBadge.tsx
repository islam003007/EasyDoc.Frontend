import type { Role } from '../api/contracts';
import { roleLabel } from '../lib/format';

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`role-badge role-badge--${role}`}>{roleLabel(role)}</span>;
}
