import type { AppointmentStatus } from '../api/contracts';

const LABELS: Record<AppointmentStatus, string> = {
  Pending: 'Pending',
  Scheduled: 'Scheduled',
  Completed: 'Completed',
  Canceled: 'Canceled',
  Unknown: 'Unknown',
};

const TONES: Record<AppointmentStatus, string> = {
  Pending: 'pending',
  Scheduled: 'scheduled',
  Completed: 'completed',
  Canceled: 'canceled',
  Unknown: 'neutral',
};

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span className={`status-pill status-pill--${TONES[status]}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      {LABELS[status]}
    </span>
  );
}

export function VisibilityPill({ visible }: { visible: boolean }) {
  return (
    <span
      className={`status-pill ${visible ? 'status-pill--scheduled' : 'status-pill--canceled'}`}
    >
      <span className="status-pill__dot" aria-hidden="true" />
      {visible ? 'Listed' : 'Hidden'}
    </span>
  );
}
