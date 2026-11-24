import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { Appointment } from '../../api/contracts';
import {
  acceptAppointment,
  cancelDoctorAppointment,
  completeAppointment,
  fetchDoctorAppointments,
  queryKeys,
} from '../../api/queries';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDateMedium,
  formatTimeRange,
  relativeDateLabel,
} from '../../lib/dates';

export type BoardFilter = 'all' | 'pending' | 'scheduled' | 'closed';

const RANK: Record<Appointment['status'], number> = {
  Pending: 0,
  Scheduled: 1,
  Unknown: 2,
  Completed: 3,
  Canceled: 4,
};

export function useDoctorBoard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<BoardFilter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [declineTarget, setDeclineTarget] = useState<Appointment | null>(null);
  const [completeTarget, setCompleteTarget] = useState<Appointment | null>(null);

  const appointments = useQuery({
    queryKey: queryKeys.doctorAppointments,
    queryFn: ({ signal }) => fetchDoctorAppointments(signal),
  });

  function invalidateBoard() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.doctorAppointments });
  }

  const accept = useMutation({
    mutationFn: (appointment: Appointment) => acceptAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setNotice(
        `Accepted the ${relativeDateLabel(appointment.date)} request at ${formatTimeRange(
          appointment.startTime,
          appointment.endTime,
        )}.`,
      );
      invalidateBoard();
    },
  });

  const decline = useMutation({
    mutationFn: (appointment: Appointment) =>
      cancelDoctorAppointment(appointment.id),
    onSuccess: (_data, appointment) => {
      setDeclineTarget(null);
      setNotice(
        `Declined the ${relativeDateLabel(appointment.date)} request at ${formatTimeRange(
          appointment.startTime,
          appointment.endTime,
        )}.`,
      );
      invalidateBoard();
    },
  });

  const complete = useMutation({
    mutationFn: async (input: {
      appointment: Appointment;
      diagnosis: string;
      prescription: string;
      notes: string;
    }) => {
      await completeAppointment({
        appointmentId: input.appointment.id,
        diagnosis: input.diagnosis,
        prescription: input.prescription,
        notes: input.notes,
      });
    },
    onSuccess: (_data, input) => {
      setCompleteTarget(null);
      setNotice(`Visit notes saved for ${formatDateMedium(input.appointment.date)}.`);
      invalidateBoard();
    },
  });

  const all = appointments.data ?? [];

  const counts = useMemo(
    () => ({
      all: all.length,
      pending: all.filter((appointment) => appointment.status === 'Pending').length,
      scheduled: all.filter(
        (appointment) => appointment.status === 'Scheduled',
      ).length,
      closed: all.filter(
        (appointment) =>
          appointment.status === 'Completed' ||
          appointment.status === 'Canceled' ||
          appointment.status === 'Unknown',
      ).length,
      completed: all.filter(
        (appointment) => appointment.status === 'Completed',
      ).length,
    }),
    [all],
  );

  const filtered = useMemo(() => {
    const list = all.filter((appointment) => {
      if (filter === 'pending') return appointment.status === 'Pending';
      if (filter === 'scheduled') return appointment.status === 'Scheduled';
      if (filter === 'closed') {
        return (
          appointment.status === 'Completed' ||
          appointment.status === 'Canceled' ||
          appointment.status === 'Unknown'
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      const rank = RANK[a.status] - RANK[b.status];
      if (rank !== 0) return rank;
      if (a.status === 'Completed' || a.status === 'Canceled') {
        return compareAppointmentsDesc(a, b);
      }
      return compareAppointmentsAsc(a, b);
    });
  }, [all, filter]);

  const actionError = accept.error ?? decline.error;

  function openDecline(appointment: Appointment) {
    decline.reset();
    setDeclineTarget(appointment);
  }

  function closeDecline() {
    setDeclineTarget(null);
    decline.reset();
  }

  function openComplete(appointment: Appointment) {
    complete.reset();
    setCompleteTarget(appointment);
  }

  function closeComplete() {
    setCompleteTarget(null);
    complete.reset();
  }

  function clearActionError() {
    accept.reset();
    decline.reset();
  }

  return {
    appointments,
    filter,
    setFilter,
    notice,
    setNotice,
    counts,
    filtered,
    isEmpty: all.length === 0,
    accept,
    decline,
    complete,
    declineTarget,
    completeTarget,
    actionError,
    openDecline,
    closeDecline,
    openComplete,
    closeComplete,
    clearActionError,
  };
}
