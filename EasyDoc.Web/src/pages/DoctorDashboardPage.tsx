import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarDays,
  Check,
  ClipboardCheck,
  RefreshCw,
  Stethoscope,
  X,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment } from '../api/contracts';
import { describeError } from '../api/client';
import {
  acceptAppointment,
  cancelDoctorAppointment,
  completeAppointment,
  fetchDoctorAppointments,
  queryKeys,
} from '../api/queries';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Spinner, Skeleton } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatGrid } from '../components/StatGrid';
import { StatusPill } from '../components/StatusPill';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDateLong,
  formatDateMedium,
  formatTimeRange,
  relativeDateLabel,
  relativeDayOnly,
} from '../lib/dates';
import { plural, shortId } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type BoardFilter = 'all' | 'pending' | 'scheduled' | 'closed';

const RANK: Record<Appointment['status'], number> = {
  Pending: 0,
  Scheduled: 1,
  Unknown: 2,
  Completed: 3,
  Canceled: 4,
};

function BoardRow({
  appointment,
  accepting,
  declining,
  onAccept,
  onDecline,
  onComplete,
}: {
  appointment: Appointment;
  accepting: boolean;
  declining: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onComplete: () => void;
}) {
  return (
    <article className={`board-row board-row--${appointment.status.toLowerCase()}`}>
      <div className="board-row__date" aria-hidden="true">
        <strong>{appointment.date.slice(8, 10)}</strong>
        <span>{relativeDayOnly(appointment.date)}</span>
      </div>

      <div className="board-row__body">
        <div className="board-row__topline">
          <span className="mono-label">
            {formatDateLong(appointment.date)} ·{' '}
            {formatTimeRange(appointment.startTime, appointment.endTime)}
          </span>
          <StatusPill status={appointment.status} />
        </div>
        <h3>{appointment.patientName ?? `Patient ${shortId(appointment.patientId)}`}</h3>
        <p className="board-row__meta" title={appointment.patientId}>
          Patient record {shortId(appointment.patientId)}
        </p>

        {appointment.examination ? (
          <details className="visit-notes">
            <summary>Saved visit notes</summary>
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

      <div className="board-row__actions">
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
              Cancel
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
            Complete visit
          </button>
        ) : null}

        {appointment.status === 'Completed' || appointment.status === 'Canceled' ? (
          <span className="mono-label board-row__closed">
            {appointment.status === 'Completed' ? 'Closed' : 'Released'}
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function DoctorDashboardPage() {
  useDocumentTitle('Practice board');
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Appointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  const appointments = useQuery({
    queryKey: queryKeys.doctorAppointments,
    queryFn: ({ signal }) => fetchDoctorAppointments(signal),
  });

  function invalidateBoard() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.doctorAppointments });
  }

  const accept = useMutation({
    mutationFn: (appointment: Appointment) => acceptAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setNotice(
        `Accepted the ${relativeDateLabel(appointment.date)} request at ${formatTimeRange(appointment.startTime, appointment.endTime)}.`,
      );
      invalidateBoard();
    },
  });

  const decline = useMutation({
    mutationFn: (appointment: Appointment) =>
      cancelDoctorAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setDeclineTarget(null);
      setNotice(
        `Canceled the ${relativeDateLabel(appointment.date)} pending request at ${formatTimeRange(appointment.startTime, appointment.endTime)}.`,
      );
      invalidateBoard();
    },
  });

  const complete = useMutation({
    mutationFn: async (input: {
      appointment: Appointment;
      diagnosis: string;
      prescription: string;
      notes: string;
    }) => {
      await completeAppointment({
        appointmentId: input.appointment.id,
        diagnosis: input.diagnosis,
        prescription: input.prescription,
        notes: input.notes,
      });
    },
    onSuccess: (_data, input) => {
      setCompleteTarget(null);
      setNotice(
        `Visit notes saved for ${formatDateMedium(input.appointment.date)}.`,
      );
      invalidateBoard();
    },
  });

  const all = appointments.data ?? [];

  const counts = useMemo(
    () => ({
      all: all.length,
      pending: all.filter((appointment) => appointment.status === 'Pending').length,
      scheduled: all.filter((appointment) => appointment.status === 'Scheduled')
        .length,
      closed: all.filter(
        (appointment) =>
          appointment.status === 'Completed' ||
          appointment.status === 'Canceled' ||
          appointment.status === 'Unknown',
      ).length,
      completed: all.filter((appointment) => appointment.status === 'Completed')
        .length,
    }),
    [all],
  );

  const filtered = useMemo(() => {
    const list = all.filter((appointment) => {
      if (filter === 'pending') return appointment.status === 'Pending';
      if (filter === 'scheduled') return appointment.status === 'Scheduled';
      if (filter === 'closed') {
        return (
          appointment.status === 'Completed' ||
          appointment.status === 'Canceled' ||
          appointment.status === 'Unknown'
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const rank = RANK[a.status] - RANK[b.status];
      if (rank !== 0) return rank;
      if (a.status === 'Completed' || a.status === 'Canceled') {
        return compareAppointmentsDesc(a, b);
      }
      return compareAppointmentsAsc(a, b);
    });
  }, [all, filter]);

  const actionError = accept.error ?? decline.error;
  const isEmpty = all.length === 0;

  function openComplete(appointment: Appointment) {
    setCompleteTarget(appointment);
    setDiagnosis('');
    setPrescription('');
    setNotes('');
    complete.reset();
  }

  function submitComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completeTarget || !diagnosis.trim() || !prescription.trim()) return;
    complete.mutate({
      appointment: completeTarget,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="page page--board">
      <PageHeader
        eyebrow="Practice board · Doctor"
        index="01"
        title={
          <>
            The day,
            <br />
            <em>in order.</em>
          </>
        }
        lead="Pending requests first, then confirmed visits and the closed record. Availability changes feed straight into patient search."
        actions={
          <Link to="/doctor/schedule" className="btn btn--secondary">
            <CalendarDays size={16} aria-hidden="true" />
            Edit schedule
          </Link>
        }
      />

      {notice ? (
        <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
      ) : null}

      {actionError ? (
        <Notice
          tone="error"
          onDismiss={() => {
            accept.reset();
            decline.reset();
          }}
        >
          {describeError(actionError)}
        </Notice>
      ) : null}

      {appointments.isError ? (
        <ErrorPanel
          error={appointments.error}
          title="The practice board could not be loaded"
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
          <div className="board-list" aria-busy="true" aria-label="Loading appointments">
            {[0, 1, 2].map((index) => (
              <div key={index} className="board-row board-row--skeleton">
                <Skeleton width="4rem" height="4.5rem" />
                <div className="board-row__body">
                  <Skeleton width="40%" height="0.7rem" />
                  <Skeleton width="55%" height="1.3rem" />
                  <Skeleton width="70%" height="0.8rem" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {appointments.isSuccess ? (
        <>
          <StatGrid
            stats={[
              {
                label: 'Awaiting you',
                value: counts.pending,
                note: 'Pending requests need a decision',
                tone: 'pending',
              },
              {
                label: 'Scheduled',
                value: counts.scheduled,
                note: 'Confirmed on the calendar',
                tone: 'scheduled',
              },
              {
                label: 'Completed',
                value: counts.completed,
                note: 'Visit notes on the record',
                tone: 'muted',
              },
            ]}
          />

          <div className="board-toolbar">
            <div className="segmented" role="group" aria-label="Filter appointments">
              {(
                [
                  ['all', 'All', counts.all],
                  ['pending', 'Needs response', counts.pending],
                  ['scheduled', 'Scheduled', counts.scheduled],
                  ['closed', 'Closed', counts.closed],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className={`segmented__item ${filter === value ? 'is-active' : ''}`.trim()}
                  onClick={() => setFilter(value)}
                  aria-pressed={filter === value}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                void appointments.refetch();
              }}
              disabled={appointments.isFetching}
            >
              <RefreshCw
                size={14}
                aria-hidden="true"
                className={appointments.isFetching ? 'spin' : undefined}
              />
              Refresh
            </button>
          </div>

          {isEmpty ? (
            <EmptyState
              icon={<CalendarClock />}
              title="No appointments yet."
              description="When a patient books one of your open times, the request will land here for review."
              action={
                <Link to="/doctor/schedule" className="btn btn--secondary">
                  Review availability
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Stethoscope />}
              title={
                filter === 'pending'
                  ? 'No requests waiting.'
                  : filter === 'scheduled'
                    ? 'Nothing scheduled.'
                    : 'Nothing closed yet.'
              }
              description={
                filter === 'pending'
                  ? 'Every request has been answered. The board is clear.'
                  : 'Switch to another filter to see the rest of the practice record.'
              }
              action={
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setFilter('all')}
                >
                  Show all visits
                </button>
              }
            />
          ) : (
            <div className="board-list" aria-live="polite">
              {filtered.map((appointment) => {
                const accepting =
                  accept.isPending && accept.variables?.id === appointment.id;
                const declining =
                  decline.isPending && decline.variables?.id === appointment.id;
                return (
                  <BoardRow
                    key={appointment.id}
                    appointment={appointment}
                    accepting={accepting}
                    declining={declining}
                    onAccept={() => {
                      accept.reset();
                      setNotice(null);
                      accept.mutate(appointment);
                    }}
                    onDecline={() => {
                      decline.reset();
                      setDeclineTarget(appointment);
                    }}
                    onComplete={() => openComplete(appointment)}
                  />
                );
              })}
            </div>
          )}

          <p className="quiet-note board-summary">
            {plural(counts.all, 'appointment')} loaded from the API. Patient names come
            from the appointment contract; record references stay available for support.
          </p>
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(declineTarget)}
        title="Cancel this pending request?"
        description={
          declineTarget
            ? `The request for ${relativeDateLabel(declineTarget.date)} at ${formatTimeRange(declineTarget.startTime, declineTarget.endTime)} will be canceled. The patient will see the canceled status.`
            : ''
        }
        confirmLabel="Cancel request"
        pendingLabel="Canceling…"
        pending={decline.isPending}
        error={decline.error}
        onConfirm={() => {
          if (declineTarget) decline.mutate(declineTarget);
        }}
        onClose={() => {
          if (!decline.isPending) {
            setDeclineTarget(null);
            decline.reset();
          }
        }}
      />

      <Modal
        open={Boolean(completeTarget)}
        title="Close the visit."
        eyebrow="Visit notes"
        description="Diagnosis and prescription are required. They are saved as the examination record."
        onClose={() => {
          if (!complete.isPending) {
            setCompleteTarget(null);
            complete.reset();
          }
        }}
        wide
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setCompleteTarget(null);
                complete.reset();
              }}
              disabled={complete.isPending}
            >
              Keep open
            </button>
            <button
              type="submit"
              form="complete-visit-form"
              className="btn btn--primary"
              disabled={
                complete.isPending || !diagnosis.trim() || !prescription.trim()
              }
            >
              {complete.isPending ? <Spinner /> : <Check size={16} aria-hidden="true" />}
              {complete.isPending ? 'Saving notes…' : 'Complete visit'}
            </button>
          </>
        }
      >
        {completeTarget ? (
          <form id="complete-visit-form" className="form-stack" onSubmit={submitComplete}>
            <p className="modal-context">
              <span className="mono-label">Appointment</span>
              {formatDateLong(completeTarget.date)} ·{' '}
              {formatTimeRange(completeTarget.startTime, completeTarget.endTime)} ·
              patient {shortId(completeTarget.patientId)}
            </p>

            {complete.isError ? (
              <p className="form-error" role="alert">
                {describeError(complete.error)}
              </p>
            ) : null}

            <label className="field">
              <span>Diagnosis *</span>
              <textarea
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                rows={2}
                required
                data-autofocus
                placeholder="What did the visit find?"
              />
            </label>

            <label className="field">
              <span>Prescription *</span>
              <textarea
                value={prescription}
                onChange={(event) => setPrescription(event.target.value)}
                rows={3}
                required
                placeholder="Medication, dosage, or care plan"
              />
            </label>

            <label className="field">
              <span>Notes <span className="field__optional">optional</span></span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                placeholder="Follow-up, observations, or patient guidance"
              />
            </label>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
