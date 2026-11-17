import { describeError } from '../api/client';
import { Modal } from './Modal';
import { Spinner } from './Loading';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  danger?: boolean;
  error?: unknown;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Working…',
  pending = false,
  danger = true,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      eyebrow="Please confirm"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={pending}
          >
            Keep it
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? <Spinner /> : null}
            {pending ? pendingLabel : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-copy">{description}</p>
      {error ? (
        <p className="form-error" role="alert">
          {describeError(error)}
        </p>
      ) : null}
    </Modal>
  );
}
