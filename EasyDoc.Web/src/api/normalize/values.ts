export type Rec = Record<string, unknown>;

export function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Case-insensitive property read, so API casing changes don't break the UI. */
export function read(record: Rec, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key];
    const lower = key.toLowerCase().replace(/[_-]/g, '');
    const match = Object.keys(record).find(
      (candidate) => candidate.toLowerCase().replace(/[_-]/g, '') === lower,
    );
    if (match) return record[match];
  }
  return undefined;
}

export function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

export function nameOf(value: unknown): string | undefined {
  if (isRecord(value)) {
    return text(read(value, 'name', 'label', 'title', 'displayName'));
  }
  return text(value);
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

export function numberValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function recordsIn(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates = [
    ...keys,
    'items',
    'results',
    'records',
    'data',
    'list',
    '$values',
  ];

  for (const key of candidates) {
    const value = read(payload, key);
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      for (const nestedKey of ['items', 'results', 'records', '$values']) {
        const nested = read(value, nestedKey);
        if (Array.isArray(nested)) return nested;
      }
    }
  }

  return [];
}
