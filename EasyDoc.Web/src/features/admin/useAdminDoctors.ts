import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { AdminDoctor } from '../../api/contracts';
import {
  fetchAdminDoctors,
  queryKeys,
  updateDoctorVisibility,
} from '../../api/queries';

export function useAdminDoctors() {
  const queryClient = useQueryClient();
  const [term, setTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const doctors = useQuery({
    queryKey: queryKeys.adminDoctors,
    queryFn: ({ signal }) => fetchAdminDoctors(signal),
  });

  const toggle = useMutation({
    mutationFn: (input: { doctor: AdminDoctor; next: boolean }) =>
      updateDoctorVisibility(input.doctor.id, input.next),
    onSuccess: (_data, input) => {
      setNotice(
        `${input.doctor.personName} is now ${
          input.next ? 'listed in' : 'hidden from'
        } the patient directory.`,
      );
      queryClient.setQueryData(
        queryKeys.adminDoctors,
        (current: AdminDoctor[] | undefined) =>
          current?.map((doctor) =>
            doctor.id === input.doctor.id
              ? { ...doctor, isVisible: input.next }
              : doctor,
          ),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminDoctor(input.doctor.id),
      });
    },
  });

  const all = doctors.data ?? [];
  const listed = all.filter((doctor) => doctor.isVisible).length;
  const hidden = all.length - listed;

  const filtered = useMemo(() => {
    const normalized = term.trim().toLowerCase();
    if (!normalized) return all;
    return all.filter((doctor) =>
      [
        doctor.personName,
        doctor.email,
        doctor.phoneNumber,
        doctor.city,
        doctor.department,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalized)),
    );
  }, [all, term]);

  function applySavedDoctor(updated: AdminDoctor) {
    setNotice('Doctor profile updated.');
    queryClient.setQueryData(
      queryKeys.adminDoctors,
      (current: AdminDoctor[] | undefined) =>
        current?.map((doctor) => (doctor.id === updated.id ? updated : doctor)),
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors });
  }

  return {
    doctors,
    toggle,
    all,
    listed,
    hidden,
    filtered,
    term,
    setTerm,
    notice,
    setNotice,
    applySavedDoctor,
  };
}

export type AdminDoctorsState = ReturnType<typeof useAdminDoctors>;
