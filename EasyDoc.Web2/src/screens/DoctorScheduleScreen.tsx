import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import {
  ArrowRight,
  CalendarCheck2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { DoctorSchedule, ScheduleOverride } from '../api/contracts';
import {
  createOverride,
  createSchedule,
  deleteOverride,
  deleteSchedule,
  fetchDoctorMe,
  fetchOverrides,
  fetchSchedules,
  queryKeys,
  updateOverride,
  updateSchedule,
} from '../api/queries';
import { useSession } from '../auth/SessionProvider';
import {
  dayName,
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatTimeRange,
  formatWeekdayShort,
  timeSortKey,
  toDateInputValue,
  toTimePayload,
  todayIso,
} from '../lib/dates';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Dialog } from '../ui/Dialog';
import { ErrorPanel, InlineError } from '../ui/ErrorPanel';
import { Field } from '../ui/Field';
import { Skeleton, Spinner } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';
import { StatStrip } from '../ui/StatStrip';

const WEEK = [1, 2, 3, 4, 5, 6, 0];

type DeleteTarget =
  | { kind: 'schedule'; schedule: DoctorSchedule }
  | { kind: 'override'; override: ScheduleOverride };

export function DoctorScheduleScreen() {
  useDocumentTitle('Schedule');
  const { session } = useSession();
  const queryClient = useQueryClient();

  const [notice, setNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [scheduleEditTarget, setScheduleEditTarget] =
    useState<DoctorSchedule | null>(null);
  const [scheduleEditDay, setScheduleEditDay] = useState(1);
  const [scheduleEditStart, setScheduleEditStart] = useState('09:00');
  const [scheduleEditEnd, setScheduleEditEnd] = useState('14:00');

  const [overrideEditTarget, setOverrideEditTarget] =
    useState<ScheduleOverride | null>(null);
  const [overrideEditDate, setOverrideEditDate] = useState('');
  const [overrideEditAvailable, setOverrideEditAvailable] = useState(false);
  const [overrideEditStart, setOverrideEditStart] = useState('09:00');
  const [overrideEditEnd, setOverrideEditEnd] = useState('12:00');

  const [scheduleDay, setScheduleDay] = useState(1);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('14:00');

  const [overrideDate, setOverrideDate] = useState(
    toDateInputValue(addDays(new Date(), 1)),
  );
  const [overrideAvailable, setOverrideAvailable] = useState(false);
  const [overrideStart, setOverrideStart] = useState('09:00');
  const [overrideEnd, setOverrideEnd] = useState('12:00');

  const doctorQuery = useQuery({
    queryKey: queryKeys.doctorMe,
    queryFn: ({ signal }) => fetchDoctorMe(signal),
  });

  const doctorId = session?.doctorId ?? doctorQuery.data?.id ?? '';

  const schedules = useQuery({
    queryKey: queryKeys.schedules(doctorId),
    queryFn: ({ signal }) => fetchSchedules(doctorId, signal),
    enabled: Boolean(doctorId),
  });

  const overrides = useQuery({
    queryKey: queryKeys.overrides(doctorId),
    queryFn: ({ signal }) => fetchOverrides(doctorId, signal),
    enabled: Boolean(doctorId),
  });

  function invalidateScheduleData(kind?: 'schedule' | 'override') {
    if (!doctorId) return;
    if (!kind || kind === 'schedule') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schedules(doctorId) });
    }
    if (!kind || kind === 'override') {
      void queryClient.invalidateQueries({ queryKey: queryKeys.overrides(doctorId) });
    }
  }

  const addSchedule = useMutation({
    mutationFn: () =>
      createSchedule({
        dayOfWeek: scheduleDay,
        startTime: toTimePayload(scheduleStart),
        endTime: toTimePayload(scheduleEnd),
      }),
    onSuccess: () => {
      setNotice(`Added ${dayName(scheduleDay)} hours to the week.`);
      invalidateScheduleData('schedule');
    },
  });

  const addOverride = useMutation({
    mutationFn: () =>
      createOverride({
        date: overrideDate,
        isAvailable: overrideAvailable,
        startTime: overrideAvailable ? toTimePayload(overrideStart) : undefined,
        endTime: overrideAvailable ? toTimePayload(overrideEnd) : undefined,
      }),
    onSuccess: () => {
      setNotice(
        overrideAvailable
          ? `Extra hours added for ${formatDateLong(overrideDate)}.`
          : `${formatDateLong(overrideDate)} is now closed.`,
      );
      invalidateScheduleData('override');
    },
  });

  const remove = useMutation({
    mutationFn: (target: DeleteTarget) =>
      target.kind === 'schedule'
        ? deleteSchedule(target.schedule.id)
        : deleteOverride(target.override.id),
    onSuccess: (_data, target) => {
      setDeleteTarget(null);
      setNotice(
        target.kind === 'schedule'
          ? 'Consulting hours removed from the week.'
          : 'Date override removed.',
      );
      invalidateScheduleData(target.kind === 'schedule' ? 'schedule' : 'override');
    },
  });

  const saveSchedule = useMutation({
    mutationFn: (input: {
      scheduleId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => updateSchedule(input),
    onSuccess: (_data, input) => {
      setScheduleEditTarget(null);
      setNotice(`Updated ${dayName(input.dayOfWeek)} hours.`);
      invalidateScheduleData('schedule');
    },
  });

  const saveOverride = useMutation({
    mutationFn: (input: {
      overrideId: string;
      date: string;
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
    }) =>
      updateOverride({
        ...input,
        startTime: input.isAvailable ? input.startTime : undefined,
        endTime: input.isAvailable ? input.endTime : undefined,
      }),
    onSuccess: (_data, input) => {
      setOverrideEditTarget(null);
      setNotice(
        input.isAvailable
          ? `Updated the extra hours for ${formatDateLong(input.date)}.`
          : `${formatDateLong(input.date)} remains closed.`,
      );
      invalidateScheduleData('override');
    },
  });

  const weeklySchedules = schedules.data ?? [];
  const overrideList = overrides.data ?? [];

  const stats = useMemo(() => {
    const totalMinutes = weeklySchedules.reduce(
      (total, schedule) =>
        total +
        Math.max(0, timeSortKey(schedule.endTime) - timeSortKey(schedule.startTime)),
      0,
    );
    const days = new Set(weeklySchedules.map((schedule) => schedule.dayOfWeek)).size;
    const futureOverrides = overrideList.filter(
      (override) => override.date >= todayIso(),
    ).length;

    return {
      hours:
        totalMinutes % 60 === 0
          ? String(totalMinutes / 60)
          : (totalMinutes / 60).toFixed(1),
      days,
      futureOverrides,
    };
  }, [weeklySchedules, overrideList]);

  const sortedOverrides = useMemo(
    () => [...overrideList].sort((a, b) => a.date.localeCompare(b.date)),
    [overrideList],
  );

  const scheduleOrder = timeSortKey(scheduleEnd) > timeSortKey(scheduleStart);
  const overrideOrder =
    !overrideAvailable || timeSortKey(overrideEnd) > timeSortKey(overrideStart);
  const scheduleEditOrder =
    timeSortKey(scheduleEditEnd) > timeSortKey(scheduleEditStart);
  const overrideEditOrder =
    !overrideEditAvailable ||
    timeSortKey(overrideEditEnd) > timeSortKey(overrideEditStart);

  function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleOrder) return;
    addSchedule.mutate();
  }

  function submitOverride(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!overrideOrder || !overrideDate) return;
    addOverride.mutate();
  }

  function prepareScheduleForDay(day: number) {
    setScheduleDay(day);
    document
      .getElementById('add-hours-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function openScheduleEdit(schedule: DoctorSchedule) {
    setScheduleEditTarget(schedule);
    setScheduleEditDay(schedule.dayOfWeek);
    setScheduleEditStart(schedule.startTime.slice(0, 5));
    setScheduleEditEnd(schedule.endTime.slice(0, 5));
    saveSchedule.reset();
  }

  function submitScheduleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!scheduleEditTarget || !scheduleEditOrder) return;
    saveSchedule.mutate({
      scheduleId: scheduleEditTarget.id,
      dayOfWeek: scheduleEditDay,
      startTime: toTimePayload(scheduleEditStart),
      endTime: toTimePayload(scheduleEditEnd),
    });
  }

  function openOverrideEdit(override: ScheduleOverride) {
    setOverrideEditTarget(override);
    setOverrideEditDate(override.date);
    setOverrideEditAvailable(override.isAvailable);
    setOverrideEditStart(override.startTime?.slice(0, 5) ?? '09:00');
    setOverrideEditEnd(override.endTime?.slice(0, 5) ?? '12:00');
    saveOverride.reset();
  }

  function submitOverrideEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!overrideEditTarget || !overrideEditDate || !overrideEditOrder) return;
    saveOverride.mutate({
      overrideId: overrideEditTarget.id,
      date: overrideEditDate,
      isAvailable: overrideEditAvailable,
      startTime: overrideEditAvailable
        ? toTimePayload(overrideEditStart)
        : undefined,
      endTime: overrideEditAvailable ? toTimePayload(overrideEditEnd) : undefined,
    });
  }

  return (
    <div className="page">
      <PageHeader
        title="Shape the week."
        lead="Weekly hours generate the times patients can book. A date override replaces those hours for one day — extra clinic time or a full day off."
        actions={
          <Link to="/doctor" className="btn btn--secondary">
            <CalendarCheck2 size={15} aria-hidden="true" />
            Back to board
          </Link>
        }
      />

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
      ) : null}

      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="Your doctor profile could not be loaded"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {doctorQuery.isPending ? (
        <div className="practice-strip" aria-busy="true">
          <Skeleton width="40px" height="40px" />
          <div className="stack--tight">
            <Skeleton width="9rem" height="0.65rem" />
            <Skeleton width="13rem" height="1.2rem" />
          </div>
        </div>
      ) : null}

      {doctorQuery.data ? (
        <div className="practice-strip">
          <Monogram name={doctorQuery.data.personName} size="md" />
          <div className="practice-strip__copy">
            <p className="mini-label">Your consulting hours</p>
            <h2>
              <bdi dir="auto">{doctorQuery.data.personName}</bdi>
            </h2>
            <p className="practice-strip__meta">
              {doctorQuery.data.department ?? 'Care team'},{' '}
              {doctorQuery.data.city ?? 'Egypt'}
            </p>
          </div>
          <Link to="/doctor/profile" className="text-link practice-strip__link">
            Public profile
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      {schedules.isError || overrides.isError ? (
        <ErrorPanel
          error={schedules.error ?? overrides.error}
          title="Schedule data could not be loaded"
          onRetry={() => {
            void schedules.refetch();
            void overrides.refetch();
          }}
        />
      ) : null}

      {schedules.isSuccess ? (
        <StatStrip
          items={[
            {
              label: 'Consulting days',
              value: stats.days,
              note: 'Days with weekly hours',
            },
            {
              label: 'Weekly hours',
              value: `${stats.hours}h`,
              note: 'Before date overrides',
            },
            {
              label: 'Overrides',
              value: overrideList.length,
              note: `${stats.futureOverrides} still ahead`,
            },
          ]}
        />
      ) : null}

      <div className="schedule-layout">
        <section className="sheet" aria-labelledby="weekly-heading">
          <div className="sheet__head">
            <div>
              <p className="sheet__kicker">Weekly rhythm</p>
              <h2 id="weekly-heading">Consulting hours.</h2>
            </div>
            <span className="mini-label tnum">
              {weeklySchedules.length}{' '}
              {weeklySchedules.length === 1 ? 'window' : 'windows'}
            </span>
          </div>
          <div className="sheet__body">
            {schedules.isPending ? (
              <div className="week-list" aria-busy="true" aria-label="Loading schedule">
                {WEEK.map((day) => (
                  <div key={day} className="week-day">
                    <Skeleton width="4.5rem" height="1rem" />
                    <Skeleton width="10rem" height="1.8rem" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="week-list">
                {WEEK.map((day) => {
                  const daySchedules = weeklySchedules.filter(
                    (schedule) => schedule.dayOfWeek === day,
                  );
                  return (
                    <div key={day} className="week-day">
                      <div className="week-day__name">
                        <strong>{dayName(day)}</strong>
                      </div>
                      <div className="week-day__windows">
                        {daySchedules.length === 0 ? (
                          <span className="week-day__empty">Not consulting</span>
                        ) : (
                          daySchedules.map((schedule) => (
                            <span key={schedule.id} className="window">
                              <Clock3 size={12} aria-hidden="true" />
                              <span className="tnum">
                                {formatTimeRange(
                                  schedule.startTime,
                                  schedule.endTime,
                                )}
                              </span>
                              <button
                                type="button"
                                className="window__action"
                                aria-label={`Edit ${dayName(day)} hours`}
                                title="Edit this window"
                                onClick={() => openScheduleEdit(schedule)}
                              >
                                <Pencil size={11} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="window__action window__action--danger"
                                aria-label={`Remove ${dayName(day)} hours`}
                                title="Remove this window"
                                onClick={() => {
                                  remove.reset();
                                  setDeleteTarget({ kind: 'schedule', schedule });
                                }}
                              >
                                <Trash2 size={11} aria-hidden="true" />
                              </button>
                            </span>
                          ))
                        )}
                        <button
                          type="button"
                          className="week-day__add"
                          onClick={() => prepareScheduleForDay(day)}
                        >
                          <Plus size={11} aria-hidden="true" />
                          Add hours
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="sheet">
          <div className="sheet__head">
            <div>
              <p className="sheet__kicker">Weekly hours</p>
              <h2>Add consulting time.</h2>
            </div>
          </div>
          <div className="sheet__body">
            <form
              id="add-hours-form"
              className="form-stack"
              onSubmit={submitSchedule}
            >
              <Field id="add-hours-day" label="Day">
                <select
                  id="add-hours-day"
                  value={scheduleDay}
                  onChange={(event) => setScheduleDay(Number(event.target.value))}
                >
                  {WEEK.map((day) => (
                    <option key={day} value={day}>
                      {dayName(day)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="form-row">
                <Field id="add-hours-start" label="From">
                  <input
                    id="add-hours-start"
                    type="time"
                    value={scheduleStart}
                    onChange={(event) => setScheduleStart(event.target.value)}
                  />
                </Field>
                <Field id="add-hours-end" label="To">
                  <input
                    id="add-hours-end"
                    type="time"
                    value={scheduleEnd}
                    onChange={(event) => setScheduleEnd(event.target.value)}
                  />
                </Field>
              </div>
              {!scheduleOrder ? (
                <p className="field__error" role="alert">
                  The end time must be after the start time.
                </p>
              ) : null}
              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={!scheduleOrder || addSchedule.isPending}
              >
                {addSchedule.isPending ? <Spinner /> : <Plus size={15} aria-hidden="true" />}
                {addSchedule.isPending ? 'Adding…' : 'Add hours'}
              </button>
              {addSchedule.isError ? <InlineError error={addSchedule.error} /> : null}
              <p className="schedule-note">
                These windows become the bookable times on the patient side.
                Date overrides replace them for a single day.
              </p>
            </form>
          </div>
        </aside>
      </div>

      <div className="schedule-layout schedule-layout--overrides">
        <section className="sheet" aria-labelledby="overrides-heading">
          <div className="sheet__head">
            <div>
              <p className="sheet__kicker">Exceptions</p>
              <h2 id="overrides-heading">Date overrides.</h2>
            </div>
            <span className="mini-label tnum">
              {overrideList.length}{' '}
              {overrideList.length === 1 ? 'override' : 'overrides'}
            </span>
          </div>
          <div className="sheet__body">
            {overrides.isPending ? (
              <div className="stack" aria-busy="true">
                <Skeleton height="3rem" />
                <Skeleton height="3rem" />
              </div>
            ) : null}

            {overrides.isSuccess && sortedOverrides.length === 0 ? (
              <p className="quiet">
                No date overrides. The weekly hours apply to every week until you
                add one.
              </p>
            ) : null}

            {sortedOverrides.length > 0 ? (
              <div className="override-list">
                {sortedOverrides.map((override) => (
                  <article key={override.id} className="override-row">
                    <div className="override-row__date">
                      <span>{formatWeekdayShort(override.date)}</span>
                      <strong className="tnum">{formatDayNumber(override.date)}</strong>
                      <span>{formatMonthShort(override.date)}</span>
                    </div>
                    <div className="override-row__copy">
                      <strong>
                        {override.isAvailable ? 'Extra hours' : 'Closed all day'}
                      </strong>
                      <p>
                        {override.isAvailable &&
                        override.startTime &&
                        override.endTime
                          ? `${formatTimeRange(override.startTime, override.endTime)} on ${formatDateLong(override.date)}`
                          : formatDateLong(override.date)}
                      </p>
                    </div>
                    <div className="override-row__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => openOverrideEdit(override)}
                      >
                        <Pencil size={13} aria-hidden="true" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => {
                          remove.reset();
                          setDeleteTarget({ kind: 'override', override });
                        }}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="sheet">
          <div className="sheet__head">
            <div>
              <p className="sheet__kicker">One date</p>
              <h2>Change a day.</h2>
            </div>
          </div>
          <div className="sheet__body">
            <form className="form-stack" onSubmit={submitOverride}>
              <Field id="override-date" label="Date">
                <input
                  id="override-date"
                  type="date"
                  value={overrideDate}
                  onChange={(event) => setOverrideDate(event.target.value)}
                />
              </Field>

              <label className="check-line">
                <input
                  type="checkbox"
                  checked={overrideAvailable}
                  onChange={(event) =>
                    setOverrideAvailable(event.target.checked)
                  }
                />
                <span>Open extra hours instead of closing</span>
              </label>

              {overrideAvailable ? (
                <div className="form-row">
                  <Field id="override-start" label="From">
                    <input
                      id="override-start"
                      type="time"
                      value={overrideStart}
                      onChange={(event) => setOverrideStart(event.target.value)}
                    />
                  </Field>
                  <Field id="override-end" label="To">
                    <input
                      id="override-end"
                      type="time"
                      value={overrideEnd}
                      onChange={(event) => setOverrideEnd(event.target.value)}
                    />
                  </Field>
                </div>
              ) : null}

              {!overrideOrder ? (
                <p className="field__error" role="alert">
                  The end time must be after the start time.
                </p>
              ) : null}

              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={!overrideOrder || !overrideDate || addOverride.isPending}
              >
                {addOverride.isPending ? (
                  <Spinner />
                ) : (
                  <Plus size={15} aria-hidden="true" />
                )}
                {addOverride.isPending ? 'Saving…' : 'Add override'}
              </button>
              {addOverride.isError ? <InlineError error={addOverride.error} /> : null}
              <p className="schedule-note">
                Leave the box unchecked to close the whole day. Overrides win over
                the weekly hours for that date only.
              </p>
            </form>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.kind === 'schedule'
            ? 'Remove these consulting hours?'
            : 'Remove this date override?'
        }
        description={
          deleteTarget?.kind === 'schedule'
            ? `${formatTimeRange(
                deleteTarget.schedule.startTime,
                deleteTarget.schedule.endTime,
              )} on ${dayName(deleteTarget.schedule.dayOfWeek)} will no longer generate bookable times.`
            : deleteTarget?.kind === 'override'
              ? `The override on ${formatDateLong(deleteTarget.override.date)} will be removed and the weekly hours will apply again.`
              : ''
        }
        confirmLabel="Remove"
        pendingLabel="Removing…"
        pending={remove.isPending}
        error={remove.error}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget);
        }}
        onClose={() => {
          setDeleteTarget(null);
          remove.reset();
        }}
      />

      <Dialog
        open={Boolean(scheduleEditTarget)}
        title="Edit consulting hours"
        kicker="Weekly schedule"
        onClose={() => {
          if (!saveSchedule.isPending) {
            setScheduleEditTarget(null);
            saveSchedule.reset();
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setScheduleEditTarget(null);
                saveSchedule.reset();
              }}
              disabled={saveSchedule.isPending}
            >
              Keep current hours
            </button>
            <button
              type="submit"
              form="edit-hours-form"
              className="btn btn--primary"
              disabled={!scheduleEditOrder || saveSchedule.isPending}
            >
              {saveSchedule.isPending ? <Spinner /> : null}
              {saveSchedule.isPending ? 'Saving…' : 'Save hours'}
            </button>
          </>
        }
      >
        {scheduleEditTarget ? (
          <form
            id="edit-hours-form"
            className="form-stack"
            onSubmit={submitScheduleEdit}
          >
            <Field id="edit-hours-day" label="Day">
              <select
                id="edit-hours-day"
                value={scheduleEditDay}
                onChange={(event) => setScheduleEditDay(Number(event.target.value))}
              >
                {WEEK.map((day) => (
                  <option key={day} value={day}>
                    {dayName(day)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="form-row">
              <Field id="edit-hours-start" label="From">
                <input
                  id="edit-hours-start"
                  type="time"
                  value={scheduleEditStart}
                  onChange={(event) => setScheduleEditStart(event.target.value)}
                />
              </Field>
              <Field id="edit-hours-end" label="To">
                <input
                  id="edit-hours-end"
                  type="time"
                  value={scheduleEditEnd}
                  onChange={(event) => setScheduleEditEnd(event.target.value)}
                />
              </Field>
            </div>
            {!scheduleEditOrder ? (
              <p className="field__error" role="alert">
                The end time must be after the start time.
              </p>
            ) : null}
            {saveSchedule.isError ? <InlineError error={saveSchedule.error} /> : null}
          </form>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(overrideEditTarget)}
        title="Edit date override"
        kicker="One date"
        onClose={() => {
          if (!saveOverride.isPending) {
            setOverrideEditTarget(null);
            saveOverride.reset();
          }
        }}
        footer={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setOverrideEditTarget(null);
                saveOverride.reset();
              }}
              disabled={saveOverride.isPending}
            >
              Keep current override
            </button>
            <button
              type="submit"
              form="edit-override-form"
              className="btn btn--primary"
              disabled={!overrideEditOrder || saveOverride.isPending}
            >
              {saveOverride.isPending ? <Spinner /> : null}
              {saveOverride.isPending ? 'Saving…' : 'Save override'}
            </button>
          </>
        }
      >
        {overrideEditTarget ? (
          <form
            id="edit-override-form"
            className="form-stack"
            onSubmit={submitOverrideEdit}
          >
            <Field id="edit-override-date" label="Date">
              <input
                id="edit-override-date"
                type="date"
                value={overrideEditDate}
                onChange={(event) => setOverrideEditDate(event.target.value)}
              />
            </Field>
            <label className="check-line">
              <input
                type="checkbox"
                checked={overrideEditAvailable}
                onChange={(event) =>
                  setOverrideEditAvailable(event.target.checked)
                }
              />
              <span>Open extra hours instead of closing</span>
            </label>
            {overrideEditAvailable ? (
              <div className="form-row">
                <Field id="edit-override-start" label="From">
                  <input
                    id="edit-override-start"
                    type="time"
                    value={overrideEditStart}
                    onChange={(event) => setOverrideEditStart(event.target.value)}
                  />
                </Field>
                <Field id="edit-override-end" label="To">
                  <input
                    id="edit-override-end"
                    type="time"
                    value={overrideEditEnd}
                    onChange={(event) => setOverrideEditEnd(event.target.value)}
                  />
                </Field>
              </div>
            ) : null}
            {!overrideEditOrder ? (
              <p className="field__error" role="alert">
                The end time must be after the start time.
              </p>
            ) : null}
            {saveOverride.isError ? <InlineError error={saveOverride.error} /> : null}
          </form>
        ) : null}
      </Dialog>
    </div>
  );
}
