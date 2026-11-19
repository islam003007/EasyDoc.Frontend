// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Appointment } from '../api/contracts';
import {
  conflictDatesForDoctor,
  isActiveAppointment,
  sameDayDoctorConflict,
} from './appointments';

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'a1',
    patientId: 'p1',
    doctorId: 'd1',
    date: '2026-11-23',
    startTime: '09:00',
    endTime: '09:30',
    status: 'Pending',
    ...overrides,
  };
}

describe('appointment conflict helpers', () => {
  it('treats pending, scheduled and completed as active', () => {
    expect(isActiveAppointment(appointment({ status: 'Pending' }))).toBe(true);
    expect(isActiveAppointment(appointment({ status: 'Scheduled' }))).toBe(true);
    expect(isActiveAppointment(appointment({ status: 'Completed' }))).toBe(true);
    expect(isActiveAppointment(appointment({ status: 'Canceled' }))).toBe(false);
    expect(isActiveAppointment(appointment({ status: 'Unknown' }))).toBe(false);
  });

  it('finds an active same-day appointment with the same doctor', () => {
    const found = sameDayDoctorConflict(
      [appointment()],
      'd1',
      '2026-11-23',
    );

    expect(found?.id).toBe('a1');
  });

  it('ignores canceled visits', () => {
    expect(
      sameDayDoctorConflict(
        [appointment({ status: 'Canceled' })],
        'd1',
        '2026-11-23',
      ),
    ).toBeUndefined();
  });

  it('ignores other doctors, dates and the excluded appointment', () => {
    const list = [
      appointment({ id: 'other-doctor', doctorId: 'd2' }),
      appointment({ id: 'other-date', date: '2026-11-24' }),
      appointment({ id: 'current' }),
    ];

    expect(
      sameDayDoctorConflict(list, 'd1', '2026-11-23', 'current'),
    ).toBeUndefined();
    expect(
      sameDayDoctorConflict(list, 'd2', '2026-11-23')?.id,
    ).toBe('other-doctor');
  });

  it('collects conflict dates for the doctor', () => {
    const dates = conflictDatesForDoctor(
      [
        appointment({ date: '2026-11-23' }),
        appointment({ date: '2026-11-24', status: 'Scheduled' }),
        appointment({ date: '2026-11-25', status: 'Canceled' }),
      ],
      'd1',
    );

    expect([...dates]).toEqual(['2026-11-23', '2026-11-24']);
  });
});
