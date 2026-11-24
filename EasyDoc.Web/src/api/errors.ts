export class ApiError extends Error {
  readonly status: number;
  readonly title?: string;
  readonly detail?: string;
  readonly validationErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    options?: {
      title?: string;
      detail?: string;
      validationErrors?: Record<string, string[]>;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.title = options?.title;
    this.detail = options?.detail;
    this.validationErrors = options?.validationErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const MESSAGE_COPY: Array<[RegExp, string]> = [
  [/Passwords must have at least one non alphanumeric character\.?/i, 'Add a symbol, such as ! or @.'],
  [/Passwords must have at least one uppercase/i, 'Add an upper-case letter.'],
  [/Passwords must have at least one lowercase/i, 'Add a lower-case letter.'],
  [/Passwords must have at least one digit/i, 'Add a number.'],
  [/Passwords must be at least (\d+) characters/i, 'Use at least $1 characters.'],
  [/Passwords must use at least (\d+) different characters/i, 'Use at least $1 different characters.'],
  [/((email|username).*(already taken|already exists)|duplicate username|a user with this email)/i, 'An account with this email already exists. Sign in instead.'],
  [/(invalid login attempt|invalid credentials|incorrect password)/i, 'That email and password do not match. Try again.'],
  [/(email.*not confirmed|not confirmed email)/i, 'Confirm your email before signing in.'],
  [/(failed to fetch|networkerror|load failed)/i, 'We couldn’t reach the clinic. Check your connection and try again.'],
  [/response did not include/i, 'We couldn’t read that record. Try again.'],
  [/The patient already has an appointment/i, 'You already have a visit with this doctor on this day.'],
  [/The doctor is already booked/i, 'That time was just taken. Choose another open time.'],
  [/not available for the requested date and time/i, 'That time is outside the doctor’s hours. Choose another open time.'],
  [/must be in the future/i, 'That time has passed. Choose a later open time.'],
  [/(doctor already has a schedule|schedule for the same day|schedule.*already exists|already exists.*schedule)/i, 'That day already has consulting hours. Choose another day.'],
  [/(already has an override|same date.*override|override.*already exists|already exists.*override)/i, 'That date already has an override. Edit it instead.'],
];

export function humanizeMessage(message: string): string {
  for (const [pattern, replacement] of MESSAGE_COPY) {
    if (pattern.test(message)) return message.replace(pattern, replacement);
  }
  return message;
}

export function describeError(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 401) return 'Your sign-in has ended. Sign in again.';
    if (error.status === 403) return 'Your account doesn’t have access to this action.';
    if (error.status === 404) return 'We couldn’t find that record.';
    if (error.validationErrors) {
      const messages = Object.values(error.validationErrors)
        .flat()
        .map((message) => humanizeMessage(message.trim()))
        .filter(Boolean);
      if (messages.length > 0) return messages.join(' ');
    }
    return humanizeMessage(error.detail ?? error.message);
  }
  if (error instanceof Error) return humanizeMessage(error.message);
  return 'Something went wrong. Try again.';
}

/**
 * Form submissions care about the concrete validation messages the API returns,
 * which are more useful than the generic problem title/detail.
 */
export function describeFormError(error: unknown): string {
  if (isApiError(error)) {
    const validation = error.validationErrors;
    if (validation) {
      const messages = Array.from(
        new Set(
          Object.values(validation)
            .flat()
            .map((message) => humanizeMessage(message.trim()))
            .filter(Boolean),
        ),
      );
      if (messages.length > 0) return messages.join(' ');
    }
  }
  return describeError(error);
}
