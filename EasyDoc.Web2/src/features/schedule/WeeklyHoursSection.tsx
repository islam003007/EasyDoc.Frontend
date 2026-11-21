import type { UseQueryResult } from '@tanstack/react-query';
import { Clock3, Pencil, Plus, Trash2 } from 'lucide-react';
import type { DoctorSchedule } from '../../api/contracts';
import { dayName, formatTimeRange } from '../../lib/dates';
import { WEEK } from '../../lib/schedule';
import { Skeleton } from '../../ui/Loading';

export function WeeklyHoursSection({
  schedules,
  weeklySchedules,
  onEdit,
  onDelete,
  onAddForDay,
}: {
  schedules: UseQueryResult<DoctorSchedule[], Error>;
  weeklySchedules: DoctorSchedule[];
  onEdit: (schedule: DoctorSchedule) => void;
  onDelete: (schedule: DoctorSchedule) => void;
  onAddForDay: (day: number) => void;
}) {
  return (
    <section className="sheet" aria-labelledby="weekly-heading">
      <div className="sheet__head">
        <div>
          <p className="sheet__kicker">Weekly rhythm</p>
          <h2 id="weekly-heading">Consulting hours.</h2>
        </div>
        <span className="mini-label tnum">
          {weeklySchedules.length}{' '}
          {weeklySchedules.length === 1 ? 'block' : 'blocks'}
        </span>
      </div>
      <div className="sheet__body">
        {schedules.isPending ? (
          <div className="week-list" aria-busy="true" aria-label="Loading schedule">
            {WEEK.map((day) => (
              <div key={day} className="week-day">
                <Skeleton width="4.5rem" height="1rem" />
                <Skeleton width="10rem" height="1.8rem" />
              </div>
            ))}
          </div>
        ) : (
          <div className="week-list">
            {WEEK.map((day) => {
              const daySchedules = weeklySchedules.filter(
                (schedule) => schedule.dayOfWeek === day,
              );
              return (
                <div key={day} className="week-day">
                  <div className="week-day__name">
                    <strong>{dayName(day)}</strong>
                  </div>
                  <div className="week-day__windows">
                    {daySchedules.length === 0 ? (
                      <span className="week-day__empty">Not consulting</span>
                    ) : (
                      daySchedules.map((schedule) => (
                        <span key={schedule.id} className="window">
                          <Clock3 size={12} aria-hidden="true" />
                          <span className="tnum">
                            {formatTimeRange(
                              schedule.startTime,
                              schedule.endTime,
                            )}
                          </span>
                          <button
                            type="button"
                            className="window__action"
                            aria-label={`Edit ${dayName(day)} hours`}
                            title="Edit this block"
                            onClick={() => onEdit(schedule)}
                          >
                            <Pencil size={11} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="window__action window__action--danger"
                            aria-label={`Remove ${dayName(day)} hours`}
                            title="Remove this block"
                            onClick={() => onDelete(schedule)}
                          >
                            <Trash2 size={11} aria-hidden="true" />
                          </button>
                        </span>
                      ))
                    )}
                    {daySchedules.length === 0 ? (
                      <button
                        type="button"
                        className="week-day__add"
                        onClick={() => onAddForDay(day)}
                      >
                        <Plus size={11} aria-hidden="true" />
                        Add hours
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
