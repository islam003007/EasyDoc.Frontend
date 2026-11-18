import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
  ClipboardList,
  MapPin,
  Stethoscope,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment, DoctorDetail } from '../api/contracts';
import {
  cancelPatientAppointment,
  fetchDoctor,
  fetchPatientAppointments,
  queryKeys,
} from '../api/queries';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Skeleton } from '../components/Loading';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatGrid } from '../components/StatGrid';
import { StatusPill } from '../components/StatusPill';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDayNumber,
  formatMonthShort,
  formatTimeRange,
  formatWeekdayShort,
  isUpcomingAppointment,
  relativeDateLabel,
} from '../lib/dates';
import { shortId, plural } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface AppointmentCardProps {
  appointment: Appointment;
  doctor?: DoctorDetail;
  onCancel: () => void;
}

function AppointmentCard({ appointment, doctor, onCancel }: AppointmentCardProps) {
  const canCancel =
    appointment.status === 'Pending' || appointment.status === 'Scheduled';

  return (
    <article className={`visit-card visit-card--${appointment.status.toLowerCase()}`}>
      <div className="visit-card__date" aria-hidden="true">
        <span>{formatWeekdayShort(appointment.date)}</span>
        <strong>{formatDayNumber(appointment.date)}</strong>
        <span>{formatMonthShort(appointment.date)}</span>
      </div>

      <div className="visit-card__body">
        <div className="visit-card__meta">
          <span className="mono-label">
            {relativeDateLabel(appointment.date)} ·{' '}
            {formatTimeRange(appointment.startTime, appointment.endTime)}
          </span>
          <StatusPill status={appointment.status} />
        </div>
        <h3>
          {doctor?.personName ?? appointment.doctorName ?? `Doctor ${shortId(appointment.doctorId)}`}
        </h3>
        <p className="visit-card__sub">
          <Stethoscope size={14} aria-hidden="true" />
          {doctor?.department ?? 'Care team'}
          <span aria-hidden="true">·</span>
          <MapPin size={14} aria-hidden="true" />
          {doctor?.city ?? 'Clinic'}
        </p>

        {appointment.examination ? (
          <details className="visit-notes">
            <summary>Visit notes</summary>
            <dl>
              {appointment.examination.diagnosis ? (
                <div>
                  <dt>Diagnosis</dt>
                  <dd>{appointment.examination.diagnosis}</dd>
                </div>
              ) : null}
              {appointment.examination.prescription ? (
                <div>
                  <dt>Prescription</dt>
                  <dd>{appointment.examination.prescription}</dd>
                </div>
              ) : null}
              {appointment.examination.notes ? (
                <div>
                  <dt>Notes</dt>
                  <dd>{appointment.examination.notes}</dd>
                </div>
              ) : null}
            </dl>
          </details>
        ) : null}
      </div>

      <div className="visit-card__actions">
        {appointment.status === 'Completed' ? (
          <span className="mono-label">Closed</span>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onCancel}
          >
            <CalendarX2 size={14} aria-hidden="true" />
            Cancel
          </button>
        ) : null}
      </div>
    </article>
  );
}

function VisitSkeleton() {
  return (
    <div className="visit-card visit-card--skeleton" aria-hidden="true">
      <Skeleton width="4.5rem" height="5rem" />
      <div className="visit-card__body">
        <Skeleton width="35%" height="0.75rem" />
        <Skeleton width="55%" height="1.35rem" />
        <Skeleton width="42%" height="0.85rem" />
      </div>
    </div>
  );
}

