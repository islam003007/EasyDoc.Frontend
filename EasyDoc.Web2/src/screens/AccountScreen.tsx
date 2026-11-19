import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  KeyRound,
  LogOut,
  Pencil,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { PatientProfile, Role } from '../api/contracts';
import {
  fetchPatientMe,
  queryKeys,
  updatePatientMe,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { useLogout } from '../auth/useLogout';
import { roleLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { Dialog } from '../ui/Dialog';
import { InlineError } from '../ui/ErrorPanel';
import { Field } from '../ui/Field';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { RoleStamp } from '../ui/Stamp';

interface Shortcut {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

function shortcutsForRole(role: Role): Shortcut[] {
  switch (role) {
    case 'patient':
      return [
        {
          to: '/patient',
          label: 'Find care',
          description: 'Search the directory and hold an open time.',
          icon: Search,
        },
        {
          to: '/patient/appointments',
          label: 'My visits',
          description: 'Read records, reschedule, or cancel.',
          icon: CalendarDays,
        },
      ];
    case 'doctor':
      return [
        {
          to: '/doctor',
          label: 'Practice board',
          description: 'Answer requests and complete visits.',
          icon: Stethoscope,
        },
        {
          to: '/doctor/schedule',
          label: 'Schedule',
          description: 'Shape the weekly hours and date overrides.',
          icon: CalendarDays,
        },
        {
          to: '/doctor/profile',
          label: 'Public profile',
          description: 'Edit the record patients see.',
          icon: UserRound,
        },
      ];
    case 'admin':
      return [
        {
          to: '/admin',
          label: 'Doctor directory',
          description: 'Review records and switch visibility.',
          icon: Stethoscope,
        },
        {
          to: '/admin/patients',
          label: 'Patient directory',
          description: 'Read the seeded patient list.',
          icon: Users,
        },
      ];
    default:
      return [];
  }
}

function workspaceForRole(role: Role): string {
  switch (role) {
    case 'patient':
      return 'Patient app';
    case 'doctor':
      return 'Practice workspace';
    case 'admin':
      return 'Network admin';
    default:
      return 'EasyDoc';
  }
}

export function AccountScreen() {
  useDocumentTitle('Your seat');
  const { session, setSession } = useSession();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [notice, setNotice] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const isPatient = session?.role === 'patient';

  const patientMe = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: ({ signal }) => fetchPatientMe(signal),
    enabled: Boolean(isPatient),
  });

  const savePatient = useMutation({
    mutationFn: () => updatePatientMe({ personName, phoneNumber }),
    onSuccess: () => {
      const profile: PatientProfile | undefined = patientMe.data;
      if (profile) {
        queryClient.setQueryData(queryKeys.patientMe, {
          ...profile,
          personName: personName.trim(),
          phoneNumber: phoneNumber.trim(),
        });
      }
      if (session) {
        setSession({ ...session, displayName: personName.trim() });
      }
      setEditOpen(false);
      setNotice('Your patient details were updated.');
    },
  });

  if (!session) return null;

  const shortcuts = shortcutsForRole(session.role);

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
    <div className="page page--narrow">
      <PageHeader
        title="Your seat in the clinic."
        lead="The name, email, and role for this session — plus the quickest way back to the work."
        actions={
          <>
            {isPatient ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={openEdit}
                disabled={patientMe.isPending}
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

      {isPatient && patientMe.isError ? (
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

      <section className="sheet">
        <div className="sheet__body account-identity">
          <Monogram name={session.displayName} size="xl" />
          <div className="account-identity__copy">
            <p className="mini-label">Signed in as</p>
            <h2><bdi dir="auto">{session.displayName}</bdi></h2>
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
            {isPatient ? (
              <div>
                <dt>Phone</dt>
                <dd>
                  {patientMe.isPending ? (
                    <Skeleton width="8rem" height="0.9rem" />
                  ) : patientMe.data?.phoneNumber ? (
                    <span className="tnum" dir="ltr">
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
              <dd>{workspaceForRole(session.role)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {shortcuts.length > 0 ? (
        <section className="account-section">
          <div className="section-line">
            <h2>Carry on with the work</h2>
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
          <p className="mini-label">Switching seats</p>
          <h2>Another role is one sign-out away.</h2>
          <p>
            Signing out returns you to the demo desk, where any seeded seat opens
            in one click. Patient accounts keep their own password.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <KeyRound size={15} aria-hidden="true" />
          Switch seat
        </button>
      </section>

      <p className="account-fineprint">
        <ShieldCheck size={13} aria-hidden="true" />
        Demo environment. Sample clinic data. Accounts and records may reset.
      </p>

      <Dialog
        open={editOpen}
        title="Edit your details"
        kicker="Patient account"
        description="Your name and phone number appear on appointments. The email on the account stays fixed."
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
              Keep current details
            </button>
            <button
              type="submit"
              form="account-form"
              className="btn btn--primary"
              disabled={
                !personName.trim() || !phoneNumber.trim() || savePatient.isPending
              }
            >
              {savePatient.isPending ? <Spinner /> : <Pencil size={15} aria-hidden="true" />}
              {savePatient.isPending ? 'Saving…' : 'Save details'}
            </button>
          </>
        }
      >
        <form id="account-form" className="form-stack" onSubmit={submitPatient}>
          <Field id="account-name" label="Full name">
            <input
              id="account-name"
              value={personName}
              onChange={(event) => setPersonName(event.target.value)}
              dir="auto"
              required
            />
          </Field>
          <Field id="account-phone" label="Phone number">
            <input
              id="account-phone"
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              dir="ltr"
              required
            />
          </Field>
          {savePatient.isError ? <InlineError error={savePatient.error} /> : null}
        </form>
      </Dialog>
    </div>
  );
}
