export const queryKeys = {
  session: ['session'] as const,
  demoUsers: ['demo-users'] as const,
  departments: ['lookups', 'departments'] as const,
  cities: ['lookups', 'cities'] as const,
  doctorSearch: (query: string, cityId: string, departmentId: string) =>
    ['doctors', 'search', query, cityId, departmentId] as const,
  doctorDirectory: (cityId: string, departmentId: string) =>
    ['doctors', 'directory', cityId, departmentId] as const,
  doctor: (id: string) => ['doctor', id] as const,
  doctorMe: ['doctor', 'me'] as const,
  slots: (id: string, date: string) => ['doctor', id, 'slots', date] as const,
  patientAppointments: ['appointments', 'patient'] as const,
  doctorAppointments: ['appointments', 'doctor'] as const,
  patientHistory: (patientId: string) =>
    ['appointments', 'history', patientId] as const,
  patientMe: ['patient', 'me'] as const,
  schedules: (doctorId: string) => ['doctor', doctorId, 'schedules'] as const,
  overrides: (doctorId: string) =>
    ['doctor', doctorId, 'schedule-overrides'] as const,
  adminDoctors: ['admin', 'doctors'] as const,
  adminDoctor: (id: string) => ['admin', 'doctors', id] as const,
  adminPatients: ['admin', 'patients'] as const,
  adminPatient: (id: string) => ['admin', 'patients', id] as const,
};
