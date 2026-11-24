import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import type { AdminDoctor, LookupItem } from '../../api/contracts';
import { updateAdminDoctor } from '../../api/queries';

function matchingCityId(doctor: AdminDoctor, cities: LookupItem[]): string {
  if (doctor.cityId && cities.some((city) => city.id === doctor.cityId)) {
    return doctor.cityId;
  }
  const normalized = doctor.city?.trim().toLowerCase();
  if (!normalized) return '';
  return (
    cities.find((city) => city.name.trim().toLowerCase() === normalized)?.id ?? ''
  );
}

export function useAdminDoctorForm({
  doctor,
  cities,
  onSaved,
}: {
  doctor: AdminDoctor;
  cities: LookupItem[];
  onSaved: (doctor: AdminDoctor) => void;
}) {
  const [personName, setPersonName] = useState(doctor.personName);
  const [phoneNumber, setPhoneNumber] = useState(doctor.phoneNumber ?? '');
  const [cityId, setCityId] = useState(() => matchingCityId(doctor, cities));
  const [clinicAddress, setClinicAddress] = useState(doctor.clinicAddress ?? '');
  const [duration, setDuration] = useState(
    String(doctor.defaultAppointmentTimeInMinutes || 30),
  );
  const [description, setDescription] = useState(doctor.description ?? '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    doctor.profilePictureUrl ?? '',
  );
  const [isVisible, setIsVisible] = useState(doctor.isVisible);

  const numericDuration = Number(duration);
  const durationValid =
    Number.isFinite(numericDuration) &&
    numericDuration >= 10 &&
    numericDuration <= 120;
  const canSave =
    personName.trim().length > 0 &&
    phoneNumber.trim().length > 0 &&
    clinicAddress.trim().length > 0 &&
    durationValid;

  const save = useMutation({
    mutationFn: () =>
      updateAdminDoctor({
        doctorId: doctor.id,
        personName,
        phoneNumber,
        cityId: cityId || undefined,
        clinicAddress,
        defaultAppointmentTimeInMinutes: numericDuration,
        description,
        profilePictureUrl,
        isVisible,
      }),
    onSuccess: () => {
      const selectedCity = cities.find((city) => city.id === cityId);
      onSaved({
        ...doctor,
        personName: personName.trim(),
        phoneNumber: phoneNumber.trim(),
        cityId: cityId || undefined,
        city: selectedCity?.name ?? doctor.city,
        clinicAddress: clinicAddress.trim(),
        defaultAppointmentTimeInMinutes: numericDuration,
        description: description.trim() || undefined,
        profilePictureUrl: profilePictureUrl.trim() || undefined,
        isVisible,
      });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    save.mutate();
  }

  return {
    personName,
    setPersonName,
    phoneNumber,
    setPhoneNumber,
    cityId,
    setCityId,
    clinicAddress,
    setClinicAddress,
    duration,
    setDuration,
    description,
    setDescription,
    profilePictureUrl,
    setProfilePictureUrl,
    isVisible,
    setIsVisible,
    durationValid,
    canSave,
    save,
    submit,
  };
}

export type AdminDoctorFormState = ReturnType<typeof useAdminDoctorForm>;
