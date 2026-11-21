import { useMutation } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, Eye, EyeOff, LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { describeFormError } from '../../../api/client';
import { passwordLogin } from '../../../api/queries';
import { useSession } from '../../../auth/SessionProvider';
import { roleHome } from '../../../lib/format';
import { useDocumentTitle } from '../../../lib/useDocumentTitle';
import { FriendlyAuthScreen } from './FriendlyAuthScreen';
import { FcField, FcSpinner } from './fc-ui';
import { validateLogin, type LoginFieldErrors } from './fc-validation';

export function FriendlyStandardLoginPage() {
  useDocumentTitle('Sign in');
  const { session, refreshSession } = useSession();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginFieldErrors>({});

  const login = useMutation({
    mutationFn: async () => {
      await passwordLogin({ email, password });
      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'Signed in, but we couldn’t confirm your account. Refresh the page and try again.',
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
    const nextErrors = validateLogin(email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    login.mutate();
  }

  return (
    <FriendlyAuthScreen
      mode="Patient sign-in"
      title="Welcome back."
      lead="Sign in with the email and password for your patient account. Demo doctor and admin seats stay one click away."
      footer={
        <>
          <p className="auth-switch">
            New to EasyDoc?{' '}
            <Link to="/register" className="fc-text-link">
              Create a patient account
            </Link>
          </p>
          <Link to="/login" className="fc-btn fc-btn--secondary fc-btn--block">
            Use a demo seat
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <p className="auth-fineprint">
            Demo environment with sample data. Doctors and demo admins use the demo
            seats. Doctor self-registration is not available.
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
        <FcField id="signin-email" label="Email" error={errors.email}>
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
        </FcField>

        <FcField id="signin-password" label="Password" error={errors.password}>
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
        </FcField>

        <button
          type="submit"
          className="fc-btn fc-btn--primary fc-btn--block auth-submit"
          disabled={login.isPending}
        >
          {login.isPending ? <FcSpinner /> : <LogIn size={16} aria-hidden="true" />}
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </FriendlyAuthScreen>
  );
}
