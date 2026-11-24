import { useQuery } from '@tanstack/react-query';
import type { AdminDoctor } from '../api/contracts';
import {
  fetchAdminDoctor,
  queryKeys,
  useCities,
} from '../api/queries';
import { DoctorEditForm } from '../features/admin/DoctorEditForm';
import { Dialog } from '../ui/Dialog';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';

export function AdminDoctorDialog({
  doctorId,
  onClose,
  onSaved,
}: {
  doctorId: string;
  onClose: () => void;
  onSaved: (doctor: AdminDoctor) => void;
}) {
  const doctorQuery = useQuery({
    queryKey: queryKeys.adminDoctor(doctorId),
    queryFn: ({ signal }) => fetchAdminDoctor(doctorId, signal),
  });
  const cities = useCities();

  if (doctorQuery.data && cities.isSuccess) {
    return (
      <DoctorEditForm
        key={doctorQuery.data.id}
        doctor={doctorQuery.data}
        cities={cities.data}
        onClose={onClose}
        onSaved={onSaved}
      />
    );
  }

  return (
    <Dialog
      open
      title="Edit doctor"
      kicker="Admin directory"
      onClose={onClose}
      wide
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="We couldn’t load this doctor’s record"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {cities.isError ? (
        <ErrorPanel
          error={cities.error}
          title="We couldn’t load the city list"
          onRetry={() => {
            void cities.refetch();
          }}
        />
      ) : null}

      {doctorQuery.isPending || cities.isPending ? (
        <div className="form-stack" aria-busy="true" aria-label="Loading doctor record">
          <Skeleton width="100%" height="4rem" />
          <div className="form-row">
            <Skeleton height="2.8rem" />
            <Skeleton height="2.8rem" />
          </div>
          <Skeleton width="100%" height="2.8rem" />
          <Skeleton width="100%" height="5rem" />
        </div>
      ) : null}
    </Dialog>
  );
}
