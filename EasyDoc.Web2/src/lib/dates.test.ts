// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { addDays } from 'date-fns';
import type { Appointment } from '../api/contracts';
import {
  compareAppointmentsAsc,
  compareAppointmentsDesc,
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatTime,
  formatTimeRange,
  formatWeekdayShort,
  isSlotPast,
  isUpcomingAppointment,
  parseDateOnly,
  slotPeriod,
  timeSortKey,
  toClockPayload,
  toDateInputValue,
  toTimePayload,
  todayIso,
} from './dates';

function appointment(overrides: Partial<Appointment>): Appointment {
  return {
    id: 'a1',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-11-19',
    startTime: '09:00:00',
    endTime: '09:30:00',
    status: 'Pending',
    ...overrides,
  };
}

describe('date helpers', () => {
  it('parses date-only values without timezone drift', () => {
    const date = parseDateOnly('2026-11-19');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(10);
    expect(date.getDate()).toBe(19);
  });

  it('formats long, short and day labels', () => {
    expect(formatDateLong('2026-11-19')).toBe('Thursday, November 19');
    expect(formatWeekdayShort('2026-11-19')).toBe('Thu');
    expect(formatMonthShort('2026-11-19')).toBe('Nov');
    expect(formatDayNumber('2026-11-19')).toBe('19');
  });

  it('keeps an unknown value visible instead of throwing', () => {
    expect(formatDateLong('not-a-date')).toBe('not-a-date');
  });

  it('formats clock values and ranges', () => {
    expect(formatTime('09:05')).toBe('9:05 AM');
    expect(formatTime('13:20:00')).toBe('1:20 PM');
    expect(formatTime(undefined)).toBe('—');
    expect(formatTimeRange('09:00', '09:30')).toBe('9:00 AM – 9:30 AM');
  });

  it('normalises time payloads for the API', () => {
    expect(toTimePayload('9:05')).toBe('09:05:00');
    expect(toTimePayload('09:05:00')).toBe('09:05:00');
    expect(toClockPayload('09:05:00')).toBe('09:05');
    expect(toClockPayload('9:05')).toBe('09:05');
  });

  it('sorts times by minutes', () => {
    expect(timeSortKey('09:30')).toBe(570);
    expect(timeSortKey('13:00:00')).toBe(780);
  });

  it('assigns slots to the right period', () => {
    expect(slotPeriod('08:59')).toBe('Morning');
    expect(slotPeriod('12:00')).toBe('Afternoon');
    expect(slotPeriod('16:59')).toBe('Afternoon');
    expect(slotPeriod('17:00')).toBe('Evening');
  });

  it('rejects slots earlier than now and accepts tomorrow', () => {
    const yesterday = toDateInputValue(addDays(new Date(), -1));
    const tomorrow = toDateInputValue(addDays(new Date(), 1));
    expect(isSlotPast(yesterday, '23:59')).toBe(true);
    expect(isSlotPast(tomorrow, '09:00')).toBe(false);
  });

  it('only treats pending or scheduled future visits as upcoming', () => {
    const tomorrow = toDateInputValue(addDays(new Date(), 1));
    expect(isUpcomingAppointment(appointment({ date: tomorrow }))).toBe(true);
    expect(
      isUpcomingAppointment(appointment({ date: tomorrow, status: 'Canceled' })),
    ).toBe(false);
    const yesterday = toDateInputValue(addDays(new Date(), -1));
    expect(isUpcomingAppointment(appointment({ date: yesterday }))).toBe(false);
  });

  it('sorts appointments by date then time', () => {
    const later = appointment({ id: 'b', date: '2026-11-20', startTime: '09:00' });
    const earlier = appointment({ id: 'a', date: '2026-11-19', startTime: '10:00' });
    const sameDayEarly = appointment({ id: 'c', date: '2026-11-19', startTime: '08:00' });

    expect([later, earlier, sameDayEarly].sort(compareAppointmentsAsc).map((a) => a.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect([later, earlier, sameDayEarly].sort(compareAppointmentsDesc).map((a) => a.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
  });

  it('produces a local today value', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
