import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  RefreshCw,
  Stethoscope,
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
  fetchPatientHistory,
  queryKeys,
} from '../api/queries';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDateLong,
  formatDateMedium,
  formatTimeRange,
  relativeDateLabel,
} from '../lib/dates';
import { ExaminationRecord, BoardRow } from '../features/board/BoardRow';
import { statusLabel } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dialog } from '../ui/Dialog';
import { Empty } from '../ui/Empty';
import { ErrorPanel, InlineError } from '../ui/ErrorPanel';
import { Field } from '../ui/Field';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { Stamp, StatusStamp } from '../ui/Stamp';
import { StatStrip } from '../ui/StatStrip';
type BoardFilter = 'all' | 'pending' | 'scheduled' | 'closed';

const RANK: Record<Appointment['status'], number> = {
  Pending: 0,
  Scheduled: 1,
  Unknown: 2,
  Completed: 3,
  Canceled: 4,
};

export function DoctorBoardScreen() {
  useDocumentTitle('Practice board');
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Appointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Appointment | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  const appointments = useQuery({
    queryKey: queryKeys.doctorAppointments,
    queryFn: ({ signal }) => fetchDoctorAppointments(signal),
  });

  const history = useQuery({
    queryKey: queryKeys.patientHistory(historyTarget?.patientId ?? ''),
    queryFn: ({ signal }) =>
      fetchPatientHistory(historyTarget?.patientId ?? '', signal),
    enabled: Boolean(historyTarget?.patientId),
    retry: false,
  });

  function invalidateBoard() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.doctorAppointments });
  }

  const accept = useMutation({
    mutationFn: (appointment: Appointment) => acceptAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setNotice(
        `Accepted the ${relativeDateLabel(appointment.date)} request at ${formatTimeRange(
          appointment.startTime,
          appointment.endTime,
        )}.`,
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
        `Declined the ${relativeDateLabel(appointment.date)} request at ${formatTimeRange(
          appointment.startTime,
          appointment.endTime,
        )}.`,
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
      setDetailTarget(null);
      setNotice(`Visit notes saved for ${formatDateMedium(input.appointment.date)}.`);
      invalidateBoard();
    },
  });

  const all = appointments.data ?? [];

  const counts = useMemo(
    () => ({
      all: all.length,
      pending: all.filter((appointment) => appointment.status === 'Pending').length,
      scheduled: all.filter(
        (appointment) => appointment.status === 'Scheduled',
      ).length,
      closed: all.filter(
        (appointment) =>
          appointment.status === 'Completed' ||
          appointment.status === 'Canceled' ||
          appointment.status === 'Unknown',
      ).length,
      completed: all.filter(
        (appointment) => appointment.status === 'Completed',
      ).length,
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
  const canComplete =
    Boolean(completeTarget) &&
    diagnosis.trim().length > 0 &&
    prescription.trim().length > 0;

  function openComplete(appointment: Appointment) {
    setCompleteTarget(appointment);
    setDiagnosis('');
    setPrescription('');
    setNotes('');
    complete.reset();
  }

  function submitComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completeTarget || !canComplete) return;
    complete.mutate({
      appointment: completeTarget,
      diagnosis: diagnosis.trim(),
      prescription: prescription.trim(),
      notes: notes.trim(),
    });
  }

  return (
    <div className="page">
      <PageHeader
        title="The day, in order."
        lead="Requests first, then confirmed and past visits. Open a visit for its notes, or read the patient’s history with your practice."
        actions={
          <Link to="/doctor/schedule" className="btn btn--secondary">
            <CalendarDays size={15} aria-hidden="true" />
            Edit schedule
          </Link>
        }
      />

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
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
          title="We couldn’t load the practice board"
          onRetry={() => {
            void appointments.refetch();
          }}
        />
      ) : null}

      {appointments.isPending ? (
        <div className="board-list" aria-busy="true" aria-label="Loading visits">
          {[0, 1, 2].map((index) => (
            <div key={index} className="board-row">
              <Skeleton width="46px" height="58px" />
              <Skeleton width="54px" height="34px" />
              <div className="board-row__body stack--tight">
                <Skeleton width="25%" height="0.65rem" />
                <Skeleton width="45%" height="1rem" />
                <Skeleton width="35%" height="0.65rem" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {appointments.isSuccess ? (
        <>
          <StatStrip
            items={[
              {
                label: 'Needs your answer',
                value: counts.pending,
                note: 'Requests waiting for your response',
              },
              {
                label: 'Confirmed',
                value: counts.scheduled,
                note: 'Confirmed visits on the calendar',
              },
              {
                label: 'Completed',
                value: counts.completed,
                note: 'Visit notes saved',
              },
            ]}
          />

          <div className="toolbar">
            <div className="segmented" role="group" aria-label="Filter visits">
              {(
                [
                  ['all', 'All', counts.all],
                  ['pending', 'Requests', counts.pending],
                  ['scheduled', 'Confirmed', counts.scheduled],
                  ['closed', 'Past', counts.closed],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  className={filter === value ? 'is-active' : undefined}
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
            <Empty
              icon={<CalendarClock size={19} />}
              title="No visits yet."
              description="When a patient requests one of your open times, it will appear here for review."
              action={
                <Link to="/doctor/schedule" className="btn btn--secondary">
                  Review availability
                </Link>
              }
            />
          ) : filtered.length === 0 ? (
            <Empty
              icon={<Stethoscope size={19} />}
              title={
                filter === 'pending'
                  ? 'No requests waiting.'
                  : filter === 'scheduled'
                    ? 'No confirmed visits.'
                    : 'No past visits yet.'
              }
              description="Choose another filter to see the rest of your visits."
            />
          ) : (
            <div className="board-list">
              {filtered.map((appointment) => (
                <BoardRow
                  key={appointment.id}
                  appointment={appointment}
                  accepting={accept.isPending && accept.variables?.id === appointment.id}
                  declining={
                    decline.isPending && decline.variables?.id === appointment.id
                  }
                  onAccept={() => accept.mutate(appointment)}
                  onDecline={() => {
                    decline.reset();
                    setDeclineTarget(appointment);
                  }}
                  onComplete={() => openComplete(appointment)}
                  onView={() => {
                    complete.reset();
                    setDetailTarget(appointment);
                  }}
                  onHistory={() => setHistoryTarget(appointment)}
                />
              ))}
            </div>
          )}
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(declineTarget)}
        title="Decline this request?"
        description={
          declineTarget
            ? `The ${relativeDateLabel(declineTarget.date)} request at ${formatTimeRange(
                declineTarget.startTime,
                declineTarget.endTime,
              )} will be declined and the time released. This can’t be undone.`
            : ''
        }
        confirmLabel="Decline request"
        pendingLabel="Declining…"
        pending={decline.isPending}
        error={decline.error}
        onConfirm={() => {
          if (declineTarget) decline.mutate(declineTarget);
        }}
        onClose={() => {
          setDeclineTarget(null);
          decline.reset();
        }}
      />

      <Dialog
        open={Boolean(detailTarget)}
        title="Visit record"
        kicker="Visit detail"
        onClose={() => setDetailTarget(null)}
        wide
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDetailTarget(null)}
            >
              Close
            </button>
            {detailTarget?.status === 'Scheduled' ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  const target = detailTarget;
                  setDetailTarget(null);
                  if (target) openComplete(target);
                }}
              >
                <ClipboardCheck size={15} aria-hidden="true" />
                Complete visit
              </button>
            ) : null}
          </>
        }
      >
        {detailTarget ? (
          <div className="record">
            <div className="record__identity">
              <Monogram name={detailTarget.patientName ?? 'Patient'} size="lg" />
              <div>
                <h3><bdi dir="auto">{detailTarget.patientName ?? 'Patient'}</bdi></h3>
                <p>{formatDateLong(detailTarget.date)}</p>
              </div>
              <StatusStamp status={detailTarget.status} />
            </div>

            <dl className="facts-grid facts-grid--record">
              <div>
                <dt>Time</dt>
                <dd className="tnum">
                  {formatTimeRange(detailTarget.startTime, detailTarget.endTime)}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{statusLabel(detailTarget.status)}</dd>
              </div>
              <div>
                <dt>Patient</dt>
                <dd>{detailTarget.patientName ?? 'Patient'}</dd>
              </div>
              <div>
                <dt>Request</dt>
                <dd>{detailTarget.patientName ? 'Patient request' : 'Name not on request'}</dd>
              </div>
            </dl>

            <section className="record__section" aria-labelledby="board-record-heading">
              <div className="section-line">
                <h3 id="board-record-heading">What the visit found</h3>
                <Stamp tone={detailTarget.examination ? 'done' : 'void'}>
                  {detailTarget.examination
                    ? 'On file'
                    : detailTarget.status === 'Canceled'
                      ? 'Canceled'
                      : detailTarget.status === 'Completed'
                        ? 'No notes'
                        : 'Not yet'}
                </Stamp>
              </div>
              <ExaminationRecord appointment={detailTarget} />
            </section>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(historyTarget)}
        title="Patient history"
        kicker={historyTarget?.patientName ?? 'Patient'}
        description="Every visit this patient has on record with your practice."
        onClose={() => setHistoryTarget(null)}
        wide
        footer={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setHistoryTarget(null)}
          >
            Close
          </button>
        }
      >
        {history.isPending ? (
          <div className="stack" aria-busy="true">
            <Skeleton height="3.5rem" />
            <Skeleton height="3.5rem" />
            <Skeleton height="3.5rem" />
          </div>
        ) : null}

        {history.isError ? (
          <ErrorPanel
            error={history.error}
            title="We couldn’t load this history"
            onRetry={() => {
              void history.refetch();
            }}
          />
        ) : null}

        {history.isSuccess && (history.data?.length ?? 0) === 0 ? (
          <p className="quiet">No earlier visits with your practice.</p>
        ) : null}

        {history.isSuccess && (history.data?.length ?? 0) > 0 ? (
          <div className="history-list">
            {[...(history.data ?? [])]
              .sort(compareAppointmentsDesc)
              .map((visit) => (
                <article key={visit.id} className="history-item">
                  <div className="history-item__top">
                    <span className="tnum">
                      {formatDateMedium(visit.date)} ·{' '}
                      {formatTimeRange(visit.startTime, visit.endTime)}
                    </span>
                    <StatusStamp status={visit.status} />
                  </div>
                  {visit.examination ? (
                    <dl className="history-item__exam">
                      <div>
                        <dt>Diagnosis</dt>
                        <dd>{visit.examination.diagnosis ?? '—'}</dd>
                      </div>
                      <div>
                        <dt>Prescription</dt>
                        <dd>{visit.examination.prescription ?? '—'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="history-item__empty">
                      {visit.status === 'Canceled'
                        ? 'Canceled visit. No notes were added.'
                        : visit.status === 'Completed'
                          ? 'Completed without notes on file.'
                          : 'Not completed yet.'}
                    </p>
                  )}
                </article>
              ))}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(completeTarget)}
        title="Write the visit record"
        kicker={completeTarget?.patientName ?? 'Patient'}
        description="Diagnosis and prescription are saved to the visit and visible to the patient. Notes are optional."
        onClose={() => {
          if (!complete.isPending) {
            setCompleteTarget(null);
            complete.reset();
          }
        }}
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
              Go back
            </button>
            <button
              type="submit"
              form="complete-visit-form"
              className="btn btn--primary"
              disabled={!canComplete || complete.isPending}
            >
              {complete.isPending ? <Spinner /> : <ClipboardCheck size={15} aria-hidden="true" />}
              {complete.isPending ? 'Saving notes…' : 'Complete visit'}
            </button>
          </>
        }
      >
        {completeTarget ? (
          <form
            id="complete-visit-form"
            className="form-stack"
            onSubmit={submitComplete}
          >
            <p className="quiet">
              {formatDateMedium(completeTarget.date)} ·{' '}
              {formatTimeRange(completeTarget.startTime, completeTarget.endTime)}
            </p>
            <Field id="visit-diagnosis" label="Diagnosis">
              <input
                id="visit-diagnosis"
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                placeholder="What did the visit find?"
                required
              />
            </Field>
            <Field id="visit-prescription" label="Prescription">
              <textarea
                id="visit-prescription"
                value={prescription}
                onChange={(event) => setPrescription(event.target.value)}
                placeholder="Medicine, dose, and instructions."
                required
              />
            </Field>
            <Field
              id="visit-notes"
              label="Notes"
              hint="Optional. Anything the next visit should know."
            >
              <textarea
                id="visit-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes"
              />
            </Field>
            {complete.isError ? <InlineError error={complete.error} /> : null}
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
