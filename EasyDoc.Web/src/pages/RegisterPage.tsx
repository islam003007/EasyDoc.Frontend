import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { describeFormError } from '../api/client';
import { passwordLogin, registerPatient } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { AuthScreen } from '../components/AuthScreen';
import { Spinner } from '../components/Loading';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface FieldValues {
  personName: string;
  email: string;
  phoneNumber: string;
  password: string;
  passwordConfirm: string;
}

type FieldErrors = Partial<Record<keyof FieldValues, string>>;

const EMPTY_VALUES: FieldValues = {
  personName: '',
  email: '',
  phoneNumber: '',
  password: '',
  passwordConfirm: '',
};

function validate(values: FieldValues): FieldErrors {
  const errors: FieldErrors = {};

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
  }

  if (!values.passwordConfirm) {
    errors.passwordConfirm = 'Repeat your password.';
  } else if (values.passwordConfirm !== values.password) {
    errors.passwordConfirm = 'The passwords do not match.';
  }

  return errors;
}

export function RegisterPage() {
  useDocumentTitle('Create a patient account');
  const { session, refreshSession } = useSession();
  const navigate = useNavigate();

  const [values, setValues] = useState<FieldValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const registration = useMutation({
    mutationFn: async () => {
      await registerPatient({
        personName: values.personName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
      });

      try {
        await passwordLogin({ email: values.email, password: values.password });
      } catch (error) {
        throw new Error(
          `Your account was created, but signing in failed. ${describeFormError(error)} Try signing in from the patient sign-in page.`,
        );
      }

      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'Your account was created, but the session cookie was not visible. Check that cookies are enabled, then sign in.',
        );
      }
      return next;
    },
    onSuccess: (next) => {
      navigate(roleHome(next.role), { replace: true });
    },
  });

  if (session) return <Navigate to={roleHome(session.role)} replace />;

  function update<K extends keyof FieldValues>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    registration.reset();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    registration.mutate();
  }

  const errorFor = (key: keyof FieldValues, id: string) =>
    errors[key] ? (
      <small className="field__error" id={id}>
        {errors[key]}
      </small>
    ) : null;

  return (
    <AuthScreen
      mode="New patient"
      title="Create your account."
      lead="A few details are enough to start booking. New patient accounts are confirmed automatically in this demo."
      footer={
        <>
          <p className="auth-switch">
            Already registered?{' '}
            <Link to="/login/standard" className="text-link">
              Sign in
            </Link>
          </p>
          <Link to="/login" className="btn btn--ghost btn--block">
            Use a demo role instead
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p className="auth-fineprint">
            Patient registration only. Doctor and administrator accounts are seeded
            demo roles.
          </p>
        </>
      }
    >
      {registration.isError ? (
        <div className="auth-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <p>{describeFormError(registration.error)}</p>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={submit} noValidate>
        <div className={`field ${errors.personName ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.personName}
            onChange={(event) => update('personName', event.target.value)}
            aria-invalid={Boolean(errors.personName)}
            aria-describedby={errors.personName ? 'register-name-error' : undefined}
            placeholder="e.g. Sara Mohamed"
          />
          {errorFor('personName', 'register-name-error')}
        </div>

        <div className={`field ${errors.email ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            placeholder="you@example.com"
          />
          {errorFor('email', 'register-email-error')}
        </div>

        <div className={`field ${errors.phoneNumber ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="register-phone">Phone number</label>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phoneNumber}
            onChange={(event) => update('phoneNumber', event.target.value)}
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={errors.phoneNumber ? 'register-phone-error' : undefined}
            placeholder="+20 100 123 4567"
          />
          {errorFor('phoneNumber', 'register-phone-error')}
        </div>

        <div className={`field ${errors.password ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="register-password">Password</label>
          <span className="password-control">
            <input
              id="register-password"
              name="new-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={(event) => update('password', event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'register-password-error' : 'register-password-hint'
              }
              placeholder="Choose a password"
            />
            <button
              type="button"
              className="password-control__toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff size={17} aria-hidden="true" />
              ) : (
                <Eye size={17} aria-hidden="true" />
              )}
            </button>
          </span>
          {errors.password ? (
            errorFor('password', 'register-password-error')
          ) : (
            <small className="field__hint" id="register-password-hint">
              Use at least 8 characters.
            </small>
          )}
        </div>

        <div className={`field ${errors.passwordConfirm ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="register-password-confirm">Confirm password</label>
          <input
            id="register-password-confirm"
            name="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.passwordConfirm}
            onChange={(event) => update('passwordConfirm', event.target.value)}
            aria-invalid={Boolean(errors.passwordConfirm)}
            aria-describedby={
              errors.passwordConfirm ? 'register-password-confirm-error' : undefined
            }
            placeholder="Repeat your password"
          />
          {errorFor('passwordConfirm', 'register-password-confirm-error')}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block auth-submit"
          disabled={registration.isPending}
        >
          {registration.isPending ? (
            <Spinner />
          ) : (
            <UserPlus size={16} aria-hidden="true" />
          )}
          {registration.isPending ? 'Creating your account…' : 'Create patient account'}
        </button>
      </form>
    </AuthScreen>
  );
}
