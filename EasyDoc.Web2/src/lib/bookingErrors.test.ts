// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { bookingErrorMessage } from './bookingErrors';

describe('booking error copy', () => {
  it('explains a same-day duplicate and points to My visits', () => {
    expect(
      bookingErrorMessage(
        new Error(
          'The patient already has an appointment with this doctor on this day.',
        ),
      ),
    ).toBe(
      'You already have a visit with this doctor on this day. Open My visits or choose another date.',
    );
  });

  it('explains a slot race without exposing the API message', () => {
    expect(
      bookingErrorMessage(new Error('The doctor is already booked for the selected time')),
    ).toBe(
      'That time was just taken. The open times have been refreshed — choose another slot.',
    );
  });

  it('explains a past time', () => {
    expect(
      bookingErrorMessage(new Error('An appointment date and time must be in the future.')),
    ).toBe('That time has passed. Pick a later open time.');
  });

  it('falls back to the original error', () => {
    expect(bookingErrorMessage(new Error('Network unavailable'))).toBe(
      'Network unavailable',
    );
  });
});
