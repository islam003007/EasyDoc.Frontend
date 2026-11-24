import type { DemoUser, Role, Session } from '../contracts';
import {
  isRecord,
  read,
  recordsIn,
  text,
} from './values';

export function normalizeRole(value: unknown): Role {
  const candidates: unknown[] = Array.isArray(value) ? value : [value];

  for (const candidate of candidates) {
    const normalized = text(candidate)?.toLowerCase() ?? '';
    if (normalized.includes('admin') || normalized.includes('administrator')) {
      return 'admin';
    }
    if (normalized.includes('doctor') || normalized.includes('physician')) {
      return 'doctor';
    }
    if (normalized.includes('patient')) return 'patient';
  }

  return 'unknown';
}

export function normalizeSession(payload: unknown): Session {
  if (!isRecord(payload)) {
    throw new Error('The session response was not a JSON object.');
  }

  const email = text(read(payload, 'email')) ?? '';
  const role = normalizeRole(read(payload, 'role', 'roles', 'userRole'));
  const patientId = text(read(payload, 'patientId'));
  const doctorId = text(read(payload, 'doctorId'));

  const inferredRole: Role =
    role !== 'unknown' ? role : doctorId ? 'doctor' : patientId ? 'patient' : 'unknown';

  const rawDisplayName = text(
    read(payload, 'displayName', 'name', 'fullName', 'personName'),
  );
  const emailLocalPart = email ? email.split('@')[0] : undefined;
  const displayName =
    rawDisplayName && rawDisplayName.toLowerCase() !== email.toLowerCase()
      ? rawDisplayName
      : inferredRole === 'admin'
        ? 'Administrator'
        : (emailLocalPart ?? 'Demo user');

  return {
    userId: text(read(payload, 'userId', 'id', 'sub')) ?? '',
    email,
    role: inferredRole,
    displayName,
    patientId,
    doctorId,
  };
}

export function normalizeDemoUsers(payload: unknown): DemoUser[] {
  let candidates = recordsIn(payload, ['demoUsers', 'users', 'accounts', 'roles']);

  // Also accept a role-keyed object: { patient: [...], doctor: [...], admin: [...] }.
  if (candidates.length === 0 && isRecord(payload)) {
    for (const [key, value] of Object.entries(payload)) {
      if (!Array.isArray(value)) continue;
      const role = normalizeRole(key);
      candidates = candidates.concat(
        value.map((entry) =>
          isRecord(entry) && read(entry, 'role') === undefined
            ? { ...entry, role }
            : entry,
        ),
      );
    }
  }

  const users = candidates
    .map((entry): DemoUser | null => {
      if (!isRecord(entry)) return null;
      const email = text(read(entry, 'email')) ?? '';
      const key =
        text(read(entry, 'key', 'loginKey', 'demoKey')) ?? (email || undefined);
      if (!key) return null;

      const explicitRole = normalizeRole(
        read(entry, 'role', 'roleName', 'type'),
      );
      const role: Role =
        explicitRole !== 'unknown'
          ? explicitRole
          : normalizeRole(key) !== 'unknown'
            ? normalizeRole(key)
            : normalizeRole(email);

      return {
        key,
        role,
        label:
          text(read(entry, 'label', 'displayName', 'name', 'personName')) ??
          email ??
          'Demo user',
        email,
      };
    })
    .filter((entry): entry is DemoUser => entry !== null);

  const seen = new Set<string>();
  const unique = users.filter((user) => {
    if (seen.has(user.key)) return false;
    seen.add(user.key);
    return true;
  });

  const rank: Record<Role, number> = { patient: 0, doctor: 1, admin: 2, unknown: 3 };
  return unique.sort(
    (a, b) => rank[a.role] - rank[b.role] || a.label.localeCompare(b.label),
  );
}
