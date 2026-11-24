// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  firstName,
  initials,
  isArabicName,
  monogramTone,
  plural,
  roleHome,
} from './format';

describe('format helpers', () => {
  it('builds initials from Latin names', () => {
    expect(initials('Kareem Mohamed')).toBe('KM');
    expect(initials('Dr. Ahmed Hassan')).toBe('AH');
  });

  it('uses one initial for Arabic names', () => {
    expect(isArabicName('أحمد حسن')).toBe(true);
    expect(initials('أحمد حسن')).toBe('أ');
    expect(initials('سارة محمد')).toBe('س');
  });

  it('handles a single word and an empty name', () => {
    expect(initials('Nour')).toBe('No');
    expect(initials('   ')).toBe('ED');
  });

  it('maps roles to their home route', () => {
    expect(roleHome('patient')).toBe('/patient');
    expect(roleHome('doctor')).toBe('/doctor');
    expect(roleHome('admin')).toBe('/admin');
    expect(roleHome('unknown')).toBe('/account');
  });

  it('pluralises counts', () => {
    expect(plural(1, 'visit')).toBe('1 visit');
    expect(plural(2, 'visit')).toBe('2 visits');
    expect(plural(0, 'window')).toBe('0 windows');
  });

  it('takes the first word of a display name', () => {
    expect(firstName('Sara Mohamed')).toBe('Sara');
    expect(firstName('سارة محمد')).toBe('سارة');
  });

  it('assigns a stable monogram tone', () => {
    expect(monogramTone('Sara Mohamed')).toBe(monogramTone('Sara Mohamed'));
    expect(['blush', 'sky', 'indigo', 'lilac']).toContain(monogramTone('Ahmed'));
  });
});
