import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import type { Appointment, Slot } from '../../api/contracts';
import {
  fetchSlots,
  queryKeys,
  rescheduleAppointment,
} from '../../api/queries';
import { conflictDatesForDoctor, sameDayDoctorConflict } from '../../lib/appointments';
import {
  formatDateLong,
  formatTime,
  maxBookingIso,
  todayIso,
  toClockPayload,
} from '../../lib/dates';

export function useRescheduleVisit({
  appointments,
  onNotice,
}: {
  appointments: Appointment[] | undefined;
  onNotice: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<Appointment | null>(null);
  const [date, setDate] = useState(todayIso());
  const [slot, setSlot] = useState<Slot | null>(null);

  const slotsQuery = useQuery({
    queryKey: queryKeys.slots(target?.doctorId ?? '', date),
    queryFn: ({ signal }) =>
      fetchSlots(target?.doctorId ?? '', date, signal),
    enabled: Boolean(target?.doctorId && date),
  });

  const reschedule = useMutation({
    mutationFn: (input: { appointment: Appointment; date: string; slot: Slot }) =>
      rescheduleAppointment({
        appointmentId: input.appointment.id,
        date: input.date,
        startTime: toClockPayload(input.slot.startTime),
      }),
    onSuccess: (_data, input) => {
      onNotice(
        `Moved the visit to ${formatDateLong(input.date)} at ${formatTime(
          input.slot.startTime,
        )}. The doctor will review the new time.`,
      );
      setTarget(null);
      setSlot(null);
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

  const conflict = target
    ? sameDayDoctorConflict(appointments, target.doctorId, date, target.id)
    : undefined;

  const conflictDates = useMemo(
    () =>
      target
        ? conflictDatesForDoctor(appointments, target.doctorId, target.id)
        : new Set<string>(),
    [appointments, target],
  );

  function open(appointment: Appointment) {
    const today = todayIso();
    const preferredDate =
      appointment.date >= today && appointment.date <= maxBookingIso()
        ? appointment.date
        : today;
    setTarget(appointment);
    setDate(preferredDate);
    setSlot(null);
    reschedule.reset();
  }

  function close() {
    if (reschedule.isPending) return;
    setTarget(null);
    setSlot(null);
    reschedule.reset();
  }

  function changeDate(nextDate: string) {
    setDate(nextDate);
    setSlot(null);
    reschedule.reset();
  }

  function changeSlot(nextSlot: Slot) {
    setSlot(nextSlot);
    reschedule.reset();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target || !slot) return;
    reschedule.mutate({ appointment: target, date, slot });
  }

  return {
    target,
    date,
    slot,
    slotsQuery,
    conflict,
    conflictDates,
    isPending: reschedule.isPending,
    error: reschedule.error,
    open,
    close,
    changeDate,
    changeSlot,
    submit,
  };
}
