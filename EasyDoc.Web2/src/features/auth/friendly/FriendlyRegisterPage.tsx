import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { describeFormError } from '../../../api/client';
import { passwordLogin, registerPatient } from '../../../api/queries';
import { useSession } from '../../../auth/SessionProvider';
import { roleHome } from '../../../lib/format';
import { useDocumentTitle } from '../../../lib/useDocumentTitle';
import { FriendlyAuthScreen } from './FriendlyAuthScreen';
import { FcField, FcSpinner } from './fc-ui';
import {
  EMPTY_REGISTRATION,
  validateRegistration,
  type RegistrationErrors,
  type RegistrationValues,
} from './fc-validation';

export function FriendlyRegisterPage() {
  useDocumentTitle('Create a patient account');
  const { session, refreshSession } = useSession();
  const navigate = useNavigate();

  const [values, setValues] = useState<RegistrationValues>(EMPTY_REGISTRATION);
  const [errors, setErrors] = useState<RegistrationErrors>({});
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
          `Your account was created, but signing in failed. ${describeFormError(
            error,
          )} Try signing in from the patient sign-in page.`,
        );
      }

      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'Your account was created, but the sign-in couldn’t be confirmed. Refresh the page, then sign in again.',
        );
      }
      return next;
    },
    onSuccess: (next) => {
      navigate(roleHome(next.role), { replace: true });
    },
  });

  if (session) return <Navigate to={roleHome(session.role)} replace />;

  function update<K extends keyof RegistrationValues>(
    key: K,
    value: string,
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    registration.reset();
    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    registration.mutate();
  }

  const passwordHint = errors.password
    ? undefined
    : '8+ characters with upper and lower case, a number, and a symbol.';

  return (
    <FriendlyAuthScreen
      mode="New patient"
      title="Create your account."
      lead="A few details are enough to start booking. New patient accounts are activated automatically in this demo. Please use sample details only."
      footer={
        <>
          <p className="auth-switch">
            Already registered?{' '}
            <Link to="/login/standard" className="fc-text-link">
              Sign in
            </Link>
          </p>
          <Link to="/login" className="fc-btn fc-btn--ghost fc-btn--block">
            Use a demo seat instead
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p className="auth-fineprint">
            Patient registration only. Doctor and demo admin seats are already set
            up. Sample data may be reset.
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
        <FcField
          id="register-name"
          label="Full name"
          error={errors.personName}
        >
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.personName}
            onChange={(event) => update('personName', event.target.value)}
            aria-invalid={Boolean(errors.personName)}
            aria-describedby={
              errors.personName ? 'register-name-error' : undefined
            }
            placeholder="e.g. Sara Mohamed"
          />
        </FcField>

        <FcField id="register-email" label="Email" error={errors.email}>
          <input
            id="register-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={
              errors.email ? 'register-email-error' : undefined
            }
            placeholder="you@example.com"
          />
        </FcField>

        <FcField
          id="register-phone"
          label="Phone number"
          error={errors.phoneNumber}
        >
          <input
            id="register-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phoneNumber}
            onChange={(event) => update('phoneNumber', event.target.value)}
            aria-invalid={Boolean(errors.phoneNumber)}
            aria-describedby={
              errors.phoneNumber ? 'register-phone-error' : undefined
            }
            placeholder="+20 100 123 4567"
          />
        </FcField>

        <FcField
          id="register-password"
          label="Password"
          error={errors.password}
          hint={passwordHint}
        >
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
                errors.password
                  ? 'register-password-error'
                  : 'register-password-hint'
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
        </FcField>

        <FcField
          id="register-password-confirm"
          label="Confirm password"
          error={errors.passwordConfirm}
        >
          <input
            id="register-password-confirm"
            name="confirm-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={values.passwordConfirm}
            onChange={(event) => update('passwordConfirm', event.target.value)}
            aria-invalid={Boolean(errors.passwordConfirm)}
            aria-describedby={
              errors.passwordConfirm
                ? 'register-password-confirm-error'
                : undefined
            }
            placeholder="Repeat your password"
          />
        </FcField>

        <button
          type="submit"
          className="fc-btn fc-btn--primary fc-btn--block auth-submit"
          disabled={registration.isPending}
        >
          {registration.isPending ? (
            <FcSpinner />
          ) : (
            <UserPlus size={16} aria-hidden="true" />
          )}
          {registration.isPending ? 'Creating account…' : 'Create patient account'}
        </button>
      </form>
    </FriendlyAuthScreen>
  );
}
