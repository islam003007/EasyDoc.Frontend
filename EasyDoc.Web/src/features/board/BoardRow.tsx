import {
  Check,
  ClipboardCheck,
  Eye,
  FileText,
  History,
  X,
} from 'lucide-react';
import type { Appointment } from '../../api/contracts';
import {
  formatDayNumber,
  formatMonthShort,
  formatTime,
  formatWeekdayShort,
  relativeDateLabel,
} from '../../lib/dates';
import { Spinner } from '../../ui/Loading';
import { StatusStamp } from '../../ui/Stamp';

export function ExaminationRecord({
  appointment,
}: {
  appointment: Appointment;
}) {
  if (!appointment.examination) {
    return (
      <p className="record-empty">
        {appointment.status === 'Canceled'
          ? 'This visit was canceled. No diagnosis, prescription, or notes were recorded.'
          : appointment.status === 'Completed'
            ? 'This visit was completed without diagnosis, prescription, or notes on file.'
            : 'Diagnosis, prescription, and notes appear here once the visit is completed.'}
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

export function BoardRow({
  appointment,
  accepting,
  declining,
  onAccept,
  onDecline,
  onComplete,
  onView,
  onHistory,
}: {
  appointment: Appointment;
  accepting: boolean;
  declining: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
  onView: () => void;
  onHistory: () => void;
}) {
  return (
    <article className="board-row">
      <div className="board-row__date" aria-hidden="true">
        <span>{formatWeekdayShort(appointment.date)}</span>
        <strong className="tnum">{formatDayNumber(appointment.date)}</strong>
        <span>{formatMonthShort(appointment.date)}</span>
      </div>

      <div className="board-row__time tnum">
        <strong>{formatTime(appointment.startTime)}</strong>
        <span>to {formatTime(appointment.endTime)}</span>
      </div>

      <div className="board-row__body">
        <div className="board-row__top">
          <StatusStamp status={appointment.status} />
          <span className="board-row__when">
            {relativeDateLabel(appointment.date)}
          </span>
        </div>
        <h3>
          <bdi dir="auto">{appointment.patientName ?? 'Patient'}</bdi>
        </h3>
        {appointment.patientName ? null : (
          <p className="board-row__meta">Patient name not on this request</p>
        )}
        {appointment.examination ? (
          <p className="board-row__hint">
            <FileText size={13} aria-hidden="true" />
            Visit notes saved
          </p>
        ) : null}
      </div>

      <div className="board-row__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onView}>
          <Eye size={14} aria-hidden="true" />
          View
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onHistory}
        >
          <History size={14} aria-hidden="true" />
          History
        </button>

        {appointment.status === 'Pending' ? (
          <>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              onClick={onAccept}
              disabled={accepting || declining}
            >
              {accepting ? <Spinner /> : <Check size={14} aria-hidden="true" />}
              {accepting ? 'Accepting…' : 'Accept'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onDecline}
              disabled={accepting || declining}
            >
              <X size={14} aria-hidden="true" />
              Decline
            </button>
          </>
        ) : null}

        {appointment.status === 'Scheduled' ? (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={onComplete}
          >
            <ClipboardCheck size={14} aria-hidden="true" />
            Complete
          </button>
        ) : null}
      </div>
    </article>
  );
}
