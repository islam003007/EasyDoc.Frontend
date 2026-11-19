import type { Appointment, AppointmentStatus } from '../api/contracts';

/** A canceled visit is not an existing booking; completed visits still count. */
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Pending',
  'Scheduled',
  'Completed',
];

export function isActiveAppointment(appointment: Appointment): boolean {
  return ACTIVE_APPOINTMENT_STATUSES.includes(appointment.status);
}

export function sameDayDoctorConflict(
  appointments: Appointment[] | undefined,
  doctorId: string,
  date: string,
  excludedAppointmentId?: string,
): Appointment | undefined {
  return appointments?.find(
    (appointment) =>
      appointment.doctorId === doctorId &&
      appointment.date === date &&
      appointment.id !== excludedAppointmentId &&
      isActiveAppointment(appointment),
  );
}

export function conflictDatesForDoctor(
  appointments: Appointment[] | undefined,
  doctorId: string,
  excludedAppointmentId?: string,
): Set<string> {
  return new Set(
    (appointments ?? [])
      .filter(
        (appointment) =>
          appointment.doctorId === doctorId &&
          appointment.id !== excludedAppointmentId &&
          isActiveAppointment(appointment),
      )
      .map((appointment) => appointment.date),
  );
}
