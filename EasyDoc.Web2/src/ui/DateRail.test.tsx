import { fireEvent, render, screen } from '@testing-library/react';
import { addDays, format } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import { DateRail } from './DateRail';

function iso(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

describe('DateRail', () => {
  it('renders ten days and marks conflict dates', () => {
    const tomorrow = iso(addDays(new Date(), 1));
    const onChange = vi.fn();
    const { container } = render(
      <DateRail
        value={tomorrow}
        onChange={onChange}
        conflictDates={new Set([tomorrow])}
      />,
    );

    expect(container.querySelectorAll('.date-slip')).toHaveLength(10);
    expect(container.querySelectorAll('.date-slip__conflict')).toHaveLength(1);
  });

  it('selects a date when a slip is clicked', () => {
    const today = iso(new Date());
    const tomorrow = iso(addDays(new Date(), 1));
    const onChange = vi.fn();
    const { container } = render(
      <DateRail value={tomorrow} onChange={onChange} />,
    );

    const todaySlip = container.querySelector<HTMLButtonElement>('.date-slip');
    expect(todaySlip).not.toBeNull();
    fireEvent.click(todaySlip!);

    expect(onChange).toHaveBeenCalledWith(today);
  });

  it('keeps the selected date pressed for assistive technology', () => {
    const tomorrow = iso(addDays(new Date(), 1));
    render(<DateRail value={tomorrow} onChange={() => undefined} />);

    const selected = screen
      .getAllByRole('button')
      .find((button) => button.getAttribute('aria-pressed') === 'true');
    expect(selected).toBeDefined();
  });
});
