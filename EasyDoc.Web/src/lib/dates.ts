import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import type { Appointment } from '../api/contracts';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const MAX_BOOKING_DAYS = 30;

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (year && month && day) return new Date(year, month - 1, day);
  return parseISO(value);
}

export function isValidDate(value: string): boolean {
  return isValid(parseDateOnly(value));
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function maxBookingIso(): string {
  return format(addDays(new Date(), MAX_BOOKING_DAYS), 'yyyy-MM-dd');
}

export function toDateInputValue(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDateLong(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'EEEE, MMMM d') : value;
}

export function formatDateMedium(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'MMM d, yyyy') : value;
}

export function formatDateShort(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'MMM d') : value;
}

export function formatDayNumber(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'd') : '—';
}

export function formatMonthShort(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'MMM') : '—';
}

export function formatWeekdayShort(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'EEE') : '—';
}

export function formatWeekdayLong(value: string): string {
  const date = parseDateOnly(value);
  return isValid(date) ? format(date, 'EEEE') : value;
}

export function relativeDateLabel(value: string): string {
  const date = parseDateOnly(value);
  if (!isValid(date)) return value;
  const offset = differenceInCalendarDays(date, new Date());
  if (offset === 0) return 'Today';
  if (offset === 1) return 'Tomorrow';
  if (offset === -1) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export function dayName(dayOfWeek: number): string {
  return DAY_NAMES[dayOfWeek] ?? 'Unknown';
}

export function relativeDayOnly(value: string): string {
  const label = relativeDateLabel(value);
  const comma = label.indexOf(',');
  return comma >= 0 ? label.slice(0, comma) : label;
}

export function formatTime(value: string | undefined): string {
  if (!value) return '—';
  const [hoursPart, minutesPart] = value.split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return format(new Date(2000, 0, 1, hours, minutes), 'h:mm a');
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function toTimePayload(value: string): string {
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(':');
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  }
  return trimmed;
}

export function timeSortKey(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function isSlotPast(date: string, startTime: string): boolean {
  const [hours, minutes] = startTime.split(':').map(Number);
  const slot = parseDateOnly(date);
  slot.setHours(hours || 0, minutes || 0, 0, 0);
  return slot.getTime() <= Date.now();
}

export function appointmentMoment(appointment: Appointment): Date {
  const [hours, minutes] = appointment.startTime.split(':').map(Number);
  const date = parseDateOnly(appointment.date);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export function isUpcomingAppointment(appointment: Appointment): boolean {
  return (
    (appointment.status === 'Pending' || appointment.status === 'Scheduled') &&
    appointmentMoment(appointment).getTime() >= Date.now()
  );
}

export function compareAppointmentsAsc(a: Appointment, b: Appointment): number {
  const dateCompare = a.date.localeCompare(b.date);
  if (dateCompare !== 0) return dateCompare;
  return timeSortKey(a.startTime) - timeSortKey(b.startTime);
}

export function compareAppointmentsDesc(a: Appointment, b: Appointment): number {
  return compareAppointmentsAsc(b, a);
}

export function slotPeriod(startTime: string): 'Morning' | 'Afternoon' | 'Evening' {
  const hours = Number(startTime.split(':')[0]);
  if (hours < 12) return 'Morning';
  if (hours < 17) return 'Afternoon';
  return 'Evening';
}
