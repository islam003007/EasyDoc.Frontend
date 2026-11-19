import { CalendarX2 } from 'lucide-react';
import { useMemo } from 'react';
import type { Slot } from '../api/contracts';
import {
  formatDateLong,
  formatTime,
  isSlotPast,
  slotPeriod,
} from '../lib/dates';
import { ErrorPanel } from './ErrorPanel';
import { Skeleton, Spinner } from './Loading';

const PERIODS = ['Morning', 'Afternoon', 'Evening'] as const;

export function SlotPicker({
  date,
  slots,
  isPending,
  isFetching = false,
  error,
  onRetry,
  selected,
  onSelect,
  disabled = false,
}: {
  date: string;
  slots: Slot[] | undefined;
  isPending: boolean;
  isFetching?: boolean;
  error?: unknown;
  onRetry?: () => void;
  selected: Slot | null;
  onSelect: (slot: Slot) => void;
  disabled?: boolean;
}) {
  const grouped = useMemo(() => {
    const open = (slots ?? []).filter(
      (slot) => !isSlotPast(date, slot.startTime),
    );
    return PERIODS.map((period) => ({
      period,
      slots: open.filter((slot) => slotPeriod(slot.startTime) === period),
    })).filter((group) => group.slots.length > 0);
  }, [slots, date]);

  const count = grouped.reduce((total, group) => total + group.slots.length, 0);

  return (
    <div>
      <div className="slot-head">
        <div>
          <p className="slot-head__date">{formatDateLong(date)}</p>
          <p className="slot-head__count">
            {isPending
              ? 'Checking the calendar…'
              : `${count} ${count === 1 ? 'open time' : 'open times'}`}
          </p>
        </div>
        {isFetching && !isPending ? <Spinner label="Refreshing times" /> : null}
      </div>

      {error ? (
        <ErrorPanel
          error={error}
          title="Availability did not load"
          onRetry={onRetry}
        />
      ) : null}

      {isPending ? (
        <div className="slot-grid" aria-busy="true" aria-label="Loading times">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height="3rem" />
          ))}
        </div>
      ) : null}

      {!isPending && !error && count === 0 ? (
        <div className="slot-empty">
          <CalendarX2 size={17} aria-hidden="true" />
          <div>
            <strong>No open times on this date</strong>
            <p>
              Try another day. A day off, a date override, or a fully booked
              calendar can all empty a date.
            </p>
          </div>
        </div>
      ) : null}

      {!isPending && count > 0 ? (
        <div className="slot-groups">
          {grouped.map((group) => (
            <section key={group.period}>
              <h3 className="slot-group__head">{group.period}</h3>
              <div className="slot-grid">
                {group.slots.map((slot) => {
                  const isSelected = selected?.startTime === slot.startTime;
                  return (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      className={`slot ${isSelected ? 'is-selected' : ''}`.trim()}
                      onClick={() => onSelect(slot)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      title={`${formatTime(slot.startTime)} to ${formatTime(slot.endTime)}`}
                    >
                      <strong>{formatTime(slot.startTime)}</strong>
                      <span>to {formatTime(slot.endTime)}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
