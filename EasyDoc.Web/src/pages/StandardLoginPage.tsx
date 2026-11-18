import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { describeFormError } from '../api/client';
import { passwordLogin } from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { AuthScreen } from '../components/AuthScreen';
import { Spinner } from '../components/Loading';
import { roleHome } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

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

export function StandardLoginPage() {
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
          'Signed in, but the session cookie was not visible. Check that cookies are enabled for this site.',
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
    <AuthScreen
      mode="Patient sign-in"
      title="Welcome back."
      lead="Sign in with the email and password for your patient account. Demo doctor and admin seats stay one click away."
      footer={
        <>
          <p className="auth-switch">
            New to EasyDoc?{' '}
            <Link to="/register" className="text-link">
              Create a patient account
            </Link>
          </p>
          <Link to="/login" className="btn btn--secondary btn--block">
            Use a one-click demo role
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p className="auth-fineprint">
            Doctors and administrators sign in through the seeded demo roles. No
            doctor self-registration is offered.
          </p>
        </>
      }
    >
      {login.isError ? (
        <div className="auth-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <p>{describeFormError(login.error)}</p>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={submit} noValidate>
        <div className={`field ${errors.email ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="signin-email">Email</label>
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
          {errors.email ? (
            <small className="field__error" id="signin-email-error">
              {errors.email}
            </small>
          ) : null}
        </div>

        <div className={`field ${errors.password ? 'field--invalid' : ''}`.trim()}>
          <label htmlFor="signin-password">Password</label>
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
              aria-describedby={errors.password ? 'signin-password-error' : undefined}
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
          {errors.password ? (
            <small className="field__error" id="signin-password-error">
              {errors.password}
            </small>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block auth-submit"
          disabled={login.isPending}
        >
          {login.isPending ? <Spinner /> : <LogIn size={16} aria-hidden="true" />}
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthScreen>
  );
}
