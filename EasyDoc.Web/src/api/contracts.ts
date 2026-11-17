export type Role = 'patient' | 'doctor' | 'admin' | 'unknown';

export type AppointmentStatus =
  | 'Pending'
  | 'Scheduled'
  | 'Completed'
  | 'Canceled'
  | 'Unknown';

export interface Session {
  userId: string;
  email: string;
  role: Role;
  displayName: string;
  patientId?: string;
  doctorId?: string;
}

export interface DemoUser {
  key: string;
  role: Role;
  label: string;
  email: string;
}

export interface LookupItem {
  id: string;
  name: string;
  governorateId?: string;
}

export interface DoctorSummary {
  id: string;
  personName: string;
  department?: string;
  city?: string;
  departmentId?: string;
  cityId?: string;
  profilePictureUrl?: string;
}

export interface DoctorDetail {
  id: string;
  personName: string;
  phoneNumber?: string;
  department?: string;
  city?: string;
  clinicAddress?: string;
  defaultAppointmentTimeInMinutes: number;
  description?: string;
  profilePictureUrl?: string;
  email?: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
}

export interface Examination {
  diagnosis?: string;
  prescription?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  examination?: Examination | null;
  patientName?: string;
  doctorName?: string;
}

export interface DoctorSchedule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ScheduleOverride {
  id: string;
  date: string;
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

export interface AdminDoctor {
  id: string;
  userId?: string;
  personName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  departmentId?: string;
  city?: string;
  cityId?: string;
  isVisible: boolean;
  isDeleted: boolean;
}

export interface AdminPatient {
  id: string;
  userId?: string;
  personName: string;
  email: string;
  phoneNumber?: string;
  isDeleted: boolean;
}
