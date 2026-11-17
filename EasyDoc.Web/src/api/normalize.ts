import type {
  AdminDoctor,
  AdminPatient,
  Appointment,
  AppointmentStatus,
  DemoUser,
  DoctorDetail,
  DoctorSchedule,
  DoctorSummary,
  Examination,
  LookupItem,
  Role,
  ScheduleOverride,
  Session,
  Slot,
} from './contracts';

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Case-insensitive property read, so API casing changes don't break the UI. */
export function read(record: Rec, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key];
    const lower = key.toLowerCase().replace(/[_-]/g, '');
    const match = Object.keys(record).find(
      (candidate) => candidate.toLowerCase().replace(/[_-]/g, '') === lower,
    );
    if (match) return record[match];
  }
  return undefined;
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function nameOf(value: unknown): string | undefined {
  if (isRecord(value)) {
    return text(read(value, 'name', 'label', 'title', 'displayName'));
  }
  return text(value);
}

function bool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return fallback;
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function recordsIn(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];

  const candidates = [
    ...keys,
    'items',
    'results',
    'records',
    'data',
    'list',
    '$values',
  ];

  for (const key of candidates) {
    const value = read(payload, key);
    if (Array.isArray(value)) return value;
    if (isRecord(value)) {
      for (const nestedKey of ['items', 'results', 'records', '$values']) {
        const nested = read(value, nestedKey);
        if (Array.isArray(nested)) return nested;
      }
    }
  }

  return [];
}

export function normalizeRole(value: unknown): Role {
  const candidates: unknown[] = Array.isArray(value) ? value : [value];

  for (const candidate of candidates) {
    const normalized = text(candidate)?.toLowerCase() ?? '';
    if (normalized.includes('admin') || normalized.includes('administrator')) {
      return 'admin';
    }
    if (normalized.includes('doctor') || normalized.includes('physician')) {
      return 'doctor';
    }
    if (normalized.includes('patient')) return 'patient';
  }

  return 'unknown';
}

export function normalizeSession(payload: unknown): Session {
  if (!isRecord(payload)) {
    throw new Error('The session response was not a JSON object.');
  }

  const email = text(read(payload, 'email')) ?? '';
  const role = normalizeRole(read(payload, 'role', 'roles', 'userRole'));
  const patientId = text(read(payload, 'patientId'));
  const doctorId = text(read(payload, 'doctorId'));

  const inferredRole: Role =
    role !== 'unknown' ? role : doctorId ? 'doctor' : patientId ? 'patient' : 'unknown';

  const rawDisplayName = text(
    read(payload, 'displayName', 'name', 'fullName', 'personName'),
  );
  const emailLocalPart = email ? email.split('@')[0] : undefined;
  const displayName =
    rawDisplayName && rawDisplayName.toLowerCase() !== email.toLowerCase()
      ? rawDisplayName
      : inferredRole === 'admin'
        ? 'Administrator'
        : (emailLocalPart ?? 'Demo user');

  return {
    userId: text(read(payload, 'userId', 'id', 'sub')) ?? '',
    email,
    role: inferredRole,
    displayName,
    patientId,
    doctorId,
  };
}

export function normalizeDemoUsers(payload: unknown): DemoUser[] {
  let candidates = recordsIn(payload, ['demoUsers', 'users', 'accounts', 'roles']);

  // Also accept a role-keyed object: { patient: [...], doctor: [...], admin: [...] }.
  if (candidates.length === 0 && isRecord(payload)) {
    for (const [key, value] of Object.entries(payload)) {
      if (!Array.isArray(value)) continue;
      const role = normalizeRole(key);
      candidates = candidates.concat(
        value.map((entry) =>
          isRecord(entry) && read(entry, 'role') === undefined
            ? { ...entry, role }
            : entry,
        ),
      );
    }
  }

  const users = candidates
    .map((entry): DemoUser | null => {
      if (!isRecord(entry)) return null;
      const email = text(read(entry, 'email')) ?? '';
      const key =
        text(read(entry, 'key', 'loginKey', 'demoKey')) ?? (email || undefined);
      if (!key) return null;

      const explicitRole = normalizeRole(
        read(entry, 'role', 'roleName', 'type'),
      );
      const role: Role =
        explicitRole !== 'unknown'
          ? explicitRole
          : normalizeRole(key) !== 'unknown'
            ? normalizeRole(key)
            : normalizeRole(email);

      return {
        key,
        role,
        label:
          text(read(entry, 'label', 'displayName', 'name', 'personName')) ??
          email ??
          'Demo user',
        email,
      };
    })
    .filter((entry): entry is DemoUser => entry !== null);

  const seen = new Set<string>();
  const unique = users.filter((user) => {
    if (seen.has(user.key)) return false;
    seen.add(user.key);
    return true;
  });

  const rank: Record<Role, number> = { patient: 0, doctor: 1, admin: 2, unknown: 3 };
  return unique.sort(
    (a, b) => rank[a.role] - rank[b.role] || a.label.localeCompare(b.label),
  );
}

