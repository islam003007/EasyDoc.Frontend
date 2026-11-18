import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDays } from 'date-fns';
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  CalendarX2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { describeError } from '../api/client';
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
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorPanel } from '../components/ErrorPanel';
import { Spinner, Skeleton } from '../components/Loading';
import { Modal } from '../components/Modal';
import { Monogram } from '../components/Monogram';
import { Notice } from '../components/Notice';
import { PageHeader } from '../components/PageHeader';
import { StatGrid } from '../components/StatGrid';
import {
  dayName,
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatTimeRange,
  timeSortKey,
  toDateInputValue,
  toTimePayload,
  todayIso,
} from '../lib/dates';
import { plural } from '../lib/format';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const WEEK = [1, 2, 3, 4, 5, 6, 0];

type DeleteTarget =
  | { kind: 'schedule'; schedule: DoctorSchedule }
  | { kind: 'override'; override: ScheduleOverride };

export function DoctorSchedulePage() {
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
      setNotice(`Added ${dayName(scheduleDay)} hours to the weekly schedule.`);
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
          : 'Schedule override removed.',
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
      setNotice(`Updated ${dayName(input.dayOfWeek)} consulting hours.`);
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

  const scheduleOrder =
    timeSortKey(scheduleEnd) > timeSortKey(scheduleStart);
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
      endTime: overrideEditAvailable
        ? toTimePayload(overrideEditEnd)
        : undefined,
    });
  }

  return (
    <div className="page page--schedule">
      <PageHeader
        eyebrow="Schedule · Doctor"
        index="02"
        title={
          <>
            Shape
            <br />
            <em>the week.</em>
          </>
        }
        lead="Weekly hours generate the slots patients can book. Date overrides replace those hours for one day — extra clinic time or a full day off."
        actions={
          <Link to="/doctor" className="btn btn--secondary">
            <CalendarCheck2 size={16} aria-hidden="true" />
            Back to board
          </Link>
        }
      />

      {notice ? (
        <Notice onDismiss={() => setNotice(null)}>{notice}</Notice>
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
        <div className="practice-strip practice-strip--loading" aria-hidden="true">
          <Skeleton width="3.6rem" height="3.6rem" className="skeleton--round" />
          <div>
            <Skeleton width="9rem" height="0.7rem" />
            <Skeleton width="14rem" height="1.4rem" />
          </div>
        </div>
      ) : null}

      {doctorQuery.data ? (
        <div className="practice-strip">
          <Monogram name={doctorQuery.data.personName} size="md" />
          <div>
            <p className="mono-label">Availability owner</p>
            <h2>{doctorQuery.data.personName}</h2>
          </div>
          <p>
            {doctorQuery.data.department ?? 'Care team'} ·{' '}
            {doctorQuery.data.city ?? 'Egypt'}
          </p>
          <Link to="/doctor/profile" className="text-link">
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

      {schedules.isSuccess || overrides.isSuccess ? (
        <StatGrid
          stats={[
            {
              label: 'Consulting days',
              value: stats.days,
              note: 'Days with weekly hours',
              tone: 'scheduled',
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
              tone: 'pending',
            },
          ]}
        />
      ) : null}

      <div className="schedule-layout">
        <section className="paper-section schedule-section" aria-labelledby="weekly-heading">
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Weekly rhythm</p>
              <h2 id="weekly-heading">Consulting hours.</h2>
            </div>
            <span className="mono-label">
              {plural(weeklySchedules.length, 'window')}
            </span>
          </div>

          {schedules.isPending ? (
            <div className="week-grid" aria-busy="true" aria-label="Loading schedule">
              {WEEK.map((day) => (
                <div key={day} className="week-row">
                  <Skeleton width="5rem" height="1.2rem" />
                  <Skeleton width="10rem" height="2.2rem" />
                </div>
              ))}
            </div>
          ) : null}

          {schedules.isSuccess ? (
            <div className="week-grid">
              {WEEK.map((day) => {
                const daySchedules = weeklySchedules.filter(
                  (schedule) => schedule.dayOfWeek === day,
                );
                return (
                  <div key={day} className="week-row">
                    <div className="week-row__day">
                      <span>{dayName(day).slice(0, 3)}</span>
                      <strong>{dayName(day)}</strong>
                    </div>
                    <div className="week-row__windows">
                      {daySchedules.length === 0 ? (
                        <span className="week-row__empty">Not consulting</span>
                      ) : (
                        daySchedules.map((schedule) => (
                          <span key={schedule.id} className="schedule-window">
                            <Clock3 size={13} aria-hidden="true" />
                            {formatTimeRange(schedule.startTime, schedule.endTime)}
                            <button
                              type="button"
                              className="schedule-window__edit"
                              aria-label={`Edit ${dayName(day)} hours`}
                              title="Edit this window"
                              onClick={() => openScheduleEdit(schedule)}
                            >
                              <Pencil size={12} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="schedule-window__delete"
                              aria-label={`Delete ${dayName(day)} hours`}
                              onClick={() =>
                                setDeleteTarget({ kind: 'schedule', schedule })
                              }
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-button--soft"
                      onClick={() => prepareScheduleForDay(day)}
                      aria-label={`Add hours for ${dayName(day)}`}
                      title={`Add ${dayName(day)} hours`}
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>

        <aside className="side-card" aria-labelledby="add-hours-heading">
          <p className="eyebrow">Add a window</p>
          <h2 id="add-hours-heading">More consulting time.</h2>
          <form id="add-hours-form" className="form-stack" onSubmit={submitSchedule}>
            <label className="field">
              <span>Day</span>
              <select
                value={scheduleDay}
                onChange={(event) => setScheduleDay(Number(event.target.value))}
              >
                {WEEK.map((day) => (
                  <option key={day} value={day}>
                    {dayName(day)}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span>From</span>
                <input
                  type="time"
                  value={scheduleStart}
                  onChange={(event) => setScheduleStart(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>To</span>
                <input
                  type="time"
                  value={scheduleEnd}
                  onChange={(event) => setScheduleEnd(event.target.value)}
                  required
                />
              </label>
            </div>

            {!scheduleOrder ? (
              <p className="form-hint form-hint--error">
                The end time must be after the start time.
              </p>
            ) : (
              <p className="form-hint">
                This adds one weekly window. Existing windows stay in place.
              </p>
            )}

            {addSchedule.isError ? (
              <p className="form-error" role="alert">
                {describeError(addSchedule.error)}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={addSchedule.isPending || !scheduleOrder}
            >
              {addSchedule.isPending ? <Spinner /> : <CalendarPlus size={16} aria-hidden="true" />}
              {addSchedule.isPending ? 'Adding hours…' : 'Add weekly hours'}
            </button>
          </form>
        </aside>
      </div>

      <div className="schedule-layout schedule-layout--overrides">
        <section
          className="paper-section schedule-section"
          aria-labelledby="overrides-heading"
        >
          <div className="section-heading section-heading--row">
            <div>
              <p className="eyebrow">Exceptions</p>
              <h2 id="overrides-heading">Date overrides.</h2>
            </div>
            <span className="mono-label">{plural(overrideList.length, 'override')}</span>
          </div>

          {overrides.isPending ? (
            <div className="override-list" aria-busy="true" aria-label="Loading overrides">
              {[0, 1].map((index) => (
                <Skeleton key={index} height="4.2rem" />
              ))}
            </div>
          ) : null}

          {overrides.isSuccess && sortedOverrides.length === 0 ? (
            <EmptyState
              icon={<CalendarX2 />}
              title="No exceptions on file."
              description="Weekly hours apply every week until you close a specific date or give it different hours."
            />
          ) : null}

          {overrides.isSuccess && sortedOverrides.length > 0 ? (
            <div className="override-list">
              {sortedOverrides.map((override) => (
                <article key={override.id} className="override-card">
                  <div className="override-card__date" aria-hidden="true">
                    <strong>{formatDayNumber(override.date)}</strong>
                    <span>{formatMonthShort(override.date)}</span>
                  </div>
                  <div className="override-card__body">
                    <p className="mono-label">
                      {formatDateLong(override.date)}
                    </p>
                    <h3>
                      {override.isAvailable
                        ? `Extra hours · ${formatTimeRange(override.startTime ?? '', override.endTime ?? '')}`
                        : 'Closed all day'}
                    </h3>
                  </div>
                  <span
                    className={`status-pill ${override.isAvailable ? 'status-pill--scheduled' : 'status-pill--canceled'}`}
                  >
                    <span className="status-pill__dot" aria-hidden="true" />
                    {override.isAvailable ? 'Open' : 'Closed'}
                  </span>
                  <div className="override-card__actions">
                    <button
                      type="button"
                      className="icon-button icon-button--soft"
                      onClick={() => openOverrideEdit(override)}
                      aria-label={`Edit override for ${override.date}`}
                      title="Edit override"
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setDeleteTarget({ kind: 'override', override })}
                      aria-label={`Delete override for ${override.date}`}
                      title="Delete override"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>

        <aside className="side-card" aria-labelledby="add-override-heading">
          <p className="eyebrow">Add an exception</p>
          <h2 id="add-override-heading">Change one date.</h2>
          <form className="form-stack" onSubmit={submitOverride}>
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={overrideDate}
                min={todayIso()}
                onChange={(event) => setOverrideDate(event.target.value)}
                required
              />
            </label>

            <fieldset className="field field--fieldset">
              <legend>What happens that day?</legend>
              <div className="radio-row">
                <label className={`radio-card ${!overrideAvailable ? 'is-selected' : ''}`.trim()}>
                  <input
                    type="radio"
                    name="override-availability"
                    checked={!overrideAvailable}
                    onChange={() => setOverrideAvailable(false)}
                  />
                  <CalendarX2 size={16} aria-hidden="true" />
                  <span>
                    <strong>Close the day</strong>
                    <small>No slots, all day</small>
                  </span>
                </label>
                <label className={`radio-card ${overrideAvailable ? 'is-selected' : ''}`.trim()}>
                  <input
                    type="radio"
                    name="override-availability"
                    checked={overrideAvailable}
                    onChange={() => setOverrideAvailable(true)}
                  />
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>
                    <strong>Change hours</strong>
                    <small>Open a custom window</small>
                  </span>
                </label>
              </div>
            </fieldset>

            {overrideAvailable ? (
              <div className="field-row">
                <label className="field">
                  <span>From</span>
                  <input
                    type="time"
                    value={overrideStart}
                    onChange={(event) => setOverrideStart(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>To</span>
                  <input
                    type="time"
                    value={overrideEnd}
                    onChange={(event) => setOverrideEnd(event.target.value)}
                    required
                  />
                </label>
              </div>
            ) : null}

            {!overrideOrder ? (
              <p className="form-hint form-hint--error">
                The end time must be after the start time.
              </p>
            ) : (
              <p className="form-hint">
                An override replaces the weekly schedule for this date only.
              </p>
            )}

            {addOverride.isError ? (
              <p className="form-error" role="alert">
                {describeError(addOverride.error)}
              </p>
            ) : null}

            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={
                addOverride.isPending ||
                !overrideOrder ||
                !overrideDate
              }
            >
              {addOverride.isPending ? <Spinner /> : <CalendarPlus size={16} aria-hidden="true" />}
              {addOverride.isPending ? 'Saving override…' : 'Save override'}
            </button>
          </form>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.kind === 'schedule'
            ? 'Remove these weekly hours?'
            : 'Remove this date override?'
        }
        description={
          deleteTarget?.kind === 'schedule'
            ? `${dayName(deleteTarget.schedule.dayOfWeek)} · ${formatTimeRange(deleteTarget.schedule.startTime, deleteTarget.schedule.endTime)} will stop producing bookable slots. Existing appointments are not canceled.`
            : deleteTarget?.kind === 'override'
              ? `${formatDateLong(deleteTarget.override.date)} will return to the normal weekly schedule. Existing appointments are not canceled.`
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
          if (!remove.isPending) {
            setDeleteTarget(null);
            remove.reset();
          }
        }}
      />

      <Modal
        open={Boolean(scheduleEditTarget)}
        title="Edit consulting hours."
        eyebrow="Weekly window"
        description="Update this existing window. The week’s other consulting hours stay exactly as they are."
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
              form="edit-schedule-form"
              className="btn btn--primary"
              disabled={saveSchedule.isPending || !scheduleEditOrder}
            >
              {saveSchedule.isPending ? <Spinner /> : <Pencil size={16} aria-hidden="true" />}
              {saveSchedule.isPending ? 'Saving hours…' : 'Save hours'}
            </button>
          </>
        }
      >
        {scheduleEditTarget ? (
          <form
            id="edit-schedule-form"
            className="form-stack"
            onSubmit={submitScheduleEdit}
          >
            <p className="modal-context">
              <span className="mono-label">Current window</span>
              {dayName(scheduleEditTarget.dayOfWeek)} ·{' '}
              {formatTimeRange(
                scheduleEditTarget.startTime,
                scheduleEditTarget.endTime,
              )}
            </p>

            <label className="field">
              <span>Day</span>
              <select
                value={scheduleEditDay}
                onChange={(event) =>
                  setScheduleEditDay(Number(event.target.value))
                }
                data-autofocus
              >
                {WEEK.map((day) => (
                  <option key={day} value={day}>
                    {dayName(day)}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-row">
              <label className="field">
                <span>From</span>
                <input
                  type="time"
                  value={scheduleEditStart}
                  onChange={(event) => setScheduleEditStart(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>To</span>
                <input
                  type="time"
                  value={scheduleEditEnd}
                  onChange={(event) => setScheduleEditEnd(event.target.value)}
                  required
                />
              </label>
            </div>

            {!scheduleEditOrder ? (
              <p className="form-hint form-hint--error">
                The end time must be after the start time.
              </p>
            ) : (
              <p className="form-hint">
                Patients see the new hours as soon as this saves.
              </p>
            )}

            {saveSchedule.isError ? (
              <p className="form-error" role="alert">
                {describeError(saveSchedule.error)}
              </p>
            ) : null}
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(overrideEditTarget)}
        title="Edit date override."
        eyebrow="Exception"
        description="Change how this one date behaves without touching the regular weekly hours."
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
              disabled={
                saveOverride.isPending ||
                !overrideEditOrder ||
                !overrideEditDate
              }
            >
              {saveOverride.isPending ? <Spinner /> : <Pencil size={16} aria-hidden="true" />}
              {saveOverride.isPending ? 'Saving override…' : 'Save override'}
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
            <p className="modal-context">
              <span className="mono-label">Current override</span>
              {formatDateLong(overrideEditTarget.date)} ·{' '}
              {overrideEditTarget.isAvailable
                ? `Extra hours · ${formatTimeRange(
                    overrideEditTarget.startTime ?? '',
                    overrideEditTarget.endTime ?? '',
                  )}`
                : 'Closed all day'}
            </p>

            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={overrideEditDate}
                onChange={(event) => setOverrideEditDate(event.target.value)}
                required
                data-autofocus
              />
            </label>

            <fieldset className="field field--fieldset">
              <legend>What happens that day?</legend>
              <div className="radio-row">
                <label
                  className={`radio-card ${!overrideEditAvailable ? 'is-selected' : ''}`.trim()}
                >
                  <input
                    type="radio"
                    name="edit-override-availability"
                    checked={!overrideEditAvailable}
                    onChange={() => setOverrideEditAvailable(false)}
                  />
                  <CalendarX2 size={16} aria-hidden="true" />
                  <span>
                    <strong>Close the day</strong>
                    <small>No slots, all day</small>
                  </span>
                </label>
                <label
                  className={`radio-card ${overrideEditAvailable ? 'is-selected' : ''}`.trim()}
                >
                  <input
                    type="radio"
                    name="edit-override-availability"
                    checked={overrideEditAvailable}
                    onChange={() => setOverrideEditAvailable(true)}
                  />
                  <CalendarDays size={16} aria-hidden="true" />
                  <span>
                    <strong>Change hours</strong>
                    <small>Open a custom window</small>
                  </span>
                </label>
              </div>
            </fieldset>

            {overrideEditAvailable ? (
              <div className="field-row">
                <label className="field">
                  <span>From</span>
                  <input
                    type="time"
                    value={overrideEditStart}
                    onChange={(event) => setOverrideEditStart(event.target.value)}
                    required
                  />
                </label>
                <label className="field">
                  <span>To</span>
                  <input
                    type="time"
                    value={overrideEditEnd}
                    onChange={(event) => setOverrideEditEnd(event.target.value)}
                    required
                  />
                </label>
              </div>
            ) : null}

            {!overrideEditOrder ? (
              <p className="form-hint form-hint--error">
                The end time must be after the start time.
              </p>
            ) : (
              <p className="form-hint">
                This override replaces the weekly schedule for this date only.
              </p>
            )}

            {saveOverride.isError ? (
              <p className="form-error" role="alert">
                {describeError(saveOverride.error)}
              </p>
            ) : null}
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
