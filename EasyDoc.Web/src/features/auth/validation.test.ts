// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  EMPTY_REGISTRATION,
  validateLogin,
  validateRegistration,
} from './validation';

describe('EasyDoc auth validation', () => {
  it('requires an email and password', () => {
    const errors = validateLogin('', '');
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it('rejects malformed emails', () => {
    expect(validateLogin('not-an-email', 'secret').email).toBe(
      'Enter a valid email address.',
    );
  });

  it('accepts a valid login', () => {
    expect(validateLogin('sara@example.com', 'secret')).toEqual({});
  });

  it('requires a full name and valid email', () => {
    const errors = validateRegistration(EMPTY_REGISTRATION);
    expect(errors.personName).toBeDefined();
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it('validates a phone number length', () => {
    expect(
      validateRegistration({
        ...EMPTY_REGISTRATION,
        personName: 'Sara Mohamed',
        email: 'sara@example.com',
        phoneNumber: '123',
        password: 'password123',
        passwordConfirm: 'password123',
      }).phoneNumber,
    ).toBe('Enter a phone number with 8 to 15 digits.');
  });

  it('requires matching passwords of at least eight characters', () => {
    const base = {
      ...EMPTY_REGISTRATION,
      personName: 'Sara Mohamed',
      email: 'sara@example.com',
      phoneNumber: '+20 100 123 4567',
    };

    expect(
      validateRegistration({ ...base, password: 'short', passwordConfirm: 'short' })
        .password,
    ).toBe('Use at least 8 characters.');
    expect(
      validateRegistration({
        ...base,
        password: 'password123',
        passwordConfirm: 'different',
      }).passwordConfirm,
    ).toBe('The passwords do not match.');
  });

  it('accepts a complete registration', () => {
    expect(
      validateRegistration({
        personName: 'Sara Mohamed',
        email: 'sara@example.com',
        phoneNumber: '+20 100 123 4567',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
      }),
    ).toEqual({});
  });

  it('requires upper case, lower case, a number and a symbol', () => {
    const base = {
      ...EMPTY_REGISTRATION,
      personName: 'Sara Mohamed',
      email: 'sara@example.com',
      phoneNumber: '+20 100 123 4567',
      passwordConfirm: 'password123',
    };

    expect(
      validateRegistration({ ...base, password: 'password123' }).password,
    ).toBe(
      'Use 8+ characters with upper and lower case, a number, and a symbol.',
    );
  });
});
