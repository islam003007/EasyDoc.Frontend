import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck2,
  ClipboardList,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment } from '../api/contracts';
import {
  cancelPatientAppointment,
  queryKeys,
} from '../api/queries';
import {
  formatTimeRange,
  relativeDateLabel,
} from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { RescheduleVisitDialog } from '../features/visits/RescheduleVisitDialog';
import { usePatientVisits } from '../features/visits/usePatientVisits';
import { useRescheduleVisit } from '../features/visits/useRescheduleVisit';
import { VisitRecordDialog } from '../features/visits/VisitRecordDialog';
import { VisitRow } from '../features/visits/VisitRow';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { StatStrip } from '../ui/StatStrip';

export function PatientVisitsScreen() {
  useDocumentTitle('My visits');
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { appointments, doctorsById, upcoming, history, pendingCount, completedCount, total } =
    usePatientVisits();
  const reschedule = useRescheduleVisit({
    appointments: appointments.data,
    onNotice: setNotice,
  });

  const cancel = useMutation({
    mutationFn: (appointment: Appointment) =>
      cancelPatientAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setCancelTarget(null);
      setNotice(
        `Canceled the visit on ${relativeDateLabel(appointment.date)} at ${formatTimeRange(
          appointment.startTime,
          appointment.endTime,
        )}.`,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.patientAppointments,
      });
    },
  });

  function openReschedule(appointment: Appointment) {
    reschedule.open(appointment);
  }

  return (
    <div className="page">
      <PageHeader
        title="My visits."
        lead="Every request, confirmed visit, and completed note in one place. Open a record to read it, reschedule a visit, or cancel a request."
        actions={
          <Link to="/patient" className="btn btn--secondary">
            <CalendarCheck2 size={15} aria-hidden="true" />
            Find a doctor
          </Link>
        }
      />

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
      ) : null}

      {appointments.isError ? (
        <ErrorPanel
          error={appointments.error}
          title="We couldn’t load your visits"
          onRetry={() => {
            void appointments.refetch();
          }}
        />
      ) : null}

      {appointments.isPending ? (
        <>
          <div className="stat-strip" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="stat-strip__item">
                <Skeleton width="38%" height="0.65rem" />
                <Skeleton
                  width="24%"
                  height="1.6rem"
                  className="stat-strip__loading-value"
                />
              </div>
            ))}
          </div>
          <div className="visit-list" aria-busy="true" aria-label="Loading visits">
            {[0, 1, 2].map((index) => (
              <div key={index} className="visit">
                <Skeleton width="46px" height="58px" />
                <div className="visit__body stack--tight">
                  <Skeleton width="30%" height="0.7rem" />
                  <Skeleton width="48%" height="1.1rem" />
                  <Skeleton width="38%" height="0.7rem" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {appointments.isSuccess ? (
        <>
          <StatStrip
            items={[
              {
                label: 'Upcoming',
                value: upcoming.length,
                note: 'Requests and confirmed visits still ahead',
              },
              {
                label: 'Awaiting confirmation',
                value: pendingCount,
                note: 'Waiting for the doctor to confirm',
              },
              {
                label: 'Completed',
                value: completedCount,
                note: 'Visit notes saved to the record',
              },
            ]}
          />

          <section className="visit-section" aria-labelledby="upcoming-heading">
            <div className="section-line">
              <h2 id="upcoming-heading">Coming up</h2>
              <span className="mini-label tnum">
                {upcoming.length} {upcoming.length === 1 ? 'visit' : 'visits'}
              </span>
            </div>

            {upcoming.length === 0 ? (
              <Empty
                icon={<CalendarCheck2 size={19} />}
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
                  <VisitRow
                    key={appointment.id}
                    appointment={appointment}
                    doctor={doctorsById.get(appointment.doctorId)}
                    onView={() => setDetailTarget(appointment)}
                    onReschedule={() => openReschedule(appointment)}
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
            <div className="section-line">
              <h2 id="history-heading">Visit history</h2>
              <span className="mini-label tnum">
                {history.length} {history.length === 1 ? 'visit' : 'visits'}
              </span>
            </div>

            {history.length === 0 && total === 0 ? (
              <Empty
                icon={<ClipboardList size={19} />}
                title="No visits yet."
                description="Your first request will appear here, with its status and visit notes."
                action={
                  <Link to="/patient" className="btn btn--secondary">
                    Find a doctor
                  </Link>
                }
              />
            ) : history.length === 0 ? (
              <p className="quiet">No past visits yet.</p>
            ) : (
              <div className="visit-list">
                {history.map((appointment) => (
                  <VisitRow
                    key={appointment.id}
                    appointment={appointment}
                    doctor={doctorsById.get(appointment.doctorId)}
                    onView={() => setDetailTarget(appointment)}
                    onReschedule={() => openReschedule(appointment)}
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
            ? `The ${relativeDateLabel(cancelTarget.date)} visit at ${formatTimeRange(
                cancelTarget.startTime,
                cancelTarget.endTime,
              )} will return to the doctor's calendar. This can’t be undone.`
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
          setCancelTarget(null);
          cancel.reset();
        }}
      />

      <VisitRecordDialog
        appointment={detailTarget}
        doctor={
          detailTarget ? doctorsById.get(detailTarget.doctorId) : undefined
        }
        onClose={() => setDetailTarget(null)}
      />

      <RescheduleVisitDialog
        visit={reschedule}
        doctor={
          reschedule.target
            ? doctorsById.get(reschedule.target.doctorId)
            : undefined
        }
      />
    </div>
  );
}
