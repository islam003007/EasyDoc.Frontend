import type { ReactNode } from 'react';
import type { AppointmentStatus, Role } from '../api/contracts';
import { statusLabel } from '../lib/format';

export type StampTone = 'pending' | 'scheduled' | 'done' | 'void' | 'solid';

export function Stamp({
  tone = 'solid',
  children,
  large = false,
}: {
  tone?: StampTone;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <span className={`stamp stamp--${tone} ${large ? 'stamp--lg' : ''}`.trim()}>
      {children}
    </span>
  );
}

const STATUS_TONE: Record<AppointmentStatus, StampTone> = {
  Pending: 'pending',
  Scheduled: 'scheduled',
  Completed: 'done',
  Canceled: 'void',
  Unknown: 'void',
};

export function StatusStamp({ status }: { status: AppointmentStatus }) {
  return <Stamp tone={STATUS_TONE[status]}>{statusLabel(status)}</Stamp>;
}

export function RoleStamp({ role }: { role: Role }) {
  const label =
    role === 'admin' ? 'Admin' : role === 'doctor' ? 'Doctor' : 'Patient';
  return <Stamp tone="solid">{label}</Stamp>;
}
