import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { AdminDoctorsTable } from '../features/admin/AdminDoctorsTable';
import { useAdminDoctors } from '../features/admin/useAdminDoctors';
import { AdminDoctorDialog } from './AdminDoctorDialog';
import { AdminTabs } from '../ui/AdminTabs';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Notice } from '../ui/Notice';
import { PageHeader } from '../ui/PageHeader';

export function AdminDoctorsScreen() {
  useDocumentTitle('Doctor directory');
  const state = useAdminDoctors();
  const [editDoctorId, setEditDoctorId] = useState<string | null>(null);
  const { doctors, toggle, notice, setNotice } = state;

  return (
    <div className="page">
      <PageHeader
        kicker="Network admin"
        title="The doctor directory."
        lead="Every doctor profile, including the ones patients can’t see. Open a record to edit its public details, or switch visibility directly in the table."
        actions={
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              void doctors.refetch();
            }}
            disabled={doctors.isFetching}
          >
            <RefreshCw
              size={15}
              aria-hidden="true"
              className={doctors.isFetching ? 'spin' : undefined}
            />
            Refresh
          </button>
        }
      />

      <AdminTabs doctorCount={doctors.data?.length} />

      {notice ? (
        <Notice tone="success" onDismiss={() => setNotice(null)}>
          {notice}
        </Notice>
      ) : null}

      {toggle.isError ? (
        <Notice tone="error" onDismiss={() => toggle.reset()}>
          {toggle.error instanceof Error
            ? toggle.error.message
            : 'We couldn’t change visibility.'}
        </Notice>
      ) : null}

      {doctors.isError ? (
        <ErrorPanel
          error={doctors.error}
          title="We couldn’t load the doctor directory"
          onRetry={() => {
            void doctors.refetch();
          }}
        />
      ) : null}

      <AdminDoctorsTable state={state} onEdit={setEditDoctorId} />

      {editDoctorId ? (
        <AdminDoctorDialog
          doctorId={editDoctorId}
          onClose={() => setEditDoctorId(null)}
          onSaved={(updated) => {
            setEditDoctorId(null);
            state.applySavedDoctor(updated);
          }}
        />
      ) : null}
    </div>
  );
}
