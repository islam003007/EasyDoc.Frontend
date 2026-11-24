import {
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { bookingErrorMessage } from '../../lib/bookingErrors';
import {
  formatDateLong,
  formatDateMedium,
  formatTimeRange,
} from '../../lib/dates';
import { DateRail } from '../../ui/DateRail';
import { Spinner } from '../../ui/Loading';
import { SlotPicker } from '../../ui/SlotPicker';
import { Stamp } from '../../ui/Stamp';
import type { DoctorBooking } from './useDoctorBooking';

export function BookingPanel({
  booking,
  displayName,
}: {
  booking: DoctorBooking;
  displayName: string;
}) {
  return (
    <aside className="sheet booking-panel sticky-panel" aria-labelledby="booking-heading">
      <div className="booking-panel__head">
        <p className="sheet__kicker">Availability</p>
        <h2 id="booking-heading">Choose a time.</h2>
        <p>
          All times are local to the clinic. You’re requesting as{' '}
          <strong>{displayName}</strong>.
        </p>
      </div>

      <div className="booking-panel__body">
        <DateRail
          value={booking.selectedDate}
          onChange={booking.chooseDate}
          conflictDates={booking.conflictDates}
        />

        {booking.conflict ? (
          <div className="booking-block" role="status">
            <CalendarX2 size={17} aria-hidden="true" />
            <div>
              <strong>
                You already have a visit with this doctor on this day.
              </strong>
              <p>Open it from My visits, or choose another date.</p>
              <Link to="/patient/appointments" className="text-link">
                Open My visits
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : null}

        {booking.checkingConflict ? (
          <p className="booking-check" role="status">
            Checking your existing visits…
          </p>
        ) : null}

        {booking.conflictCheckFailed ? (
          <div className="booking-block" role="alert">
            <CalendarX2 size={17} aria-hidden="true" />
            <div>
              <strong>We couldn’t check your existing visits.</strong>
              <p>Try again before requesting a time.</p>
              <button
                type="button"
                className="text-link link-button"
                onClick={() => {
                  void booking.patientAppointments.refetch();
                }}
              >
                Check again
              </button>
            </div>
          </div>
        ) : null}

        {booking.success ? (
          <div className="request-slip" role="status">
            <Stamp tone="done">Request sent</Stamp>
            <h3>
              {formatDateLong(booking.success.date)} ·{' '}
              {formatTimeRange(
                booking.success.slot.startTime,
                booking.success.slot.endTime,
              )}
            </h3>
            <p>
              The doctor will confirm this request. You can cancel it from My
              visits.
            </p>
            <Link to="/patient/appointments" className="text-link">
              Go to My visits
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        ) : null}

        <SlotPicker
          date={booking.selectedDate}
          slots={booking.slotsQuery.data}
          isPending={booking.slotsQuery.isPending}
          isFetching={booking.slotsQuery.isFetching}
          error={booking.slotsQuery.isError ? booking.slotsQuery.error : undefined}
          onRetry={() => {
            void booking.slotsQuery.refetch();
          }}
          selected={booking.selectedSlot}
          onSelect={booking.chooseSlot}
          disabled={booking.booking.isPending || booking.bookingBlocked}
        />

        {booking.selectedSlot && !booking.bookingBlocked ? (
          <div className="hold-slip">
            <p className="hold-slip__label">Selected time</p>
            <p className="hold-slip__time">
              {formatDateMedium(booking.selectedDate)} ·{' '}
              {formatTimeRange(
                booking.selectedSlot.startTime,
                booking.selectedSlot.endTime,
              )}
            </p>
            <button
              type="button"
              className="btn btn--pink btn--block booking-request"
              onClick={booking.requestTime}
              disabled={booking.booking.isPending || booking.bookingBlocked}
            >
              {booking.booking.isPending ? (
                <Spinner />
              ) : (
                <CalendarCheck2 size={16} aria-hidden="true" />
              )}
              {booking.booking.isPending ? 'Sending request…' : 'Request this time'}
            </button>
            <p className="hold-slip__note">
              You can cancel this request from My visits.
            </p>
          </div>
        ) : null}

        {booking.booking.isError ? (
          <p className="form-error booking-panel__error" role="alert">
            {bookingErrorMessage(booking.booking.error)}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
