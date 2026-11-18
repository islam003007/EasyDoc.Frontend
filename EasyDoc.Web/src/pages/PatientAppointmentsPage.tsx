import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  ClipboardList,
  FileText,
  MapPin,
  Phone,
  Stethoscope,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../api/client';
import type { Appointment, DoctorDetail, Slot } from '../api/contracts';
import {
  cancelPatientAppointment,
  fetchDoctor,
  fetchPatientAppointments,
  fetchSlots,
  queryKeys,
  rescheduleAppointment,
} from '../api/queries';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DateRail } from '../components/DateRail';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Skeleton, Spinner } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Monogram } from '../components/Monogram';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatGrid } from '../components/StatGrid';
import { StatusPill } from '../components/StatusPill';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDateLong,
  formatDateMedium,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  formatTimeRange,
  formatWeekdayShort,
  isSlotPast,
  isUpcomingAppointment,
  maxBookingIso,
  relativeDateLabel,
  slotPeriod,
  todayIso,
  toClockPayload,
} from '../lib/dates';
import { plural } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const PERIODS = ['Morning', 'Afternoon', 'Evening'] as const;

interface AppointmentCardProps {
  appointment: Appointment;
  doctor?: DoctorDetail;
  onCancel: () => void;
  onView: () => void;
  onReschedule: () => void;
}

