import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Slot } from '../../api/contracts';
import {
  createAppointment,
  fetchDoctor,
  fetchPatientAppointments,
  fetchSlots,
  queryKeys,
} from '../../api/queries';
import { conflictDatesForDoctor, sameDayDoctorConflict } from '../../lib/appointments';
import { todayIso, toTimePayload } from '../../lib/dates';

interface BookingSuccess {
  date: string;
  slot: Slot;
}

export function useDoctorBooking() {
  const { doctorId = '' } = useParams();
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

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSuccess(null);
    booking.reset();
  }

  function chooseSlot(slot: Slot) {
    setSelectedSlot(slot);
    booking.reset();
  }

  function requestTime() {
    if (!selectedSlot || bookingBlocked) return;
    booking.mutate({ date: selectedDate, slot: selectedSlot });
  }

  return {
    doctorQuery,
    slotsQuery,
    patientAppointments,
    doctor: doctorQuery.data,
    selectedDate,
    selectedSlot,
    success,
    conflict,
    conflictDates,
    checkingConflict,
    conflictCheckFailed,
    bookingBlocked,
    booking,
    chooseDate,
    chooseSlot,
    requestTime,
  };
}

export type DoctorBooking = ReturnType<typeof useDoctorBooking>;
