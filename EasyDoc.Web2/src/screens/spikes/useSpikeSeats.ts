import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { DemoUser, Role } from '../../api/contracts';
import { demoLogin, fetchDemoUsers, queryKeys } from '../../api/queries';
import { useSession } from '../../auth/SessionProvider';
import { roleHome } from '../../lib/format';

export interface SpikeSeat {
  role: Role;
  time: string;
  label: string;
  blurb: string;
  tone: 'pink' | 'sky' | 'ink';
}

export const SPIKE_SEATS: SpikeSeat[] = [
  {
    role: 'patient',
    time: '09:00',
    label: 'Patient seat',
    blurb: 'Search the network, hold an open time, and keep the visit record.',
    tone: 'pink',
  },
  {
    role: 'doctor',
    time: '11:00',
    label: 'Doctor seat',
    blurb: 'Answer requests, complete visits, and shape the week.',
    tone: 'sky',
  },
  {
    role: 'admin',
    time: '14:00',
    label: 'Demo admin seat',
    blurb: 'Review the directory and switch doctor visibility.',
    tone: 'ink',
  },
];

const FALLBACK: Partial<Record<Role, { name: string; email: string }>> = {
  patient: { name: 'سارة محمد', email: 'sara@example.com' },
  doctor: { name: 'أحمد حسن', email: 'ahmed@example.com' },
  admin: { name: 'Administrator', email: 'admin@example.com' },
};

export function fallbackSeat(role: Role): { name: string; email: string } {
  return FALLBACK[role] ?? { name: 'Demo seat', email: 'seeded account' };
}

export function seatFor(
  users: DemoUser[] | undefined,
  role: Role,
): DemoUser | undefined {
  return users?.find((user) => user.role === role);
}

export function useSpikeSeats() {
  const { refreshSession } = useSession();
  const navigate = useNavigate();

  const users = useQuery({
    queryKey: queryKeys.demoUsers,
    queryFn: ({ signal }) => fetchDemoUsers(signal),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const login = useMutation({
    mutationFn: async (user: DemoUser) => {
      await demoLogin(user.key);
      const next = await refreshSession();
      if (!next) {
        throw new Error(
          'The seat opened, but the session could not be confirmed. Refresh and try again.',
        );
      }
      return next;
    },
    onSuccess: (next) => {
      navigate(roleHome(next.role), { replace: true });
    },
  });

  return { users, login };
}