function AppointmentCard({
  appointment,
  doctor,
  onCancel,
  onView,
  onReschedule,
}: AppointmentCardProps) {
  const canChange =
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
          {doctor?.personName ?? appointment.doctorName ?? 'Your doctor'}
        </h3>
        <p className="visit-card__sub">
          <Stethoscope size={14} aria-hidden="true" />
          {doctor?.department ?? 'Care team'}
          <span aria-hidden="true">·</span>
          <MapPin size={14} aria-hidden="true" />
          {doctor?.city ?? 'Clinic'}
        </p>

        {appointment.examination ? (
          <p className="visit-card__hint">
            <FileText size={13} aria-hidden="true" />
            Visit notes are on record
          </p>
        ) : appointment.status === 'Completed' ? (
          <p className="visit-card__hint">
            <FileText size={13} aria-hidden="true" />
            No diagnosis or prescription was attached
          </p>
        ) : null}
      </div>

      <div className="visit-card__actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onView}
        >
          <FileText size={14} aria-hidden="true" />
          View visit
        </button>
        {canChange ? (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={onReschedule}
          >
            <CalendarClock size={14} aria-hidden="true" />
            Reschedule
          </button>
        ) : null}
        {canChange ? (
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
  const [detailTarget, setDetailTarget] = useState<Appointment | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(
    null,
  );
  const [rescheduleDate, setRescheduleDate] = useState(todayIso());
  const [rescheduleSlot, setRescheduleSlot] = useState<Slot | null>(null);
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

  const slotsQuery = useQuery({
    queryKey: queryKeys.slots(
      rescheduleTarget?.doctorId ?? '',
      rescheduleDate,
    ),
    queryFn: ({ signal }) =>
      fetchSlots(rescheduleTarget?.doctorId ?? '', rescheduleDate, signal),
    enabled: Boolean(rescheduleTarget?.doctorId && rescheduleDate),
  });

  const reschedule = useMutation({
    mutationFn: (input: {
      appointment: Appointment;
      date: string;
      slot: Slot;
    }) =>
      rescheduleAppointment({
        appointmentId: input.appointment.id,
        date: input.date,
        startTime: toClockPayload(input.slot.startTime),
      }),
    onSuccess: (_data, input) => {
      setNotice(
        `Moved the visit to ${formatDateLong(input.date)} at ${formatTime(input.slot.startTime)}. The doctor will review the new request.`,
      );
      setRescheduleTarget(null);
      setRescheduleSlot(null);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.patientAppointments,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.slots(input.appointment.doctorId, input.date),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.slots(input.appointment.doctorId, input.appointment.date),
      });
    },
  });

  const groupedSlots = useMemo(() => {
    const slots = (slotsQuery.data ?? []).filter(
      (slot) => !isSlotPast(rescheduleDate, slot.startTime),
    );
    return PERIODS.map((period) => ({
      period,
      slots: slots.filter((slot) => slotPeriod(slot.startTime) === period),
    })).filter((group) => group.slots.length > 0);
  }, [slotsQuery.data, rescheduleDate]);

  const availableSlots = groupedSlots.reduce(
    (total, group) => total + group.slots.length,
    0,
  );

  const detailDoctor = detailTarget
    ? doctorsById.get(detailTarget.doctorId)
    : undefined;
  const rescheduleDoctor = rescheduleTarget
    ? doctorsById.get(rescheduleTarget.doctorId)
    : undefined;
  const total = appointments.data?.length ?? 0;

  function openDetail(appointment: Appointment) {
    setDetailTarget(appointment);
  }

  function openReschedule(appointment: Appointment) {
    const today = todayIso();
    const preferredDate =
      appointment.date >= today && appointment.date <= maxBookingIso()
        ? appointment.date
        : today;
    setRescheduleTarget(appointment);
    setRescheduleDate(preferredDate);
    setRescheduleSlot(null);
    reschedule.reset();
  }

  function chooseRescheduleDate(date: string) {
    setRescheduleDate(date);
    setRescheduleSlot(null);
    reschedule.reset();
  }

  function submitReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rescheduleTarget || !rescheduleSlot) return;
    reschedule.mutate({
      appointment: rescheduleTarget,
      date: rescheduleDate,
      slot: rescheduleSlot,
    });
  }

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
        lead="Every request, confirmed visit, and completed note in one place. Open a visit to read its record, reschedule an open request, or cancel a pending time."
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
                note: 'Open a record to read the notes',
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
                    onView={() => openDetail(appointment)}
                    onReschedule={() => openReschedule(appointment)}
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
                    onView={() => openDetail(appointment)}
                    onReschedule={() => openReschedule(appointment)}
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

      <Modal
        open={Boolean(detailTarget)}
        title="Visit record."
        eyebrow="Appointment detail"
        onClose={() => setDetailTarget(null)}
        wide
        footer={
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setDetailTarget(null)}
          >
            Close
          </button>
        }
      >
        {detailTarget ? (
          <div className="visit-detail">
            <div className="visit-detail__identity">
              <Monogram
                name={detailDoctor?.personName ?? detailTarget.doctorName ?? 'Doctor'}
                size="md"
              />
              <div>
                <p className="mono-label">
                  {formatDateLong(detailTarget.date)} ·{' '}
                  {formatTimeRange(detailTarget.startTime, detailTarget.endTime)}
                </p>
                <h3>
                  {detailDoctor?.personName ??
                    detailTarget.doctorName ??
                    'Your doctor'}
                </h3>
                <p>
                  {detailDoctor?.department ?? 'Care team'}
                  {detailDoctor?.city ? ` · ${detailDoctor.city}` : ''}
                </p>
              </div>
              <StatusPill status={detailTarget.status} />
            </div>

            <dl className="visit-detail__facts">
              <div>
                <dt>Date</dt>
                <dd>{formatDateMedium(detailTarget.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  {formatTimeRange(
                    detailTarget.startTime,
                    detailTarget.endTime,
                  )}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{detailTarget.status}</dd>
              </div>
              <div>
                <dt>Clinic</dt>
                <dd>{detailDoctor?.clinicAddress ?? 'Address on file'}</dd>
              </div>
              {detailDoctor ? (
                <div>
                  <dt>Visit length</dt>
                  <dd>{detailDoctor.defaultAppointmentTimeInMinutes} minutes</dd>
                </div>
              ) : null}
              <div>
                <dt>Doctor</dt>
                <dd>
                  {detailDoctor?.personName ?? 'Care team'}
                  {detailDoctor?.phoneNumber ? (
                    <a
                      className="text-link visit-detail__phone"
                      href={`tel:${detailDoctor.phoneNumber}`}
                      dir="ltr"
                    >
                      <Phone size={13} aria-hidden="true" />
                      {detailDoctor.phoneNumber}
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>

            <section className="visit-detail__record" aria-labelledby="visit-record-heading">
              <div className="visit-detail__record-head">
                <div>
                  <p className="eyebrow">Examination</p>
                  <h3 id="visit-record-heading">What the visit found.</h3>
                </div>
                <span className="mono-label">
                  {detailTarget.status === 'Canceled'
                    ? 'Canceled'
                    : detailTarget.status === 'Completed'
                      ? 'Saved'
                      : 'Not completed yet'}
                </span>
              </div>

              {detailTarget.examination ? (
                <div className="exam-grid">
                  <div className="exam-block">
                    <p className="mono-label">Diagnosis</p>
                    <p>{detailTarget.examination.diagnosis ?? '—'}</p>
                  </div>
                  <div className="exam-block">
                    <p className="mono-label">Prescription</p>
                    <p>{detailTarget.examination.prescription ?? '—'}</p>
                  </div>
                  <div className="exam-block exam-block--wide">
                    <p className="mono-label">Notes</p>
                    <p>{detailTarget.examination.notes ?? 'No notes were added.'}</p>
                  </div>
                </div>
              ) : (
                <p className="visit-detail__empty">
                  {detailTarget.status === 'Canceled'
                    ? 'This visit was canceled. No diagnosis, prescription, or notes were recorded.'
                    : detailTarget.status === 'Completed'
                      ? 'This visit was completed without diagnosis, prescription, or notes on file.'
                      : 'Diagnosis, prescription, and notes appear here once the visit is completed.'}
                </p>
              )}
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(rescheduleTarget)}
        title="Move the visit."
        eyebrow="Reschedule"
        description="Choose one of the doctor’s open times. Saving returns the visit to pending so the doctor can review the new request."
        onClose={() => {
          if (!reschedule.isPending) {
            setRescheduleTarget(null);
            setRescheduleSlot(null);
            reschedule.reset();
          }
        }}
        wide
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setRescheduleTarget(null);
                setRescheduleSlot(null);
                reschedule.reset();
              }}
              disabled={reschedule.isPending}
            >
              Keep current time
            </button>
            <button
              type="submit"
              form="reschedule-visit-form"
              className="btn btn--primary"
              disabled={reschedule.isPending || !rescheduleSlot}
            >
              {reschedule.isPending ? <Spinner /> : <CalendarClock size={16} aria-hidden="true" />}
              {reschedule.isPending ? 'Moving visit…' : 'Confirm new time'}
            </button>
          </>
        }
      >
        {rescheduleTarget ? (
          <form
            id="reschedule-visit-form"
            className="reschedule-form"
            onSubmit={submitReschedule}
          >
            <div className="reschedule-summary">
              <div>
                <p className="mono-label">Current appointment</p>
                <strong>
                  {formatDateMedium(rescheduleTarget.date)} ·{' '}
                  {formatTimeRange(
                    rescheduleTarget.startTime,
                    rescheduleTarget.endTime,
                  )}
                </strong>
                <p>
                  {rescheduleDoctor?.personName ??
                    rescheduleTarget.doctorName ??
                    'Your doctor'}
                  {rescheduleDoctor?.department
                    ? ` · ${rescheduleDoctor.department}`
                    : ''}
                </p>
              </div>
              <StatusPill status={rescheduleTarget.status} />
            </div>

            <DateRail value={rescheduleDate} onChange={chooseRescheduleDate} />

            <div className="slots-head">
              <div>
                <p className="mono-label">{formatDateLong(rescheduleDate)}</p>
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
                          rescheduleSlot?.startTime === slot.startTime;
                        return (
                          <button
                            key={`${slot.startTime}-${slot.endTime}`}
                            type="button"
                            className={`slot ${selected ? 'is-selected' : ''}`.trim()}
                            onClick={() => {
                              setRescheduleSlot(slot);
                              reschedule.reset();
                            }}
                            disabled={reschedule.isPending}
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

            {rescheduleSlot ? (
              <div className="booking-confirm">
                <div>
                  <p className="mono-label">New time</p>
                  <strong>
                    {formatDateMedium(rescheduleDate)} ·{' '}
                    {formatTimeRange(
                      rescheduleSlot.startTime,
                      rescheduleSlot.endTime,
                    )}
                  </strong>
                </div>
                <p className="booking-confirm__note">
                  The request returns to the doctor’s pending queue. You can still
                  cancel with the patient cancel action.
                </p>
              </div>
            ) : null}

            {reschedule.isError ? (
              <p className="form-error" role="alert">
                {describeError(reschedule.error)}
              </p>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
