import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarX2,
  CheckCircle2,
  Clock3,
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
  fetchSlots,
  queryKeys,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import { DateRail } from '../components/DateRail';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Spinner, Skeleton } from '../components/Loading';
import { Monogram } from '../components/Monogram';
import {
  formatDateLong,
  formatDateMedium,
  formatTime,
  formatTimeRange,
  isSlotPast,
  slotPeriod,
  toTimePayload,
  todayIso,
} from '../lib/dates';
import { shortId } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

interface BookingSuccess {
  date: string;
  slot: Slot;
  appointmentId?: string;
}

const PERIODS = ['Morning', 'Afternoon', 'Evening'] as const;

export function DoctorDetailPage() {
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

  const booking = useMutation({
    mutationFn: (input: { date: string; slot: Slot }) =>
      createAppointment({
        doctorId,
        date: input.date,
        startTime: toTimePayload(input.slot.startTime),
      }),
    onSuccess: (appointmentId, input) => {
      setSuccess({ date: input.date, slot: input.slot, appointmentId });
      setSelectedSlot(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.slots(doctorId, input.date),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.patientAppointments,
      });
    },
  });

  const doctor = doctorQuery.data;

  const groupedSlots = useMemo(() => {
    const slots = (slotsQuery.data ?? []).filter(
      (slot) => !isSlotPast(selectedDate, slot.startTime),
    );
    return PERIODS.map((period) => ({
      period,
      slots: slots.filter((slot) => slotPeriod(slot.startTime) === period),
    })).filter((group) => group.slots.length > 0);
  }, [slotsQuery.data, selectedDate]);

  const availableSlots = groupedSlots.reduce(
    (total, group) => total + group.slots.length,
    0,
  );

  useDocumentTitle(doctor ? doctor.personName : 'Doctor profile');

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccess(null);
    booking.reset();
  }

  return (
    <div className="page page--doctor-detail">
      <Link to="/patient" className="back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the directory
      </Link>

      {doctorQuery.isPending ? (
        <div className="detail-skeleton" aria-busy="true" aria-label="Loading doctor">
          <div className="detail-skeleton__head">
            <Skeleton width="6.5rem" height="6.5rem" className="skeleton--round" />
            <div>
              <Skeleton width="8rem" height="0.8rem" />
              <Skeleton width="19rem" height="2.6rem" />
              <Skeleton width="24rem" height="1rem" />
            </div>
          </div>
          <div className="detail-skeleton__body">
            <Skeleton width="100%" height="12rem" />
            <Skeleton width="100%" height="20rem" />
          </div>
        </div>
      ) : null}

      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="This doctor’s profile could not be opened"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {doctor ? (
        <>
          <header className="doctor-hero">
            <Monogram name={doctor.personName} size="xl" />
            <div className="doctor-hero__copy">
              <p className="eyebrow">
                <span className="eyebrow__index">02</span>
                {doctor.department ?? 'Care team'} · {doctor.city ?? 'Egypt'}
              </p>
              <h1>{doctor.personName}</h1>
              <p className="doctor-hero__lead">
                {doctor.description ??
                  'A member of the EasyDoc care network. Choose a date to see the open times held for this practice.'}
              </p>
              <div className="doctor-hero__facts">
                <span>
                  <MapPin size={14} aria-hidden="true" />
                  {doctor.clinicAddress ?? 'Clinic address on file'}
                </span>
                <span>
                  <Clock3 size={14} aria-hidden="true" />
                  {doctor.defaultAppointmentTimeInMinutes} minute visits
                </span>
                <span>
                  <Stethoscope size={14} aria-hidden="true" />
                  {doctor.department ?? 'General care'}
                </span>
              </div>
            </div>
          </header>

          <div className="detail-layout">
            <div className="detail-main">
              <section className="paper-section">
                <p className="eyebrow">About this practice</p>
                <h2>Care, with a clear calendar.</h2>
                <p>{doctor.description ?? 'No biography has been added yet.'}</p>
                <dl className="practice-list">
                  <div>
                    <dt>Specialty</dt>
                    <dd>{doctor.department ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>City</dt>
                    <dd>{doctor.city ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Clinic</dt>
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
                          className="text-link"
                          href={`tel:${doctor.phoneNumber}`}
                        >
                          <Phone size={14} aria-hidden="true" />
                          {doctor.phoneNumber}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </section>

              <section className="paper-section">
                <p className="eyebrow">How booking works</p>
                <h2>Three small steps.</h2>
                <ol className="how-list">
                  <li>
                    <span>01</span>
                    <div>
                      <strong>Pick a date</strong>
                      <p>Open days come from the doctor’s weekly schedule and date overrides.</p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <strong>Hold a slot</strong>
                      <p>Only genuinely unbooked times are offered by the availability query.</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <strong>Send the request</strong>
                      <p>The booking is created transactionally, then reviewed by the doctor.</p>
                    </div>
                  </li>
                </ol>
              </section>
            </div>

            <aside className="booking-panel" aria-labelledby="booking-heading">
              <div className="booking-panel__head">
                <p className="eyebrow">
                  <span className="eyebrow__index">03</span>
                  Availability
                </p>
                <h2 id="booking-heading">Choose a time.</h2>
                <p>
                  All times are clinic-local. You are booking as{' '}
                  <strong>{session?.displayName}</strong>.
                </p>
              </div>

              <DateRail value={selectedDate} onChange={chooseDate} />

              {success ? (
                <div className="booking-success" role="status">
                  <CheckCircle2 size={22} aria-hidden="true" />
                  <div>
                    <p className="mono-label">Request sent</p>
                    <h3>
                      {formatDateLong(success.date)} ·{' '}
                      {formatTimeRange(success.slot.startTime, success.slot.endTime)}
                    </h3>
                    <p>
                      Status is <strong>pending</strong> until the doctor accepts.
                      {success.appointmentId ? (
                        <> Reference {shortId(success.appointmentId)}.</>
                      ) : null}
                    </p>
                    <Link to="/patient/appointments" className="text-link">
                      View my visits
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="slots-head">
                <div>
                  <p className="mono-label">{formatDateLong(selectedDate)}</p>
                  <p className="slots-head__count">
                    {slotsQuery.isPending
                      ? 'Checking the calendar…'
                      : `${availableSlots} ${availableSlots === 1 ? 'open time' : 'open times'}`}
                  </p>
                </div>
                {slotsQuery.isFetching && !slotsQuery.isPending ? <Spinner /> : null}
              </div>

              {slotsQuery.isError ? (
                <ErrorPanel
                  error={slotsQuery.error}
                  title="Availability did not load"
                  onRetry={() => {
                    void slotsQuery.refetch();
                  }}
                  compact
                />
              ) : null}

              {slotsQuery.isPending ? (
                <div className="slot-grid" aria-busy="true" aria-label="Loading times">
                  {Array.from({ length: 6 }, (_, index) => (
                    <Skeleton key={index} height="3.2rem" />
                  ))}
                </div>
              ) : null}

              {slotsQuery.isSuccess && availableSlots === 0 ? (
                <EmptyState
                  icon={<CalendarX2 />}
                  title="No open times on this date"
                  description="Try another day from the rail above. Empty days can mean a day off, an override, or a fully booked calendar."
                />
              ) : null}

              {slotsQuery.isSuccess && availableSlots > 0 ? (
                <div className="slot-periods">
                  {groupedSlots.map((group) => (
                    <section key={group.period} className="slot-period">
                      <h3>{group.period}</h3>
                      <div className="slot-grid">
                        {group.slots.map((slot) => {
                          const selected =
                            selectedSlot?.startTime === slot.startTime;
                          return (
                            <button
                              key={`${slot.startTime}-${slot.endTime}`}
                              type="button"
                              className={`slot ${selected ? 'is-selected' : ''}`.trim()}
                              onClick={() => {
                                setSelectedSlot(slot);
                                booking.reset();
                              }}
                              disabled={booking.isPending}
                              aria-pressed={selected}
                              title={`${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}`}
                            >
                              <strong>{formatTime(slot.startTime)}</strong>
                              <span>{formatTime(slot.endTime)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}

              {selectedSlot ? (
                <div className="booking-confirm">
                  <div>
                    <p className="mono-label">Selected</p>
                    <strong>
                      {formatDateMedium(selectedDate)} ·{' '}
                      {formatTimeRange(selectedSlot.startTime, selectedSlot.endTime)}
                    </strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary btn--block"
                    onClick={() =>
                      booking.mutate({ date: selectedDate, slot: selectedSlot })
                    }
                    disabled={booking.isPending}
                  >
                    {booking.isPending ? <Spinner /> : <CalendarCheck2 size={16} aria-hidden="true" />}
                    {booking.isPending ? 'Sending request…' : 'Request this time'}
                  </button>
                  <p className="booking-confirm__note">
                    You can cancel while the request is pending or scheduled.
                  </p>
                </div>
              ) : null}

              {booking.isError ? (
                <ErrorPanel
                  error={booking.error}
                  title="The booking was not created"
                  compact
                />
              ) : null}
            </aside>
          </div>
        </>
      ) : null}
    </div>
  );
}
