import {
  ArrowRight,
  KeyRound,
  LogOut,
  Pencil,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { useLogout } from '../auth/useLogout';
import { PatientDetailsDialog } from '../features/account/PatientDetailsDialog';
import { shortcutsForRole, workspaceForRole } from '../features/account/shortcuts';
import { usePatientDetails } from '../features/account/usePatientDetails';
import { roleLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { Skeleton } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { RoleStamp } from '../ui/Stamp';

export function AccountScreen() {
  useDocumentTitle('Your account');
  const { session } = useSession();
  const logout = useLogout();
  const [notice, setNotice] = useState<string | null>(null);
  const details = usePatientDetails(() =>
    setNotice('Your patient details were updated.'),
  );

  if (!session) return null;

  const shortcuts = shortcutsForRole(session.role);

  return (
    <div className="page page--narrow">
      <PageHeader
        title="Your account."
        lead="The name, email, and role for this session, plus the quickest way back to your work."
        actions={
          <>
            {details.isPatient ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={details.openEdit}
                disabled={details.patientMe.isPending}
              >
                <Pencil size={15} aria-hidden="true" />
                Edit details
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
            >
              <LogOut size={15} aria-hidden="true" />
              {logout.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        }
      />

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
      ) : null}

      {details.isPatient && details.patientMe.isError ? (
        <Notice tone="error">
          We couldn’t load your contact details.{' '}
          <button
            type="button"
            className="text-link link-button"
            onClick={() => {
              void details.patientMe.refetch();
            }}
          >
            Try again
          </button>
        </Notice>
      ) : null}

      <section className="sheet">
        <div className="sheet__body account-identity">
          <Monogram name={session.displayName} size="xl" />
          <div className="account-identity__copy">
            <p className="mini-label">Signed in as</p>
            <h2>
              <bdi dir="auto">{session.displayName}</bdi>
            </h2>
            <div className="account-identity__stamp">
              <RoleStamp role={session.role} />
              <span>{workspaceForRole(session.role)}</span>
            </div>
          </div>
        </div>

        <div className="sheet__body sheet__body--flush">
          <dl className="account-facts">
            <div>
              <dt>Role</dt>
              <dd>{roleLabel(session.role)}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd dir="ltr">{session.email}</dd>
            </div>
            {details.isPatient ? (
              <div>
                <dt>Phone</dt>
                <dd>
                  {details.patientMe.isPending ? (
                    <Skeleton width="8rem" height="0.9rem" />
                  ) : details.patientMe.data?.phoneNumber ? (
                    <span className="tnum" dir="ltr">
                      {details.patientMe.data.phoneNumber}
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Workspace</dt>
              <dd>{workspaceForRole(session.role)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {shortcuts.length > 0 ? (
        <section className="account-section">
          <div className="section-line">
            <h2>Shortcuts</h2>
          </div>
          <div className="shortcut-list">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link key={shortcut.to} to={shortcut.to} className="shortcut-row">
                  <span className="shortcut-row__icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>
                  <span className="shortcut-row__copy">
                    <strong>{shortcut.label}</strong>
                    <span>{shortcut.description}</span>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="seat-note">
        <div>
          <p className="mini-label">Switching roles</p>
          <h2>Switch to another role.</h2>
          <p>
            Signing out returns you to the demo desk, where any demo seat opens in
            one click. Patient accounts keep their own password.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <KeyRound size={15} aria-hidden="true" />
          Switch role
        </button>
      </section>

      <p className="account-fineprint">
        <ShieldCheck size={13} aria-hidden="true" />
        Demo environment. Sample clinic data. Passwords are never stored in this
        browser. Accounts and records may reset.
      </p>

      <PatientDetailsDialog details={details} />
    </div>
  );
}
