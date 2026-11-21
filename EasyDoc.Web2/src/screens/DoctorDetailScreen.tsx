import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Slot } from '../api/contracts';
import {
  createAppointment,
  fetchDoctor,
  fetchPatientAppointments,
  fetchSlots,
  queryKeys,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import {
  conflictDatesForDoctor,
  sameDayDoctorConflict,
} from '../lib/appointments';
import { bookingErrorMessage } from '../lib/bookingErrors';
import {
  formatDateLong,
  formatDateMedium,
  formatTimeRange,
  todayIso,
  toTimePayload,
} from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { DateRail } from '../ui/DateRail';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { SlotPicker } from '../ui/SlotPicker';
import { Stamp } from '../ui/Stamp';

interface BookingSuccess {
  date: string;
  slot: Slot;
}

export function DoctorDetailScreen() {
  const { doctorId = '' } = useParams();
  const { session } = useSession();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [success, setSuccess] = useState<BookingSuccess | null>(null);

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctor(doctorId),
    queryFn: ({ signal }) => fetchDoctor(doctorId, signal),
    enabled: Boolean(doctorId),
  });

  const slotsQuery = useQuery({
    queryKey: queryKeys.slots(doctorId, selectedDate),
    queryFn: ({ signal }) => fetchSlots(doctorId, selectedDate, signal),
    enabled: Boolean(doctorId),
  });

  const patientAppointments = useQuery({
    queryKey: queryKeys.patientAppointments,
    queryFn: ({ signal }) => fetchPatientAppointments(signal),
    enabled: Boolean(doctorId),
  });

  const conflict = sameDayDoctorConflict(
    patientAppointments.data,
    doctorId,
    selectedDate,
  );
  const conflictDates = useMemo(
    () => conflictDatesForDoctor(patientAppointments.data, doctorId),
    [patientAppointments.data, doctorId],
  );
  const checkingConflict = patientAppointments.isPending;
  const conflictCheckFailed = patientAppointments.isError;
  const bookingBlocked =
    Boolean(conflict) || checkingConflict || conflictCheckFailed;

  const booking = useMutation({
    mutationFn: (input: { date: string; slot: Slot }) =>
      createAppointment({
        doctorId,
        date: input.date,
        startTime: toTimePayload(input.slot.startTime),
      }),
    onSuccess: (_appointmentId, input) => {
      setSuccess({ date: input.date, slot: input.slot });
      setSelectedSlot(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.slots(doctorId, input.date),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.patientAppointments,
      });
    },
    onError: () => {
      void slotsQuery.refetch();
      void patientAppointments.refetch();
    },
  });

  const doctor = doctorQuery.data;

  useDocumentTitle(doctor ? doctor.personName : 'Doctor profile');

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccess(null);
    booking.reset();
  }

  return (
    <div className="page">
      <Link to="/patient" className="back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the directory
      </Link>

      {doctorQuery.isPending ? (
        <div className="stack" aria-busy="true" aria-label="Loading doctor">
          <div className="doctor-head">
            <Skeleton width="86px" height="86px" />
            <div className="stack--tight" style={{ flex: 1 }}>
              <Skeleton width="8rem" height="0.75rem" />
              <Skeleton width="min(24rem, 70%)" height="2.4rem" />
              <Skeleton width="min(34rem, 90%)" height="0.9rem" />
            </div>
          </div>
          <div className="split">
            <Skeleton height="18rem" />
            <Skeleton height="26rem" />
          </div>
        </div>
      ) : null}

      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="We couldn’t open this profile"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {doctor ? (
        <>
          <header className="doctor-head">
            <Monogram name={doctor.personName} size="xl" />
            <div className="doctor-head__copy">
              <p className="doctor-head__kicker">
                {doctor.department ?? 'Care team'}, {doctor.city ?? 'Egypt'}
              </p>
              <h1><bdi dir="auto">{doctor.personName}</bdi></h1>
              <p className="doctor-head__lead">
                {doctor.description ??
                  'A doctor in the EasyDoc network. Choose a date to see their open times.'}
              </p>
              <div className="doctor-facts">
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {doctor.clinicAddress ?? 'Clinic address not provided'}
                </span>
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {doctor.defaultAppointmentTimeInMinutes}-minute visits
                </span>
                <span>
                  <Stethoscope size={14} aria-hidden="true" />
                  {doctor.department ?? 'General care'}
                </span>
              </div>
            </div>
          </header>

          <div className="split split--booking">
            <div className="stack">
              <section className="sheet">
                <div className="sheet__head">
                  <div>
                    <p className="sheet__kicker">The practice</p>
                    <h2>Care, with a clear calendar.</h2>
                  </div>
                </div>
                <div className="sheet__body">
                  <p className="doctor-about">
                    {doctor.description ?? 'This doctor hasn’t added a biography yet.'}
                  </p>
                  <dl className="facts-grid">
                    <div>
                      <dt>Specialty</dt>
                      <dd>{doctor.department ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>City</dt>
                      <dd>{doctor.city ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Clinic address</dt>
                      <dd>{doctor.clinicAddress ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Visit length</dt>
                      <dd>{doctor.defaultAppointmentTimeInMinutes} minutes</dd>
                    </div>
                    {doctor.phoneNumber ? (
                      <div>
                        <dt>Clinic phone</dt>
                        <dd>
                          <a
                            className="phone-link"
                            href={`tel:${doctor.phoneNumber}`}
                            dir="ltr"
                          >
                            <Phone size={13} aria-hidden="true" />
                            {doctor.phoneNumber}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                    {doctor.email ? (
                      <div>
                        <dt>Email</dt>
                        <dd>
                          <a className="phone-link" href={`mailto:${doctor.email}`}>
                            <Mail size={13} aria-hidden="true" />
                            {doctor.email}
                          </a>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>
              </section>

              <section className="sheet">
                <div className="sheet__head">
                  <div>
                    <p className="sheet__kicker">Before you book</p>
                    <h2>Three small steps.</h2>
                  </div>
                </div>
                <div className="sheet__body">
                  <ol className="steps">
                    <li>
                      <span className="steps__number tnum">1</span>
                      <div>
                        <strong>Pick a date</strong>
                        <p>
                          Open days follow the doctor&rsquo;s weekly hours and any
                          changes to specific dates.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span className="steps__number tnum">2</span>
                      <div>
                        <strong>Pick a time</strong>
                        <p>
                          Only times that are still open appear for the day.
                        </p>
                      </div>
                    </li>
                    <li>
                      <span className="steps__number tnum">3</span>
                      <div>
                        <strong>Send the request</strong>
                        <p>
                          The doctor reviews every request before the visit is
                          confirmed.
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
              </section>
            </div>

            <aside className="sheet booking-panel sticky-panel" aria-labelledby="booking-heading">
              <div className="booking-panel__head">
                <p className="sheet__kicker">Availability</p>
                <h2 id="booking-heading">Choose a time.</h2>
                <p>
                  All times are local to the clinic. You’re requesting as{' '}
                  <strong>{session?.displayName}</strong>.
                </p>
              </div>

              <div className="booking-panel__body">
                <DateRail
                  value={selectedDate}
                  onChange={chooseDate}
                  conflictDates={conflictDates}
                />

                {conflict ? (
                  <div className="booking-block" role="status">
                    <CalendarX2 size={17} aria-hidden="true" />
                    <div>
                      <strong>
                        You already have a visit with this doctor on this day.
                      </strong>
                      <p>
                        Open it from My visits, or choose another date.
                      </p>
                      <Link to="/patient/appointments" className="text-link">
                        Open My visits
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                {checkingConflict ? (
                  <p className="booking-check" role="status">
                    Checking your existing visits…
                  </p>
                ) : null}

                {conflictCheckFailed ? (
                  <div className="booking-block" role="alert">
                    <CalendarX2 size={17} aria-hidden="true" />
                    <div>
                      <strong>We couldn’t check your existing visits.</strong>
                      <p>Try again before requesting a time.</p>
                      <button
                        type="button"
                        className="text-link link-button"
                        onClick={() => {
                          void patientAppointments.refetch();
                        }}
                      >
                        Check again
                      </button>
                    </div>
                  </div>
                ) : null}

                {success ? (
                  <div className="request-slip" role="status">
                    <Stamp tone="done">Request sent</Stamp>
                    <h3>
                      {formatDateLong(success.date)} ·{' '}
                      {formatTimeRange(success.slot.startTime, success.slot.endTime)}
                    </h3>
                    <p>
                      The doctor will confirm this request. You can cancel it
                      from My visits.
                    </p>
                    <Link to="/patient/appointments" className="text-link">
                      Go to My visits
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                ) : null}

                <SlotPicker
                  date={selectedDate}
                  slots={slotsQuery.data}
                  isPending={slotsQuery.isPending}
                  isFetching={slotsQuery.isFetching}
                  error={slotsQuery.isError ? slotsQuery.error : undefined}
                  onRetry={() => {
                    void slotsQuery.refetch();
                  }}
                  selected={selectedSlot}
                  onSelect={(slot) => {
                    setSelectedSlot(slot);
                    booking.reset();
                  }}
                  disabled={booking.isPending || bookingBlocked}
                />

                {selectedSlot && !bookingBlocked ? (
                  <div className="hold-slip">
                    <p className="hold-slip__label">Selected time</p>
                    <p className="hold-slip__time">
                      {formatDateMedium(selectedDate)} ·{' '}
                      {formatTimeRange(
                        selectedSlot.startTime,
                        selectedSlot.endTime,
                      )}
                    </p>
                    <button
                      type="button"
                      className="btn btn--pink btn--block"
                      style={{ marginTop: '0.65rem' }}
                      onClick={() =>
                        booking.mutate({ date: selectedDate, slot: selectedSlot })
                      }
                      disabled={booking.isPending || bookingBlocked}
                    >
                      {booking.isPending ? (
                        <Spinner />
                      ) : (
                        <CalendarCheck2 size={16} aria-hidden="true" />
                      )}
                      {booking.isPending ? 'Sending request…' : 'Request this time'}
                    </button>
                    <p className="hold-slip__note">
                      You can cancel this request from My visits.
                    </p>
                  </div>
                ) : null}

                {booking.isError ? (
                  <p className="form-error" role="alert" style={{ marginTop: '0.8rem' }}>
                    {bookingErrorMessage(booking.error)}
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
