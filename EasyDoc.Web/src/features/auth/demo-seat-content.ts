import {
  ShieldCheck,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../../api/contracts';

export const ROLE_ORDER: Role[] = ['patient', 'doctor', 'admin', 'unknown'];

export const ROLE_TITLE: Record<Role, string> = {
  patient: 'I’m here for care',
  doctor: 'I’m here to practise',
  admin: 'Here to review the directory',
  unknown: 'Another demo seat',
};

export const ROLE_CARD_LABEL: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Demo admin',
  unknown: 'Demo guest',
};

export const ROLE_ICON: Record<Role, LucideIcon> = {
  patient: UserRound,
  doctor: Stethoscope,
  admin: ShieldCheck,
  unknown: UserRound,
};

export const ROLE_INDEX: Record<Role, string> = {
  patient: '01',
  doctor: '02',
  admin: '03',
  unknown: '04',
};
