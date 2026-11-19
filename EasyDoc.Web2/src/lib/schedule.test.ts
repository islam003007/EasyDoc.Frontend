import { describe, expect, it } from 'vitest';
import type { DoctorSchedule, ScheduleOverride } from '../api/contracts';
import {
  availableScheduleDays,
  takenOverrideDates,
  takenScheduleDays,
} from './schedule';

function schedule(dayOfWeek: number, id = `s-${dayOfWeek}`): DoctorSchedule {
  return { id, dayOfWeek, startTime: '09:00', endTime: '14:00' };
}

function override(date: string, id = `o-${date}`): ScheduleOverride {
  return { id, date, isAvailable: false };
}

describe('schedule duplicate helpers', () => {
  it('lists taken weekdays', () => {
    expect([...takenScheduleDays([schedule(1), schedule(3)])]).toEqual([1, 3]);
  });

  it('only offers days without a weekly window', () => {
    const days = availableScheduleDays([schedule(1), schedule(3)]);

    expect(days).not.toContain(1);
    expect(days).not.toContain(3);
    expect(days).toContain(2);
    expect(days).toHaveLength(5);
  });

  it('includes the edited window when excluding its own id', () => {
    const monday = schedule(1, 'monday');
    const days = availableScheduleDays([monday, schedule(2, 'tuesday')], monday.id);

    expect(days).toContain(1);
    expect(days).not.toContain(2);
  });

  it('lists taken override dates and supports excluding the edited one', () => {
    const list = [override('2026-11-23'), override('2026-11-24')];

    expect([...takenOverrideDates(list)]).toEqual([
      '2026-11-23',
      '2026-11-24',
    ]);
    expect([...takenOverrideDates(list, 'o-2026-11-23')]).toEqual([
      '2026-11-24',
    ]);
  });
});
