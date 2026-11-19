import { useMutation } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { describeFormError } from '../api/client';
import { passwordLogin } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { AuthFrame } from '../ui/AuthFrame';
import { Field } from '../ui/Field';
import { Spinner } from '../ui/Loading';

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Enter the email for your account.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export function StandardLoginScreen() {
  useDocumentTitle('Sign in');
  const { session, refreshSession } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const login = useMutation({
    mutationFn: async () => {
      await passwordLogin({ email, password });
      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'Signed in, but the account could not be confirmed. Refresh the page and try again.',
        );
      }
      return next;
    },
    onSuccess: (next) => {
      navigate(roleHome(next.role), { replace: true });
    },
  });

  if (session) return <Navigate to={roleHome(session.role)} replace />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.reset();
    const nextErrors = validate(email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    login.mutate();
  }

  return (
    <AuthFrame
      mode="Patient sign-in"
      title="Welcome back."
      lead="Sign in with the email and password for your patient account. Doctor and demo-admin seats stay one click away on the demo desk."
      footer={
        <>
          <p className="auth-card__switch">
            New to EasyDoc?{' '}
            <Link to="/register" className="text-link">
              Create a patient account
            </Link>
          </p>
          <Link to="/login" className="btn btn--secondary btn--block">
            Use a one-click demo seat
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p className="auth-card__fineprint">
            Demo environment with sample data. Doctors and demo admins sign in
            through the seeded seats; there is no doctor self-registration.
          </p>
        </>
      }
    >
      {login.isError ? (
        <p className="form-error" role="alert">
          <AlertCircle size={15} aria-hidden="true" />
          <span>{describeFormError(login.error)}</span>
        </p>
      ) : null}

      <form className="auth-form" onSubmit={submit} noValidate>
        <Field id="signin-email" label="Email" error={errors.email}>
          <input
            id="signin-email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (errors.email) {
                setErrors((current) => ({ ...current, email: undefined }));
              }
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'signin-email-error' : undefined}
            placeholder="you@example.com"
          />
        </Field>

        <Field id="signin-password" label="Password" error={errors.password}>
          <span className="password-control">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? 'signin-password-error' : undefined
              }
              placeholder="Your password"
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
        </Field>

        <button
          type="submit"
          className="btn btn--primary btn--block auth-submit"
          disabled={login.isPending}
        >
          {login.isPending ? <Spinner /> : <LogIn size={16} aria-hidden="true" />}
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthFrame>
  );
}
