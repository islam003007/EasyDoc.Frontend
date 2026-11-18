import { useQuery } from '@tanstack/react-query';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import { fetchAdminPatient, queryKeys } from '../api/queries';
import { ErrorPanel } from './ErrorPanel';
import { Skeleton } from './Loading';
import { Modal } from './Modal';
import { Monogram } from './Monogram';

export function AdminPatientDetailModal({
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
    <Modal
      open
      title="Patient record."
      eyebrow="Admin · Patients"
      description="A read-only account record. Medical history and appointment notes are not exposed in the admin directory."
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
          title="This patient record could not be loaded"
          onRetry={() => {
            void patientQuery.refetch();
          }}
          compact
        />
      ) : null}

      {patientQuery.isPending ? (
        <div className="form-stack" aria-busy="true" aria-label="Loading patient record">
          <Skeleton width="100%" height="5rem" />
          <Skeleton width="100%" height="8rem" />
        </div>
      ) : null}

      {patientQuery.data ? (
        <div className="patient-record">
          <div className="patient-record__identity">
            <Monogram name={patientQuery.data.personName} size="lg" />
            <div>
              <p className="mono-label">Patient account</p>
              <h3>{patientQuery.data.personName}</h3>
              <span
                className={`status-pill ${patientQuery.data.isDeleted ? 'status-pill--canceled' : 'status-pill--scheduled'}`}
              >
                <span className="status-pill__dot" aria-hidden="true" />
                {patientQuery.data.isDeleted ? 'Archived' : 'Active'}
              </span>
            </div>
          </div>

          <dl className="visit-detail__facts">
            <div>
              <dt>
                <Mail size={13} aria-hidden="true" /> Email
              </dt>
              <dd>{patientQuery.data.email || 'No email on file'}</dd>
            </div>
            <div>
              <dt>
                <Phone size={13} aria-hidden="true" /> Phone
              </dt>
              <dd className="code-value">
                {patientQuery.data.phoneNumber ?? '—'}
              </dd>
            </div>
          </dl>

          <div className="admin-note">
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              This drawer is read-only. There are no delete, archive, or edit
              actions for patient accounts in this admin client.
            </p>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
