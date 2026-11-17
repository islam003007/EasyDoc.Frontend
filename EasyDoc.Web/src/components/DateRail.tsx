import { addDays } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import {
  formatDayNumber,
  formatMonthShort,
  formatWeekdayShort,
  maxBookingIso,
  toDateInputValue,
  todayIso,
} from '../lib/dates';

interface DateRailProps {
  value: string;
  onChange: (value: string) => void;
  days?: number;
}

export function DateRail({ value, onChange, days = 10 }: DateRailProps) {
  const today = new Date();
  const dates = Array.from({ length: days }, (_, index) =>
    toDateInputValue(addDays(today, index)),
  );

  return (
    <div className="date-picker">
      <div className="date-rail" aria-label="Choose an appointment date">
        {dates.map((date, index) => (
          <button
            key={date}
            type="button"
            className={`date-rail__day ${value === date ? 'is-selected' : ''}`.trim()}
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
        <CalendarDays size={16} aria-hidden="true" />
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