export function normalizeLookups(payload: unknown): LookupItem[] {
  return recordsIn(payload, [
    'items',
    'lookups',
    'departments',
    'cities',
    'governorates',
  ])
    .map((entry): LookupItem | null => {
      if (!isRecord(entry)) return null;
      const id = text(read(entry, 'id', 'value', 'key'));
      const name = text(
        read(entry, 'name', 'label', 'title', 'displayName', 'text'),
      );
      if (!id || !name) return null;
      return {
        id,
        name,
        governorateId: text(read(entry, 'governorateId', 'governorate_id')),
      };
    })
    .filter((entry): entry is LookupItem => entry !== null);
}

function normalizeDoctorSummary(entry: unknown): DoctorSummary | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'doctorId', 'id'));
  const personName = text(read(entry, 'personName', 'name', 'displayName'));
  if (!id || !personName) return null;

  return {
    id,
    personName,
    department: nameOf(read(entry, 'department', 'departmentName')),
    city: nameOf(read(entry, 'city', 'cityName')),
    departmentId: text(read(entry, 'departmentId')),
    cityId: text(read(entry, 'cityId')),
    profilePictureUrl: text(
      read(entry, 'profilePictureUrl', 'profilePictureURL', 'profilePicture'),
    ),
  };
}

export function normalizeDoctorSummaries(payload: unknown): DoctorSummary[] {
  return recordsIn(payload, ['doctors', 'items'])
    .map(normalizeDoctorSummary)
    .filter((entry): entry is DoctorSummary => entry !== null);
}

export function normalizeDoctorDetail(payload: unknown): DoctorDetail {
  if (!isRecord(payload)) {
    throw new Error('The doctor response was not a JSON object.');
  }

  const id = text(read(payload, 'id', 'doctorId'));
  if (!id) throw new Error('The doctor response did not include an id.');

  return {
    id,
    personName:
      text(read(payload, 'personName', 'name', 'displayName')) ?? 'Doctor',
    phoneNumber: text(read(payload, 'phoneNumber', 'phone')),
    department: nameOf(read(payload, 'department', 'departmentName')),
    city: nameOf(read(payload, 'city', 'cityName')),
    clinicAddress: text(read(payload, 'clinicAddress', 'address')),
    defaultAppointmentTimeInMinutes: numberValue(
      read(payload, 'defaultAppointmentTimeInMinutes', 'appointmentDuration'),
      30,
    ),
    description: text(read(payload, 'description', 'bio')),
    profilePictureUrl: text(
      read(payload, 'profilePictureUrl', 'profilePictureURL', 'profilePicture'),
    ),
    email: text(read(payload, 'email')),
  };
}

export function normalizeSlots(payload: unknown): Slot[] {
  return recordsIn(payload, ['slots'])
    .map((entry): Slot | null => {
      if (!isRecord(entry)) return null;
      const startTime = text(read(entry, 'startTime', 'start'));
      const endTime = text(read(entry, 'endTime', 'end'));
      if (!startTime || !endTime) return null;
      return { startTime, endTime };
    })
    .filter((entry): entry is Slot => entry !== null);
}

export function normalizeAppointmentStatus(value: unknown): AppointmentStatus {
  if (typeof value === 'number') {
    return (
      (['Pending', 'Scheduled', 'Completed', 'Canceled'] as AppointmentStatus[])[
        value
      ] ?? 'Unknown'
    );
  }

  const normalized = text(value)?.toLowerCase();
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'scheduled':
    case 'accepted':
      return 'Scheduled';
    case 'completed':
    case 'complete':
      return 'Completed';
    case 'canceled':
    case 'cancelled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

function normalizeExamination(value: unknown): Examination | null {
  if (!isRecord(value)) return null;
  const examination: Examination = {
    diagnosis: text(read(value, 'diagnosis')),
    prescription: text(read(value, 'prescription')),
    notes: text(read(value, 'notes')),
  };
  if (!examination.diagnosis && !examination.prescription && !examination.notes) {
    return null;
  }
  return examination;
}

export function normalizeAppointment(entry: unknown): Appointment | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'appointmentId'));
  const date = text(read(entry, 'date'));
  const startTime = text(read(entry, 'startTime'));
  if (!id || !date || !startTime) return null;

  return {
    id,
    patientId: text(read(entry, 'patientId')) ?? '',
    doctorId: text(read(entry, 'doctorId')) ?? '',
    date: date.slice(0, 10),
    startTime,
    endTime: text(read(entry, 'endTime')) ?? startTime,
    status: normalizeAppointmentStatus(read(entry, 'status')),
    examination: normalizeExamination(read(entry, 'examination')),
    patientName: text(read(entry, 'patientName')),
    doctorName: text(read(entry, 'doctorName')),
  };
}

