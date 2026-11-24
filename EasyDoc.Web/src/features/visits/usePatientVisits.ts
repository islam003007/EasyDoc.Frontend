import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { DoctorDetail } from '../../api/contracts';
import {
  fetchDoctor,
  fetchPatientAppointments,
  queryKeys,
} from '../../api/queries';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  isUpcomingAppointment,
} from '../../lib/dates';

export function usePatientVisits() {
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

  const summary = useMemo(() => {
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
      total: all.length,
    };
  }, [appointments.data]);

  return { appointments, doctorsById, ...summary };
}
