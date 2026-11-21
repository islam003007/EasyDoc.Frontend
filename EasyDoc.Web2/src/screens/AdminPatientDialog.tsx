import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import { fetchAdminPatient, queryKeys } from '../api/queries';
import { Dialog } from '../ui/Dialog';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';
import { Monogram } from '../ui/Monogram';
import { Stamp } from '../ui/Stamp';

export function AdminPatientDialog({
  patientId,
  onClose,
}: {
  patientId: string;
  onClose: () => void;
}) {
  const patientQuery = useQuery({
    queryKey: queryKeys.adminPatient(patientId),
    queryFn: ({ signal }) => fetchAdminPatient(patientId, signal),
  });

  return (
    <Dialog
      open
      title="Patient record"
      kicker="Admin patients"
      description="A read-only account record. Medical history and visit notes are not included in the admin directory."
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {patientQuery.isError ? (
        <ErrorPanel
          error={patientQuery.error}
          title="We couldn’t load this patient’s record"
          onRetry={() => {
            void patientQuery.refetch();
          }}
        />
      ) : null}

      {patientQuery.isPending ? (
        <div className="form-stack" aria-busy="true" aria-label="Loading patient record">
          <Skeleton width="100%" height="5rem" />
          <Skeleton width="100%" height="8rem" />
        </div>
      ) : null}

      {patientQuery.data ? (
        <div className="record">
          <div className="record__identity">
            <Monogram name={patientQuery.data.personName} size="lg" />
            <div>
              <h3><bdi dir="auto">{patientQuery.data.personName}</bdi></h3>
              <p>Patient account</p>
            </div>
            <Stamp tone={patientQuery.data.isDeleted ? 'void' : 'done'}>
              {patientQuery.data.isDeleted ? 'Archived' : 'Active'}
            </Stamp>
          </div>

          <dl className="facts-grid facts-grid--record">
            <div>
              <dt>
                <Mail size={12} aria-hidden="true" /> Email
              </dt>
              <dd>{patientQuery.data.email || 'No email on file'}</dd>
            </div>
            <div>
              <dt>
                <Phone size={12} aria-hidden="true" /> Phone
              </dt>
              <dd className="tnum" dir="ltr">
                {patientQuery.data.phoneNumber ?? 'Not provided'}
              </dd>
            </div>
          </dl>

          <div className="profile-callout" style={{ marginTop: '0.9rem' }}>
            <ShieldCheck size={16} aria-hidden="true" />
            <p>
              This record is read-only. Patient accounts can’t be edited,
              archived, or deleted from this admin view.
            </p>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
