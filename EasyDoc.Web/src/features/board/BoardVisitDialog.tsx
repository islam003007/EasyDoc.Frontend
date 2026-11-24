import { ClipboardCheck } from 'lucide-react';
import type { Appointment } from '../../api/contracts';
import { formatDateLong, formatTimeRange } from '../../lib/dates';
import { statusLabel } from '../../lib/format';
import { Dialog } from '../../ui/Dialog';
import { Monogram } from '../../ui/Monogram';
import { Stamp, StatusStamp } from '../../ui/Stamp';
import { ExaminationRecord } from './BoardRow';

export function BoardVisitDialog({
  appointment,
  onClose,
  onComplete,
}: {
  appointment: Appointment | null;
  onClose: () => void;
  onComplete: (appointment: Appointment) => void;
}) {
  return (
    <Dialog
      open={Boolean(appointment)}
      title="Visit record"
      kicker="Visit detail"
      onClose={onClose}
      wide
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
          {appointment?.status === 'Scheduled' ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => onComplete(appointment)}
            >
              <ClipboardCheck size={15} aria-hidden="true" />
              Complete visit
            </button>
          ) : null}
        </>
      }
    >
      {appointment ? (
        <div className="record">
          <div className="record__identity">
            <Monogram name={appointment.patientName ?? 'Patient'} size="lg" />
            <div>
              <h3>
                <bdi dir="auto">{appointment.patientName ?? 'Patient'}</bdi>
              </h3>
              <p>{formatDateLong(appointment.date)}</p>
            </div>
            <StatusStamp status={appointment.status} />
          </div>

          <dl className="facts-grid facts-grid--record">
            <div>
              <dt>Time</dt>
              <dd className="tnum">
                {formatTimeRange(appointment.startTime, appointment.endTime)}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{statusLabel(appointment.status)}</dd>
            </div>
            <div>
              <dt>Patient</dt>
              <dd>{appointment.patientName ?? 'Patient'}</dd>
            </div>
            <div>
              <dt>Request</dt>
              <dd>
                {appointment.patientName ? 'Patient request' : 'Name not on request'}
              </dd>
            </div>
          </dl>

          <section className="record__section" aria-labelledby="board-record-heading">
            <div className="section-line">
              <h3 id="board-record-heading">What the visit found</h3>
              <Stamp tone={appointment.examination ? 'done' : 'void'}>
                {appointment.examination
                  ? 'On file'
                  : appointment.status === 'Canceled'
                    ? 'Canceled'
                    : appointment.status === 'Completed'
                      ? 'No notes'
                      : 'Not yet'}
              </Stamp>
            </div>
            <ExaminationRecord appointment={appointment} />
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}
