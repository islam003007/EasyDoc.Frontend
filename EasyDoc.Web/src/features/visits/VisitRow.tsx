import {
  CalendarClock,
  CalendarX2,
  FileText,
  MapPin,
  Stethoscope,
} from 'lucide-react';
import type { Appointment, DoctorDetail } from '../../api/contracts';
import {
  formatDayNumber,
  formatMonthShort,
  formatTimeRange,
  formatWeekdayShort,
  relativeDateLabel,
} from '../../lib/dates';
import { StatusStamp } from '../../ui/Stamp';

export function RecordBlock({ appointment }: { appointment: Appointment }) {
  if (!appointment.examination) {
    return (
      <p className="record-empty">
        {appointment.status === 'Canceled'
          ? 'This visit was canceled. No diagnosis, prescription, or notes were recorded.'
          : appointment.status === 'Completed'
            ? 'This visit was completed without diagnosis, prescription, or notes on file.'
            : 'Diagnosis, prescription, and notes appear here once the doctor completes the visit.'}
      </p>
    );
  }

  return (
    <div className="record-grid">
      <div>
        <p className="record-grid__label">Diagnosis</p>
        <p>{appointment.examination.diagnosis ?? '—'}</p>
      </div>
      <div>
        <p className="record-grid__label">Prescription</p>
        <p>{appointment.examination.prescription ?? '—'}</p>
      </div>
      <div className="record-grid__wide">
        <p className="record-grid__label">Notes</p>
        <p>{appointment.examination.notes ?? 'No notes were added.'}</p>
      </div>
    </div>
  );
}

export function VisitRow({
  appointment,
  doctor,
  onView,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  doctor?: DoctorDetail;
  onView: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const canChange =
    appointment.status === 'Pending' || appointment.status === 'Scheduled';

  return (
    <article className="visit">
      <div className="visit__date" aria-hidden="true">
        <span>{formatWeekdayShort(appointment.date)}</span>
        <strong className="tnum">{formatDayNumber(appointment.date)}</strong>
        <span>{formatMonthShort(appointment.date)}</span>
      </div>

      <div className="visit__body">
        <div className="visit__top">
          <StatusStamp status={appointment.status} />
          <span className="visit__when tnum">
            {relativeDateLabel(appointment.date)} ·{' '}
            {formatTimeRange(appointment.startTime, appointment.endTime)}
          </span>
        </div>
        <h3>
          <bdi dir="auto">
            {doctor?.personName ?? appointment.doctorName ?? 'Your doctor'}
          </bdi>
        </h3>
        <p className="visit__meta">
          <Stethoscope size={13} aria-hidden="true" />
          {doctor?.department ?? 'Care team'}
          <MapPin size={13} aria-hidden="true" />
          {doctor?.city ?? 'Clinic'}
        </p>
        {appointment.examination ? (
          <p className="visit__hint">
            <FileText size={13} aria-hidden="true" />
            Visit notes are on record
          </p>
        ) : appointment.status === 'Completed' ? (
          <p className="visit__hint">
            <FileText size={13} aria-hidden="true" />
            No diagnosis or prescription was recorded
          </p>
        ) : null}
      </div>

      <div className="visit__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onView}>
          <FileText size={14} aria-hidden="true" />
          View record
        </button>
        {canChange ? (
          <>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={onReschedule}
            >
              <CalendarClock size={14} aria-hidden="true" />
              Reschedule
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onCancel}
            >
              <CalendarX2 size={14} aria-hidden="true" />
              Cancel
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
