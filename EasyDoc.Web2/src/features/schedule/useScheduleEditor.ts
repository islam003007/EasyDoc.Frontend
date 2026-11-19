import { useState } from 'react';
import { useAddHoursForm } from './useAddHoursForm';
import { useAddOverrideForm } from './useAddOverrideForm';
import { useOverrideEditDialog } from './useOverrideEditDialog';
import { useScheduleData } from './useScheduleData';
import { useScheduleDelete } from './useScheduleDelete';
import { useScheduleEditDialog } from './useScheduleEditDialog';

export function useScheduleEditor() {
  const [notice, setNotice] = useState<string | null>(null);
  const data = useScheduleData();

  const addHours = useAddHoursForm({
    availableDays: data.availableDays,
    invalidateScheduleData: data.invalidateScheduleData,
    setNotice,
  });

  const addOverride = useAddOverrideForm({
    overrideDatesTaken: data.overrideDatesTaken,
    invalidateScheduleData: data.invalidateScheduleData,
    setNotice,
  });

  const remove = useScheduleDelete({
    invalidateScheduleData: data.invalidateScheduleData,
    setNotice,
  });

  const scheduleEdit = useScheduleEditDialog({
    weeklySchedules: data.weeklySchedules,
    invalidateScheduleData: data.invalidateScheduleData,
    setNotice,
  });

  const overrideEdit = useOverrideEditDialog({
    overrideList: data.overrideList,
    invalidateScheduleData: data.invalidateScheduleData,
    setNotice,
  });

  return {
    notice,
    dismissNotice: () => setNotice(null),
    data,
    addHours,
    addOverride,
    remove,
    scheduleEdit,
    overrideEdit,
  };
}
