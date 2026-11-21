import type { UseQueryResult } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import type { ScheduleOverride } from '../../api/contracts';
import {
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatTimeRange,
  formatWeekdayShort,
} from '../../lib/dates';
import { Skeleton } from '../../ui/Loading';

export function OverridesSection({
  overrides,
  sortedOverrides,
  overrideCount,
  onEdit,
  onDelete,
}: {
  overrides: UseQueryResult<ScheduleOverride[], Error>;
  sortedOverrides: ScheduleOverride[];
  overrideCount: number;
  onEdit: (override: ScheduleOverride) => void;
  onDelete: (override: ScheduleOverride) => void;
}) {
  return (
    <section className="sheet" aria-labelledby="overrides-heading">
      <div className="sheet__head">
        <div>
          <p className="sheet__kicker">Exceptions</p>
          <h2 id="overrides-heading">Date overrides.</h2>
        </div>
        <span className="mini-label tnum">
          {overrideCount}{' '}
          {overrideCount === 1 ? 'override' : 'overrides'}
        </span>
      </div>
      <div className="sheet__body">
        {overrides.isPending ? (
          <div className="stack" aria-busy="true">
            <Skeleton height="3rem" />
            <Skeleton height="3rem" />
          </div>
        ) : null}

        {overrides.isSuccess && sortedOverrides.length === 0 ? (
          <p className="quiet">
            No date overrides. Your weekly hours apply every week until you add
            one.
          </p>
        ) : null}

        {sortedOverrides.length > 0 ? (
          <div className="override-list">
            {sortedOverrides.map((override) => (
              <article key={override.id} className="override-row">
                <div className="override-row__date">
                  <span>{formatWeekdayShort(override.date)}</span>
                  <strong className="tnum">{formatDayNumber(override.date)}</strong>
                  <span>{formatMonthShort(override.date)}</span>
                </div>
                <div className="override-row__copy">
                  <strong>
                    {override.isAvailable ? 'Extra hours' : 'Closed all day'}
                  </strong>
                  <p>
                    {override.isAvailable &&
                    override.startTime &&
                    override.endTime
                      ? `${formatTimeRange(override.startTime, override.endTime)} on ${formatDateLong(override.date)}`
                      : formatDateLong(override.date)}
                  </p>
                </div>
                <div className="override-row__actions">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => onEdit(override)}
                  >
                    <Pencil size={13} aria-hidden="true" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => onDelete(override)}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
