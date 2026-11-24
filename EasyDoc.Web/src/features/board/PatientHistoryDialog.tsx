import { useQuery } from '@tanstack/react-query';
import type { Appointment } from '../../api/contracts';
import { fetchPatientHistory, queryKeys } from '../../api/queries';
import {
  compareAppointmentsDesc,
  formatDateMedium,
  formatTimeRange,
} from '../../lib/dates';
import { Dialog } from '../../ui/Dialog';
import { ErrorPanel } from '../../ui/ErrorPanel';
import { Skeleton } from '../../ui/Loading';
import { StatusStamp } from '../../ui/Stamp';

export function PatientHistoryDialog({
  appointment,
  onClose,
}: {
  appointment: Appointment | null;
  onClose: () => void;
}) {
  const history = useQuery({
    queryKey: queryKeys.patientHistory(appointment?.patientId ?? ''),
    queryFn: ({ signal }) =>
      fetchPatientHistory(appointment?.patientId ?? '', signal),
    enabled: Boolean(appointment?.patientId),
    retry: false,
  });

  return (
    <Dialog
      open={Boolean(appointment)}
      title="Patient history"
      kicker={appointment?.patientName ?? 'Patient'}
      description="Every visit this patient has on record with your practice."
      onClose={onClose}
      wide
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
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
  );
}