export function normalizeAppointments(payload: unknown): Appointment[] {
  return recordsIn(payload, ['appointments'])
    .map(normalizeAppointment)
    .filter((entry): entry is Appointment => entry !== null);
}

export function parseDayOfWeek(value: unknown): number {
  if (typeof value === 'number' && value >= 0 && value <= 6) return value;
  const normalized = text(value)?.toLowerCase();
  if (!normalized) return 0;
  if (/^[0-6]$/.test(normalized)) return Number(normalized);

  const days: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };
  return days[normalized] ?? 0;
}

export function normalizeSchedule(entry: unknown): DoctorSchedule | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'scheduleId'));
  const startTime = text(read(entry, 'startTime'));
  const endTime = text(read(entry, 'endTime'));
  if (!id || !startTime || !endTime) return null;

  return {
    id,
    dayOfWeek: parseDayOfWeek(read(entry, 'dayOfWeek', 'day')),
    startTime,
    endTime,
  };
}

export function normalizeSchedules(payload: unknown): DoctorSchedule[] {
  return recordsIn(payload, ['schedules'])
    .map(normalizeSchedule)
    .filter((entry): entry is DoctorSchedule => entry !== null);
}

export function normalizeOverride(entry: unknown): ScheduleOverride | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'scheduleOverrideId'));
  const date = text(read(entry, 'date'));
  if (!id || !date) return null;

  return {
    id,
    date: date.slice(0, 10),
    isAvailable: bool(
      read(entry, 'isAvailable', 'isAvaiable', 'available'),
      true,
    ),
    startTime: text(read(entry, 'startTime')),
    endTime: text(read(entry, 'endTime')),
  };
}

export function normalizeOverrides(payload: unknown): ScheduleOverride[] {
  return recordsIn(payload, ['scheduleOverrides', 'overrides'])
    .map(normalizeOverride)
    .filter((entry): entry is ScheduleOverride => entry !== null);
}

export function normalizeAdminDoctor(entry: unknown): AdminDoctor | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'doctorId'));
  if (!id) return null;

  return {
    id,
    userId: text(read(entry, 'userId')),
    personName:
      text(read(entry, 'personName', 'name', 'displayName')) ?? 'Unnamed doctor',
    email: text(read(entry, 'email')) ?? '',
    phoneNumber: text(read(entry, 'phoneNumber', 'phone')),
    department: nameOf(read(entry, 'department', 'departmentName')),
    departmentId: text(read(entry, 'departmentId')),
    city: nameOf(read(entry, 'city', 'cityName')),
    cityId: text(read(entry, 'cityId')),
    isVisible: bool(read(entry, 'isVisible', 'visible', 'active'), true),
    isDeleted: bool(read(entry, 'isDeleted'), false),
  };
}

export function normalizeAdminDoctors(payload: unknown): AdminDoctor[] {
  return recordsIn(payload, ['doctors', 'items'])
    .map(normalizeAdminDoctor)
    .filter((entry): entry is AdminDoctor => entry !== null);
}

export function normalizeAdminPatient(entry: unknown): AdminPatient | null {
  if (!isRecord(entry)) return null;
  const id = text(read(entry, 'id', 'patientId'));
  if (!id) return null;

  return {
    id,
    userId: text(read(entry, 'userId')),
    personName:
      text(read(entry, 'personName', 'name', 'displayName')) ?? 'Unnamed patient',
    email: text(read(entry, 'email')) ?? '',
    phoneNumber: text(read(entry, 'phoneNumber', 'phone')),
    isDeleted: bool(read(entry, 'isDeleted'), false),
  };
}

export function normalizeAdminPatients(payload: unknown): AdminPatient[] {
  return recordsIn(payload, ['patients', 'items'])
    .map(normalizeAdminPatient)
    .filter((entry): entry is AdminPatient => entry !== null);
}
