import { describeError } from '../api/client';

/**
 * The API is authoritative, but its problem details are written for developers.
 * Booking surfaces translate the known conflicts into actions the patient can take.
 */
export function bookingErrorMessage(error: unknown): string {
  const message = describeError(error);

  if (/already has an appointment/i.test(message)) {
    return 'You already have a visit with this doctor on this day. Open My visits or choose another date.';
  }
  if (/already booked/i.test(message)) {
    return 'That time was just taken. The open times have been refreshed — choose another slot.';
  }
  if (/not available/i.test(message)) {
    return 'That time is outside the doctor’s consulting hours. Pick another open time.';
  }
  if (/in the future/i.test(message)) {
    return 'That time has passed. Pick a later open time.';
  }

  return message;
}
