import {
  CalendarClock,
  CalendarDays,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment } from '../api/contracts';
import { describeError } from '../api/client';
import { formatTimeRange, relativeDateLabel } from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { BoardRow } from '../features/board/BoardRow';
import { BoardVisitDialog } from '../features/board/BoardVisitDialog';
import { CompleteVisitDialog } from '../features/board/CompleteVisitDialog';
import { PatientHistoryDialog } from '../features/board/PatientHistoryDialog';
import { useDoctorBoard } from '../features/board/useDoctorBoard';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { Skeleton } from '../ui/Loading';
import { StatStrip } from '../ui/StatStrip';

export function DoctorBoardScreen() {
  useDocumentTitle('Practice board');
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Appointment | null>(null);

  const board = useDoctorBoard();
  const {
    appointments,
    filter,
    setFilter,
    notice,
    setNotice,
    counts,
    filtered,
    isEmpty,
    accept,
    decline,
    complete,
    declineTarget,
    completeTarget,
    actionError,
  } = board;

  function openComplete(appointment: Appointment) {
    setDetailTarget(null);
    board.openComplete(appointment);
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
        <Notice tone="error" onDismiss={board.clearActionError}>
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
                  onDecline={() => board.openDecline(appointment)}
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
        onClose={board.closeDecline}
      />

      <BoardVisitDialog
        appointment={detailTarget}
        onClose={() => setDetailTarget(null)}
        onComplete={openComplete}
      />

      <PatientHistoryDialog
        appointment={historyTarget}
        onClose={() => setHistoryTarget(null)}
      />

      <CompleteVisitDialog
        key={completeTarget?.id ?? 'closed'}
        target={completeTarget}
        pending={complete.isPending}
        error={complete.error}
        onClose={board.closeComplete}
        onSubmit={(input) => complete.mutate(input)}
      />
    </div>
  );
}
