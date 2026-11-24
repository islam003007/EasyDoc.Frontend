import { Phone } from 'lucide-react';
import type { Appointment, DoctorDetail } from '../../api/contracts';
import { formatDateLong, formatTimeRange } from '../../lib/dates';
import { statusLabel } from '../../lib/format';
import { Dialog } from '../../ui/Dialog';
import { Monogram } from '../../ui/Monogram';
import { Stamp, StatusStamp } from '../../ui/Stamp';
import { RecordBlock } from './VisitRow';

export function VisitRecordDialog({
  appointment,
  doctor,
  onClose,
}: {
  appointment: Appointment | null;
  doctor: DoctorDetail | undefined;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={Boolean(appointment)}
      title="Visit record"
      kicker="Visit detail"
      onClose={onClose}
      wide
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {appointment ? (
        <div className="record">
          <div className="record__identity">
            <Monogram
              name={doctor?.personName ?? appointment.doctorName ?? 'Doctor'}
              size="lg"
            />
            <div>
              <h3>
                <bdi dir="auto">
                  {doctor?.personName ?? appointment.doctorName ?? 'Your doctor'}
                </bdi>
              </h3>
              <p>
                {doctor?.department ?? 'Care team'}
                {doctor?.city ? `, ${doctor.city}` : ''}
              </p>
            </div>
            <StatusStamp status={appointment.status} />
          </div>

          <dl className="facts-grid facts-grid--record">
            <div>
              <dt>Date</dt>
              <dd>{formatDateLong(appointment.date)}</dd>
            </div>
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
              <dt>Clinic address</dt>
              <dd>{doctor?.clinicAddress ?? 'Not provided'}</dd>
            </div>
            <div>
              <dt>Visit length</dt>
              <dd>
                {doctor ? `${doctor.defaultAppointmentTimeInMinutes} minutes` : '—'}
              </dd>
            </div>
            <div>
              <dt>Doctor</dt>
              <dd>
                {doctor?.personName ?? appointment.doctorName ?? 'Your doctor'}
                {doctor?.phoneNumber ? (
                  <a
                    className="phone-link phone-link--spaced"
                    href={`tel:${doctor.phoneNumber}`}
                    dir="ltr"
                  >
                    <Phone size={12} aria-hidden="true" />
                    {doctor.phoneNumber}
                  </a>
                ) : null}
              </dd>
            </div>
          </dl>

          <section className="record__section" aria-labelledby="patient-record-heading">
            <div className="section-line">
              <h3 id="patient-record-heading">What the visit found</h3>
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
            <RecordBlock appointment={appointment} />
          </section>
        </div>
      ) : null}
    </Dialog>
  );
}
