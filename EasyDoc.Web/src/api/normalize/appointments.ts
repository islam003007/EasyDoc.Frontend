import type { Appointment, AppointmentStatus, Examination } from '../contracts';
import { isRecord, read, recordsIn, text } from './values';

export function normalizeAppointmentStatus(value: unknown): AppointmentStatus {
  if (typeof value === 'number') {
    return (
      (['Pending', 'Scheduled', 'Completed', 'Canceled'] as AppointmentStatus[])[
        value
      ] ?? 'Unknown'
    );
  }

  const normalized = text(value)?.toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'scheduled':
    case 'accepted':
      return 'Scheduled';
    case 'completed':
    case 'complete':
      return 'Completed';
    case 'canceled':
    case 'cancelled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

function normalizeExamination(value: unknown): Examination | null {
  if (!isRecord(value)) return null;
  const examination: Examination = {
    diagnosis: text(read(value, 'diagnosis')),
    prescription: text(read(value, 'prescription')),
    notes: text(read(value, 'notes')),
  };
  if (!examination.diagnosis && !examination.prescription && !examination.notes) {
    return null;
  }
  return examination;
}

export function normalizeAppointment(entry: unknown): Appointment | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'appointmentId'));
  const date = text(read(entry, 'date'));
  const startTime = text(read(entry, 'startTime'));
  if (!id || !date || !startTime) return null;

  return {
    id,
    patientId: text(read(entry, 'patientId')) ?? '',
    doctorId: text(read(entry, 'doctorId')) ?? '',
    date: date.slice(0, 10),
    startTime,
    endTime: text(read(entry, 'endTime')) ?? startTime,
    status: normalizeAppointmentStatus(read(entry, 'status')),
    examination: normalizeExamination(read(entry, 'examination')),
    patientName: text(read(entry, 'patientName')),
    doctorName: text(read(entry, 'doctorName')),
  };
}

export function normalizeAppointments(payload: unknown): Appointment[] {
  return recordsIn(payload, ['appointments'])
    .map(normalizeAppointment)
    .filter((entry): entry is Appointment => entry !== null);
}
