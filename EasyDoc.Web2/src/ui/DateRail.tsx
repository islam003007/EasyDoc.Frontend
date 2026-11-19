import { addDays } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { useEffect, useRef } from 'react';
import {
  formatDayNumber,
  formatMonthShort,
  formatWeekdayShort,
  maxBookingIso,
  toDateInputValue,
  todayIso,
} from '../lib/dates';

export function DateRail({
  value,
  onChange,
  days = 10,
}: {
  value: string;
  onChange: (value: string) => void;
  days?: number;
}) {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, index) =>
    toDateInputValue(addDays(today, index)),
  );
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the chosen day visible when the user jumps to a date outside the
  // first few slips.
  useEffect(() => {
    const rail = railRef.current;
    const selected = rail?.querySelector<HTMLElement>('.date-slip.is-selected');
    if (!rail || !selected) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollTo({
      left: selected.offsetLeft - rail.clientWidth / 2 + selected.clientWidth / 2,
      behavior: reduce ? 'auto' : 'smooth',
    });
  }, [value]);

  return (
    <div>
      <div
        ref={railRef}
        className="date-rail"
        aria-label="Choose an appointment date"
      >
        {dates.map((date, index) => (
          <button
            key={date}
            type="button"
            className={`date-slip ${value === date ? 'is-selected' : ''}`.trim()}
            onClick={() => onChange(date)}
            aria-pressed={value === date}
          >
            <span>{index === 0 ? 'Today' : formatWeekdayShort(date)}</span>
            <strong>{formatDayNumber(date)}</strong>
            <span>{formatMonthShort(date)}</span>
          </button>
        ))}
      </div>
      <label className="date-jump">
        <CalendarDays size={15} aria-hidden="true" />
        <span>Another date</span>
        <input
          type="date"
          value={value}
          min={todayIso()}
          max={maxBookingIso()}
          onChange={(event) => {
            if (event.target.value) onChange(event.target.value);
          }}
        />
      </label>
    </div>
  );
}
