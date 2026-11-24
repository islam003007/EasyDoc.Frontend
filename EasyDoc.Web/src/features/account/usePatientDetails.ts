import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import type { PatientProfile } from '../../api/contracts';
import {
  fetchPatientMe,
  queryKeys,
  updatePatientMe,
} from '../../api/queries';
import { useSession } from '../../auth/SessionProvider';

export function usePatientDetails(onSaved: () => void) {
  const { session, setSession } = useSession();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const isPatient = session?.role === 'patient';

  const patientMe = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: ({ signal }) => fetchPatientMe(signal),
    enabled: Boolean(isPatient),
  });

  const savePatient = useMutation({
    mutationFn: () => updatePatientMe({ personName, phoneNumber }),
    onSuccess: () => {
      const profile: PatientProfile | undefined = patientMe.data;
      if (profile) {
        queryClient.setQueryData(queryKeys.patientMe, {
          ...profile,
          personName: personName.trim(),
          phoneNumber: phoneNumber.trim(),
        });
      }
      if (session) {
        setSession({ ...session, displayName: personName.trim() });
      }
      setEditOpen(false);
      onSaved();
    },
  });

  function openEdit() {
    setPersonName(patientMe.data?.personName ?? session?.displayName ?? '');
    setPhoneNumber(patientMe.data?.phoneNumber ?? '');
    savePatient.reset();
    setEditOpen(true);
  }

  function closeEdit() {
    if (savePatient.isPending) return;
    setEditOpen(false);
    savePatient.reset();
  }

  function submitPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!personName.trim() || !phoneNumber.trim()) return;
    savePatient.mutate();
  }

  return {
    isPatient,
    patientMe,
    editOpen,
    personName,
    setPersonName,
    phoneNumber,
    setPhoneNumber,
    savePatient,
    canSave: Boolean(personName.trim() && phoneNumber.trim()),
    openEdit,
    closeEdit,
    submitPatient,
  };
}

export type PatientDetailsState = ReturnType<typeof usePatientDetails>;
