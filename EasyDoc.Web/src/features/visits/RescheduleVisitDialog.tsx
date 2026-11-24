import { CalendarClock, CalendarX2 } from 'lucide-react';
import type { DoctorDetail } from '../../api/contracts';
import { bookingErrorMessage } from '../../lib/bookingErrors';
import {
  formatDateMedium,
  formatTimeRange,
} from '../../lib/dates';
import { DateRail } from '../../ui/DateRail';
import { Dialog } from '../../ui/Dialog';
import { Spinner } from '../../ui/Loading';
import { SlotPicker } from '../../ui/SlotPicker';
import { StatusStamp } from '../../ui/Stamp';
import type { useRescheduleVisit } from './useRescheduleVisit';

export function RescheduleVisitDialog({
  visit,
  doctor,
}: {
  visit: ReturnType<typeof useRescheduleVisit>;
  doctor: DoctorDetail | undefined;
}) {
  const { target } = visit;

  return (
    <Dialog
      open={Boolean(target)}
      title="Move the visit"
      kicker="Reschedule"
      description="Choose one of the doctor's open times. The doctor will review the new time before it is confirmed."
      onClose={visit.close}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={visit.close}
            disabled={visit.isPending}
          >
            Keep current time
          </button>
          <button
            type="submit"
            form="reschedule-form"
            className="btn btn--primary"
            disabled={
              visit.isPending || !visit.slot || Boolean(visit.conflict)
            }
          >
            {visit.isPending ? (
              <Spinner />
            ) : (
              <CalendarClock size={15} aria-hidden="true" />
            )}
            {visit.isPending ? 'Moving visit…' : 'Confirm new time'}
          </button>
        </>
      }
    >
      {target ? (
        <form id="reschedule-form" className="stack" onSubmit={visit.submit}>
          <div className="reschedule-summary">
            <div>
              <p className="mini-label">Current visit</p>
              <strong className="tnum">
                {formatDateMedium(target.date)} ·{' '}
                {formatTimeRange(target.startTime, target.endTime)}
              </strong>
              <p>
                {doctor?.personName ?? target.doctorName ?? 'Your doctor'}
                {doctor?.department ? `, ${doctor.department}` : ''}
              </p>
            </div>
            <StatusStamp status={target.status} />
          </div>

          <DateRail
            value={visit.date}
            onChange={visit.changeDate}
            conflictDates={visit.conflictDates}
          />

          {visit.conflict ? (
            <div className="booking-block" role="status">
              <CalendarX2 size={17} aria-hidden="true" />
              <div>
                <strong>
                  You already have a visit with this doctor on this day.
                </strong>
                <p>Choose another date, or keep the current time.</p>
              </div>
            </div>
          ) : null}

          <SlotPicker
            date={visit.date}
            slots={visit.slotsQuery.data}
            isPending={visit.slotsQuery.isPending}
            isFetching={visit.slotsQuery.isFetching}
            error={visit.slotsQuery.isError ? visit.slotsQuery.error : undefined}
            onRetry={() => {
              void visit.slotsQuery.refetch();
            }}
            selected={visit.slot}
            onSelect={visit.changeSlot}
            disabled={visit.isPending || Boolean(visit.conflict)}
          />

          {visit.slot && !visit.conflict ? (
            <div className="hold-slip">
              <p className="hold-slip__label">New time</p>
              <p className="hold-slip__time tnum">
                {formatDateMedium(visit.date)} ·{' '}
                {formatTimeRange(visit.slot.startTime, visit.slot.endTime)}
              </p>
              <p className="hold-slip__note">
                The doctor will review the new time. You can cancel it from My
                visits if needed.
              </p>
            </div>
          ) : null}

          {visit.error ? (
            <p className="form-error" role="alert">
              {bookingErrorMessage(visit.error)}
            </p>
          ) : null}
        </form>
      ) : null}
    </Dialog>
  );
}