export function PatientAppointmentsPage() {
  useDocumentTitle('My visits');
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const appointments = useQuery({
    queryKey: queryKeys.patientAppointments,
    queryFn: ({ signal }) => fetchPatientAppointments(signal),
  });

  const doctorIds = useMemo(
    () =>
      Array.from(
        new Set((appointments.data ?? []).map((appointment) => appointment.doctorId)),
      ).filter(Boolean),
    [appointments.data],
  );

  const doctorQueries = useQueries({
    queries: doctorIds.map((doctorId) => ({
      queryKey: queryKeys.doctor(doctorId),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchDoctor(doctorId, signal),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const doctorsById = useMemo(() => {
    const map = new Map<string, DoctorDetail>();
    doctorQueries.forEach((query, index) => {
      if (query.data) map.set(doctorIds[index], query.data);
    });
    return map;
  }, [doctorQueries, doctorIds]);

  const { upcoming, history, pendingCount, completedCount } = useMemo(() => {
    const all = appointments.data ?? [];
    const upcomingList = all
      .filter(isUpcomingAppointment)
      .sort(compareAppointmentsAsc);
    const upcomingIds = new Set(upcomingList.map((appointment) => appointment.id));
    const historyList = all
      .filter((appointment) => !upcomingIds.has(appointment.id))
      .sort(compareAppointmentsDesc);

    return {
      upcoming: upcomingList,
      history: historyList,
      pendingCount: all.filter((appointment) => appointment.status === 'Pending').length,
      completedCount: all.filter((appointment) => appointment.status === 'Completed')
        .length,
    };
  }, [appointments.data]);

  const cancel = useMutation({
    mutationFn: (appointment: Appointment) =>
      cancelPatientAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setCancelTarget(null);
      setNotice(
        `Canceled the visit on ${relativeDateLabel(appointment.date)} at ${formatTimeRange(appointment.startTime, appointment.endTime)}.`,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.patientAppointments,
      });
    },
  });

  const total = appointments.data?.length ?? 0;

  return (
    <div className="page page--visits">
      <PageHeader
        eyebrow="My visits"
        index="04"
        title={
          <>
            Your care,
            <br />
            <em>on the record.</em>
          </>
        }
        lead="Every request, confirmed visit, and completed note in one place. Canceling a pending request hands the time back to the clinic."
        actions={
          <Link to="/patient" className="btn btn--primary">
            <CalendarCheck2 size={16} aria-hidden="true" />
            Book a visit
          </Link>
        }
      />

      {notice ? (
        <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      ) : null}

      {appointments.isError ? (
        <ErrorPanel
          error={appointments.error}
          title="Your visits could not be loaded"
          onRetry={() => {
            void appointments.refetch();
          }}
        />
      ) : null}

      {appointments.isPending ? (
        <>
          <div className="stat-grid stat-grid--loading" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="stat-card">
                <Skeleton width="45%" height="0.7rem" />
                <Skeleton width="30%" height="2.2rem" />
              </div>
            ))}
          </div>
          <div className="visit-list" aria-busy="true" aria-label="Loading visits">
            {[0, 1, 2].map((index) => (
              <VisitSkeleton key={index} />
            ))}
          </div>
        </>
      ) : null}

      {appointments.isSuccess ? (
        <>
          <StatGrid
            stats={[
              {
                label: 'Upcoming',
                value: upcoming.length,
                note: 'Pending or scheduled, still ahead',
                tone: 'scheduled',
              },
              {
                label: 'Awaiting review',
                value: pendingCount,
                note: 'A doctor has not accepted yet',
                tone: 'pending',
              },
              {
                label: 'Completed',
                value: completedCount,
                note: 'Visit notes live on the cards',
                tone: 'muted',
              },
            ]}
          />

          <section className="visit-section" aria-labelledby="upcoming-heading">
            <div className="section-heading section-heading--row">
              <div>
                <p className="eyebrow">Next up</p>
                <h2 id="upcoming-heading">On the calendar.</h2>
              </div>
              <p className="mono-label">{upcoming.length} open</p>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={<CalendarCheck2 />}
                title="No upcoming visits."
                description="The week is clear. Search the directory to find a doctor and an open time."
                action={
                  <Link to="/patient" className="btn btn--secondary">
                    Find a doctor
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                }
              />
            ) : (
              <div className="visit-list">
                {upcoming.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    doctor={doctorsById.get(appointment.doctorId)}
                    onCancel={() => {
                      cancel.reset();
                      setCancelTarget(appointment);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="visit-section" aria-labelledby="history-heading">
            <div className="section-heading section-heading--row">
              <div>
                <p className="eyebrow">Record</p>
                <h2 id="history-heading">Earlier & closed.</h2>
              </div>
              <p className="mono-label">{plural(history.length, 'visit')}</p>
            </div>

            {history.length === 0 && total === 0 ? (
              <EmptyState
                icon={<ClipboardList />}
                title="The chart is empty."
                description="Your first booking will appear here with its live status and visit notes."
                action={
                  <Link to="/patient" className="btn btn--secondary">
                    Start with a search
                  </Link>
                }
              />
            ) : history.length === 0 ? (
              <p className="quiet-note">Nothing in the archive yet.</p>
            ) : (
              <div className="visit-list">
                {history.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    doctor={doctorsById.get(appointment.doctorId)}
                    onCancel={() => {
                      cancel.reset();
                      setCancelTarget(appointment);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Cancel this visit?"
        description={
          cancelTarget
            ? `The ${relativeDateLabel(cancelTarget.date)} visit at ${formatTimeRange(cancelTarget.startTime, cancelTarget.endTime)} will be returned to the doctor’s calendar. This cannot be undone.`
            : ''
        }
        confirmLabel="Cancel visit"
        pendingLabel="Canceling…"
        pending={cancel.isPending}
        error={cancel.error}
        onConfirm={() => {
          if (cancelTarget) cancel.mutate(cancelTarget);
        }}
        onClose={() => {
          if (!cancel.isPending) {
            setCancelTarget(null);
            cancel.reset();
          }
        }}
      />
    </div>
  );
}
