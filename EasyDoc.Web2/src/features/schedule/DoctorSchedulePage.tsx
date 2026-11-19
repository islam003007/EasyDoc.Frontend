import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { AddHoursForm } from './AddHoursForm';
import { AddOverrideForm } from './AddOverrideForm';
import { OverrideEditDialog } from './OverrideEditDialog';
import { OverridesSection } from './OverridesSection';
import { ScheduleDeleteDialog } from './ScheduleDeleteDialog';
import { ScheduleEditDialog } from './ScheduleEditDialog';
import { ScheduleIntro } from './ScheduleIntro';
import { useScheduleEditor } from './useScheduleEditor';
import { WeeklyHoursSection } from './WeeklyHoursSection';

export function DoctorSchedulePage() {
  useDocumentTitle('Schedule');
  const editor = useScheduleEditor();
  const { data } = editor;

  return (
    <div className="page">
      <ScheduleIntro
        notice={editor.notice}
        onDismissNotice={editor.dismissNotice}
        doctorQuery={data.doctorQuery}
        schedules={data.schedules}
        overrides={data.overrides}
        overrideCount={data.overrideList.length}
        stats={data.stats}
      />

      <div className="schedule-layout">
        <WeeklyHoursSection
          schedules={data.schedules}
          weeklySchedules={data.weeklySchedules}
          onEdit={editor.scheduleEdit.openScheduleEdit}
          onDelete={editor.remove.openScheduleDelete}
          onAddForDay={editor.addHours.prepareScheduleForDay}
        />
        <AddHoursForm form={editor.addHours} />
      </div>

      <div className="schedule-layout schedule-layout--overrides">
        <OverridesSection
          overrides={data.overrides}
          sortedOverrides={data.sortedOverrides}
          overrideCount={data.overrideList.length}
          onEdit={editor.overrideEdit.openOverrideEdit}
          onDelete={editor.remove.openOverrideDelete}
        />
        <AddOverrideForm form={editor.addOverride} />
      </div>

      <ScheduleDeleteDialog dialog={editor.remove} />
      <ScheduleEditDialog dialog={editor.scheduleEdit} />
      <OverrideEditDialog dialog={editor.overrideEdit} />
    </div>
  );
}
