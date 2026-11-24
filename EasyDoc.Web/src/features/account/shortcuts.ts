import {
  CalendarDays,
  Search,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../../api/contracts';

export interface Shortcut {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

export function shortcutsForRole(role: Role): Shortcut[] {
  switch (role) {
    case 'patient':
      return [
        {
          to: '/patient',
          label: 'Find a doctor',
          description: 'Search the directory and request an open time.',
          icon: Search,
        },
        {
          to: '/patient/appointments',
          label: 'My visits',
          description: 'Read records, reschedule, or cancel.',
          icon: CalendarDays,
        },
      ];
    case 'doctor':
      return [
        {
          to: '/doctor',
          label: 'Practice board',
          description: 'Answer requests and complete visits.',
          icon: Stethoscope,
        },
        {
          to: '/doctor/schedule',
          label: 'Schedule',
          description: 'Set weekly hours and date overrides.',
          icon: CalendarDays,
        },
        {
          to: '/doctor/profile',
          label: 'Public profile',
          description: 'Edit the record patients see.',
          icon: UserRound,
        },
      ];
    case 'admin':
      return [
        {
          to: '/admin',
          label: 'Doctor directory',
          description: 'Review records and switch visibility.',
          icon: Stethoscope,
        },
        {
          to: '/admin/patients',
          label: 'Patient directory',
          description: 'Review patient accounts.',
          icon: Users,
        },
      ];
    default:
      return [];
  }
}

export function workspaceForRole(role: Role): string {
  switch (role) {
    case 'patient':
      return 'Patient app';
    case 'doctor':
      return 'Practice workspace';
    case 'admin':
      return 'Network admin';
    default:
      return 'EasyDoc';
  }
}
