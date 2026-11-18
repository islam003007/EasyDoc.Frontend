import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  LogOut,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../api/client';
import type { PatientProfile, Session } from '../api/contracts';
import {
  fetchPatientMe,
  queryKeys,
  updatePatientMe,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { useLogout } from '../auth/useLogout';
import { PageHeader } from '../components/PageHeader';
import { Spinner } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Monogram } from '../components/Monogram';
import { Notice } from '../components/Notice';
import { RoleBadge } from '../components/RoleBadge';
import { roleLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface Shortcut {
  to: string;
  label: string;
  description: string;
  icon: typeof Search;
}

function shortcutsForRole(role: string): Shortcut[] {
  switch (role) {
    case 'patient':
      return [
        {
          to: '/patient',
          label: 'Find care',
          description: 'Search the directory and book an open time.',
          icon: Search,
        },
        {
          to: '/patient/appointments',
          label: 'My visits',
          description: 'Review the status of every request and visit.',
          icon: CalendarDays,
        },
      ];
    case 'doctor':
      return [
        {
          to: '/doctor',
          label: 'Practice board',
          description: 'Respond to requests and complete scheduled visits.',
          icon: Stethoscope,
        },
        {
          to: '/doctor/schedule',
          label: 'Weekly schedule',
          description: 'Read your hours and manage date overrides.',
          icon: CalendarDays,
        },
        {
          to: '/doctor/profile',
          label: 'Public profile',
          description: 'See the profile patients see in the directory.',
          icon: UserRound,
        },
      ];
    case 'admin':
      return [
        {
          to: '/admin',
          label: 'Doctor directory',
          description: 'Control which profiles are visible to patients.',
          icon: Stethoscope,
        },
        {
          to: '/admin/patients',
          label: 'Patient directory',
          description: 'Browse the seeded patient list in the sandbox.',
          icon: ShieldCheck,
        },
      ];
    default:
      return [];
  }
}

function workspaceLabel(role: string): string {
  switch (role) {
    case 'patient':
      return 'Patient care';
    case 'doctor':
      return 'Doctor practice';
    case 'admin':
      return 'Network admin';
    default:
      return 'Demo workspace';
  }
}

export function AccountPage() {
  useDocumentTitle('Account');
  const { session } = useSession();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const patientMe = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: ({ signal }) => fetchPatientMe(signal),
    enabled: session?.role === 'patient',
  });

  const savePatient = useMutation({
    mutationFn: () =>
      updatePatientMe({
        personName,
        phoneNumber,
      }),
    onSuccess: () => {
      const trimmedName = personName.trim();
      const trimmedPhone = phoneNumber.trim();
      queryClient.setQueryData<PatientProfile | undefined>(
        queryKeys.patientMe,
        (current) =>
          current
            ? {
                ...current,
                personName: trimmedName,
                phoneNumber: trimmedPhone || undefined,
              }
            : current,
      );
      queryClient.setQueryData<Session | null>(
        queryKeys.session,
        (current) =>
          current ? { ...current, displayName: trimmedName } : current,
      );
      setEditOpen(false);
      setNotice('Your account details were updated.');
      void queryClient.invalidateQueries({ queryKey: queryKeys.patientMe });
      void queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });

  if (!session) return null;

  const shortcuts = shortcutsForRole(session.role);
  const canEditPatient = session.role === 'patient';

  function openEdit() {
    setPersonName(patientMe.data?.personName ?? session?.displayName ?? '');
    setPhoneNumber(patientMe.data?.phoneNumber ?? '');
    savePatient.reset();
    setEditOpen(true);
  }

  function submitPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!personName.trim() || !phoneNumber.trim()) return;
    savePatient.mutate();
  }

  return (
    <div className="page page--account">
      <PageHeader
        eyebrow="Account"
        index="Seat"
        title={
          <>
            Your demo
            <br />
            <em>place in the clinic.</em>
          </>
        }
        lead="The name, email, and role for this seat — plus the quickest way back to your work. Demo seats open in one click; patient accounts use the password chosen at registration."
        actions={
          <>
            {canEditPatient ? (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={openEdit}
                disabled={patientMe.isPending}
              >
                <Pencil size={15} aria-hidden="true" />
                Edit details
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn--danger btn--sm"
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
        <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      ) : null}

      {canEditPatient && patientMe.isError ? (
        <Notice tone="error">
          Your contact details could not be loaded.{' '}
          <button
            type="button"
            className="text-link link-button"
            onClick={() => {
              void patientMe.refetch();
            }}
          >
            Try again
          </button>
        </Notice>
      ) : null}

      <section className="account-card">
        <div className="account-card__identity">
          <Monogram name={session.displayName} size="xl" />
          <div>
            <p className="mono-label">Signed in as</p>
            <h2>{session.displayName}</h2>
            <div className="account-card__meta">
              <RoleBadge role={session.role} />
            </div>
          </div>
        </div>

        <dl className="account-list">
          <div>
            <dt>Role</dt>
            <dd>{roleLabel(session.role)}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{session.email}</dd>
          </div>
          {canEditPatient ? (
            <div>
              <dt>Phone</dt>
              <dd>
                {patientMe.isPending
                  ? 'Loading…'
                  : patientMe.data?.phoneNumber ? (
                    <span className="account-phone">
                      <Phone size={14} aria-hidden="true" />
                      {patientMe.data.phoneNumber}
                    </span>
                  ) : (
                    '—'
                  )}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Workspace</dt>
            <dd>{workspaceLabel(session.role)}</dd>
          </div>
        </dl>
      </section>

      {shortcuts.length > 0 ? (
        <section className="account-section">
          <div className="section-heading">
            <p className="eyebrow">Role shortcuts</p>
            <h2>Carry on with the work.</h2>
          </div>
          <div className="shortcut-grid">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link key={shortcut.to} to={shortcut.to} className="shortcut-card">
                  <Icon size={18} aria-hidden="true" />
                  <span>
                    <strong>{shortcut.label}</strong>
                    <p>{shortcut.description}</p>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="account-note">
        <div>
          <p className="eyebrow">Switching seats</p>
          <h2>Switch roles any time.</h2>
          <p>
            Signing out returns you to the demo sign-in screen, where you can pick
            another seat. Demo seats open in one click; patient accounts keep their
            own password.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Switch role
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </section>

      {canEditPatient ? (
        <Modal
          open={editOpen}
          title="Edit your details."
          eyebrow="Patient account"
          description="Your name and phone number are used on appointments. The email address on the account stays fixed."
          onClose={() => {
            if (!savePatient.isPending) {
              setEditOpen(false);
              savePatient.reset();
            }
          }}
          footer={
            <>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setEditOpen(false);
                  savePatient.reset();
                }}
                disabled={savePatient.isPending}
              >
                Keep as is
              </button>
              <button
                type="submit"
                form="patient-account-form"
                className="btn btn--primary"
                disabled={
                  savePatient.isPending ||
                  !personName.trim() ||
                  !phoneNumber.trim()
                }
              >
                {savePatient.isPending ? <Spinner /> : <Pencil size={15} aria-hidden="true" />}
                {savePatient.isPending ? 'Saving…' : 'Save details'}
              </button>
            </>
          }
        >
          <form
            id="patient-account-form"
            className="form-stack"
            onSubmit={submitPatient}
          >
            <p className="modal-context">
              <span className="mono-label">Account email</span>
              {session.email}
            </p>

            <label className="field">
              <span>Name *</span>
              <input
                value={personName}
                onChange={(event) => setPersonName(event.target.value)}
                maxLength={200}
                required
                data-autofocus
              />
            </label>

            <label className="field">
              <span>Phone *</span>
              <input
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                inputMode="tel"
                placeholder="+20 100 000 0000"
                required
              />
            </label>

            {savePatient.isError ? (
              <p className="form-error" role="alert">
                {describeError(savePatient.error)}
              </p>
            ) : null}
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
