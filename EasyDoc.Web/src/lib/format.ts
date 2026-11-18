import type { Role } from '../api/contracts';

export function initials(name: string): string {
  const cleaned = name
    .replace(/^(dr\.?|doctor|prof\.?)\s+/i, '')
    .replace(/^(د\.?|دكتور)\s+/u, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'ED';
  if (words.length === 1) {
    return Array.from(words[0]).slice(0, 2).join('');
  }
  return `${Array.from(words[0])[0] ?? ''}${Array.from(words[words.length - 1])[0] ?? ''}`;
}

export function shortId(value: string | undefined): string {
  if (!value) return 'unknown';
  // UUIDv7 values in the seed share a timestamp prefix; the tail stays distinct.
  return value.replace(/-/g, '').slice(-8).toUpperCase();
}

export function roleLabel(role: Role): string {
  switch (role) {
    case 'patient':
      return 'Patient';
    case 'doctor':
      return 'Doctor';
    case 'admin':
      return 'Administrator';
    default:
      return 'Guest';
  }
}

export function roleHome(role: Role): string {
  switch (role) {
    case 'patient':
      return '/patient';
    case 'doctor':
      return '/doctor';
    case 'admin':
      return '/admin';
    default:
      return '/account';
  }
}

export function roleBlurb(role: Role): string {
  switch (role) {
    case 'patient':
      return 'Search the clinic network, find an open time, and keep track of visits.';
    case 'doctor':
      return 'Review requests, manage the day, and shape your weekly availability.';
    case 'admin':
      return 'Review the doctor directory and patient list in a safe, reversible sandbox.';
    default:
      return 'A seeded role for exploring the EasyDoc scheduling flow.';
  }
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${count === 1 ? singular : (pluralForm ?? `${singular}s`)}`;
}

export type MonogramTone = 'blush' | 'sky' | 'indigo' | 'lilac';

export function monogramTone(value: string): MonogramTone {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 9973;
  }
  const tones: MonogramTone[] = ['blush', 'sky', 'indigo', 'lilac'];
  return tones[hash % tones.length];
}
