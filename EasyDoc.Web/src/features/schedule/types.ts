import type { DoctorSchedule, ScheduleOverride } from '../../api/contracts';

export type ScheduleKind = 'schedule' | 'override';

export type DeleteTarget =
  | { kind: 'schedule'; schedule: DoctorSchedule }
  | { kind: 'override'; override: ScheduleOverride };

export type InvalidateScheduleData = (kind?: ScheduleKind) => void;

export type NoticeSetter = (message: string) => void;

export interface ScheduleStats {
  hours: string;
  days: number;
  futureOverrides: number;
}
