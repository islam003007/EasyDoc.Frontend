export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export interface RegistrationValues {
  personName: string;
  email: string;
  phoneNumber: string;
  password: string;
  passwordConfirm: string;
}

export type RegistrationErrors = Partial<
  Record<keyof RegistrationValues, string>
>;

export const EMPTY_REGISTRATION: RegistrationValues = {
  personName: '',
  email: '',
  phoneNumber: '',
  password: '',
  passwordConfirm: '',
};

export function validateLogin(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!email.trim()) errors.email = 'Enter the email for your account.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function validateRegistration(
  values: RegistrationValues,
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (!values.personName.trim()) {
    errors.personName = 'Enter your full name.';
  } else if (values.personName.trim().length < 2) {
    errors.personName = 'Enter at least two characters.';
  }

  if (!values.email.trim()) {
    errors.email = 'Enter an email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  const digits = values.phoneNumber.replace(/\D/g, '');
  if (!values.phoneNumber.trim()) {
    errors.phoneNumber = 'Enter a phone number.';
  } else if (digits.length < 8 || digits.length > 15) {
    errors.phoneNumber = 'Enter a phone number with 8 to 15 digits.';
  }

  if (!values.password) {
    errors.password = 'Choose a password.';
  } else if (values.password.length < 8) {
    errors.password = 'Use at least 8 characters.';
  } else if (
    !/[a-z]/.test(values.password) ||
    !/[A-Z]/.test(values.password) ||
    !/\d/.test(values.password) ||
    !/[^A-Za-z0-9]/.test(values.password)
  ) {
    errors.password =
      'Use 8+ characters with upper and lower case, a number, and a symbol.';
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = 'Repeat your password.';
  } else if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = 'The passwords do not match.';
  }

  return errors;
}
