import type { UseQueryResult } from '@tanstack/react-query';
import { ArrowRight, CalendarCheck2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  DoctorDetail,
  DoctorSchedule,
  ScheduleOverride,
} from '../../api/contracts';
import { ErrorPanel } from '../../ui/ErrorPanel';
import { Skeleton } from '../../ui/Loading';
import { Monogram } from '../../ui/Monogram';
import { Notice } from '../../ui/Notice';
import { PageHeader } from '../../ui/PageHeader';
import { StatStrip } from '../../ui/StatStrip';
import type { ScheduleStats } from './types';

export function ScheduleIntro({
  notice,
  onDismissNotice,
  doctorQuery,
  schedules,
  overrides,
  overrideCount,
  stats,
}: {
  notice: string | null;
  onDismissNotice: () => void;
  doctorQuery: UseQueryResult<DoctorDetail, Error>;
  schedules: UseQueryResult<DoctorSchedule[], Error>;
  overrides: UseQueryResult<ScheduleOverride[], Error>;
  overrideCount: number;
  stats: ScheduleStats;
}) {
  return (
    <>
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
        <Notice tone="success" onDismiss={onDismissNotice}>
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
              value: overrideCount,
              note: `${stats.futureOverrides} still ahead`,
            },
          ]}
        />
      ) : null}
    </>
  );
}
