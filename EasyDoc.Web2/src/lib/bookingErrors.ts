import { describeError } from '../api/client';

/**
 * The API is authoritative, but its problem details are written for developers.
 * Booking surfaces translate the known conflicts into actions the patient can take.
 */
export function bookingErrorMessage(error: unknown): string {
  const message = describeError(error);

  if (/already has an appointment|already have a visit with this doctor/i.test(message)) {
    return 'You already have a visit with this doctor on this day. Open My visits or choose another date.';
  }
  if (/already booked|just taken/i.test(message)) {
    return 'That time was just taken. The open times have been refreshed — choose another time.';
  }
  if (/not available/i.test(message)) {
    return 'That time is outside the doctor’s consulting hours. Choose another open time.';
  }
  if (/in the future|has passed/i.test(message)) {
    return 'That time has passed. Choose a later open time.';
  }

  return message;
}
