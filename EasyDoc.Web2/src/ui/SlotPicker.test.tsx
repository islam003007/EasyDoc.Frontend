import { fireEvent, render, screen } from '@testing-library/react';
import { addDays, format } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import type { Slot } from '../api/contracts';
import { SlotPicker } from './SlotPicker';

const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const slot: Slot = { startTime: '09:00', endTime: '09:30' };

describe('SlotPicker', () => {
  it('renders open slots and reports the selected one', () => {
    const onSelect = vi.fn();
    render(
      <SlotPicker
        date={tomorrow}
        slots={[slot]}
        isPending={false}
        selected={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /9:00 AM/i }));

    expect(onSelect).toHaveBeenCalledWith(slot);
  });

  it('shows an empty state when the date has no open times', () => {
    render(
      <SlotPicker
        date={tomorrow}
        slots={[]}
        isPending={false}
        selected={null}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText('No open times on this date')).toBeInTheDocument();
  });

  it('disables slots when booking is blocked', () => {
    render(
      <SlotPicker
        date={tomorrow}
        slots={[slot]}
        isPending={false}
        selected={null}
        onSelect={() => undefined}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: /9:00 AM/i })).toBeDisabled();
  });

  it('shows an error panel when availability fails', () => {
    render(
      <SlotPicker
        date={tomorrow}
        slots={undefined}
        isPending={false}
        error={new Error('Network down')}
        selected={null}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText('Availability did not load')).toBeInTheDocument();
    expect(screen.getByText('Network down')).toBeInTheDocument();
  });
});
