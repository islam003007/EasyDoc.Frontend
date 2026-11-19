import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarX2,
  ClipboardList,
  Phone,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { Appointment, DoctorDetail, Slot } from '../api/contracts';
import {
  cancelPatientAppointment,
  fetchDoctor,
  fetchPatientAppointments,
  fetchSlots,
  queryKeys,
  rescheduleAppointment,
} from '../api/queries';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDateLong,
  formatDateMedium,
  formatTime,
  formatTimeRange,
  isUpcomingAppointment,
  maxBookingIso,
  relativeDateLabel,
  todayIso,
  toClockPayload,
} from '../lib/dates';
import { conflictDatesForDoctor, sameDayDoctorConflict } from '../lib/appointments';
import { bookingErrorMessage } from '../lib/bookingErrors';
import { RecordBlock, VisitRow } from '../features/visits/VisitRow';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { DateRail } from '../ui/DateRail';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dialog } from '../ui/Dialog';
import { Empty } from '../ui/Empty';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { SlotPicker } from '../ui/SlotPicker';
import { Stamp, StatusStamp } from '../ui/Stamp';
import { StatStrip } from '../ui/StatStrip';

export function PatientVisitsScreen() {
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
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchDoctor(doctorId, signal),
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
      pendingCount: all.filter((appointment) => appointment.status === 'Pending')
        .length,
      completedCount: all.filter(
        (appointment) => appointment.status === 'Completed',
      ).length,
    };
  }, [appointments.data]);

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

  const slotsQuery = useQuery({
    queryKey: queryKeys.slots(rescheduleTarget?.doctorId ?? '', rescheduleDate),
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
        `Moved the visit to ${formatDateLong(input.date)} at ${formatTime(
          input.slot.startTime,
        )}. It returns to the doctor's pending queue.`,
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
        queryKey: queryKeys.slots(
          input.appointment.doctorId,
          input.appointment.date,
        ),
      });
    },
    onError: () => {
      void slotsQuery.refetch();
    },
  });

  const detailDoctor = detailTarget
    ? doctorsById.get(detailTarget.doctorId)
    : undefined;
  const rescheduleDoctor = rescheduleTarget
    ? doctorsById.get(rescheduleTarget.doctorId)
    : undefined;
  const total = appointments.data?.length ?? 0;

  const rescheduleConflict = rescheduleTarget
    ? sameDayDoctorConflict(
        appointments.data,
        rescheduleTarget.doctorId,
        rescheduleDate,
        rescheduleTarget.id,
      )
    : undefined;

  const rescheduleConflictDates = useMemo(
    () =>
      rescheduleTarget
        ? conflictDatesForDoctor(
            appointments.data,
            rescheduleTarget.doctorId,
            rescheduleTarget.id,
          )
        : new Set<string>(),
    [appointments.data, rescheduleTarget],
  );

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
    <div className="page">
      <PageHeader
        title="My visits."
        lead="Every request, confirmed visit, and completed note in one place. Open a record to read it, move an open request, or cancel a time."
        actions={
          <Link to="/patient" className="btn btn--secondary">
            <CalendarCheck2 size={15} aria-hidden="true" />
            Book a visit
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
          title="Your visits could not be loaded"
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
                <Skeleton width="24%" height="1.6rem" style={{ marginTop: '0.4rem' }} />
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
                note: 'Pending or scheduled, still ahead',
              },
              {
                label: 'Awaiting review',
                value: pendingCount,
                note: 'A doctor has not accepted yet',
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
              <h2 id="upcoming-heading">On the calendar</h2>
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
              <h2 id="history-heading">Earlier and closed</h2>
              <span className="mini-label tnum">
                {history.length} {history.length === 1 ? 'visit' : 'visits'}
              </span>
            </div>

            {history.length === 0 && total === 0 ? (
              <Empty
                icon={<ClipboardList size={19} />}
                title="The record is empty."
                description="Your first booking will appear here with its live status and visit notes."
                action={
                  <Link to="/patient" className="btn btn--secondary">
                    Start with a search
                  </Link>
                }
              />
            ) : history.length === 0 ? (
              <p className="quiet">Nothing in the archive yet.</p>
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
              )} will return to the doctor's calendar. This cannot be undone.`
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

      <Dialog
        open={Boolean(detailTarget)}
        title="Visit record"
        kicker="Appointment detail"
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
          <div className="record">
            <div className="record__identity">
              <Monogram
                name={detailDoctor?.personName ?? detailTarget.doctorName ?? 'Doctor'}
                size="lg"
              />
              <div>
                <h3>
                  <bdi dir="auto">
                    {detailDoctor?.personName ??
                      detailTarget.doctorName ??
                      'Your doctor'}
                  </bdi>
                </h3>
                <p>
                  {detailDoctor?.department ?? 'Care team'}
                  {detailDoctor?.city ? `, ${detailDoctor.city}` : ''}
                </p>
              </div>
              <StatusStamp status={detailTarget.status} />
            </div>

            <dl className="facts-grid facts-grid--record">
              <div>
                <dt>Date</dt>
                <dd>{formatDateLong(detailTarget.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd className="tnum">
                  {formatTimeRange(detailTarget.startTime, detailTarget.endTime)}
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
              <div>
                <dt>Visit length</dt>
                <dd>
                  {detailDoctor
                    ? `${detailDoctor.defaultAppointmentTimeInMinutes} minutes`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>Doctor</dt>
                <dd>
                  {detailDoctor?.personName ?? appointmentDoctorFallback(detailTarget)}
                  {detailDoctor?.phoneNumber ? (
                    <a
                      className="phone-link"
                      href={`tel:${detailDoctor.phoneNumber}`}
                      dir="ltr"
                      style={{ marginTop: '0.2rem' }}
                    >
                      <Phone size={12} aria-hidden="true" />
                      {detailDoctor.phoneNumber}
                    </a>
                  ) : null}
                </dd>
              </div>
            </dl>

            <section className="record__section" aria-labelledby="patient-record-heading">
              <div className="section-line">
                <h3 id="patient-record-heading">What the visit found</h3>
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
              <RecordBlock appointment={detailTarget} />
            </section>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(rescheduleTarget)}
        title="Move the visit"
        kicker="Reschedule"
        description="Choose one of the doctor's open times. Saving returns the visit to pending so the doctor can review the new request."
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
              form="reschedule-form"
              className="btn btn--primary"
              disabled={
                reschedule.isPending ||
                !rescheduleSlot ||
                Boolean(rescheduleConflict)
              }
            >
              {reschedule.isPending ? (
                <Spinner />
              ) : (
                <CalendarClock size={15} aria-hidden="true" />
              )}
              {reschedule.isPending ? 'Moving visit…' : 'Confirm new time'}
            </button>
          </>
        }
      >
        {rescheduleTarget ? (
          <form id="reschedule-form" className="stack" onSubmit={submitReschedule}>
            <div className="reschedule-summary">
              <div>
                <p className="mini-label">Current appointment</p>
                <strong className="tnum">
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
                    ? `, ${rescheduleDoctor.department}`
                    : ''}
                </p>
              </div>
              <StatusStamp status={rescheduleTarget.status} />
            </div>

            <DateRail
              value={rescheduleDate}
              onChange={(date) => {
                setRescheduleDate(date);
                setRescheduleSlot(null);
                reschedule.reset();
              }}
              conflictDates={rescheduleConflictDates}
            />

            {rescheduleConflict ? (
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
              date={rescheduleDate}
              slots={slotsQuery.data}
              isPending={slotsQuery.isPending}
              isFetching={slotsQuery.isFetching}
              error={slotsQuery.isError ? slotsQuery.error : undefined}
              onRetry={() => {
                void slotsQuery.refetch();
              }}
              selected={rescheduleSlot}
              onSelect={(slot) => {
                setRescheduleSlot(slot);
                reschedule.reset();
              }}
              disabled={reschedule.isPending || Boolean(rescheduleConflict)}
            />

            {rescheduleSlot && !rescheduleConflict ? (
              <div className="hold-slip">
                <p className="hold-slip__label">New time</p>
                <p className="hold-slip__time tnum">
                  {formatDateMedium(rescheduleDate)} ·{' '}
                  {formatTimeRange(
                    rescheduleSlot.startTime,
                    rescheduleSlot.endTime,
                  )}
                </p>
                <p className="hold-slip__note">
                  The request returns to the doctor&rsquo;s pending queue. You
                  can still cancel from this page.
                </p>
              </div>
            ) : null}

            {reschedule.isError ? (
              <p className="form-error" role="alert">
                {bookingErrorMessage(reschedule.error)}
              </p>
            ) : null}
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}

function appointmentDoctorFallback(appointment: Appointment): string {
  return appointment.doctorName ?? 'Care team';
}
