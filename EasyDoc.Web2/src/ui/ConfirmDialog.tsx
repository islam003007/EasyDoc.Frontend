import { Spinner } from './Loading';
import { InlineError } from './ErrorPanel';
import { Dialog } from './Dialog';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel,
  pending,
  error,
  onConfirm,
  onClose,
  danger = true,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  pending: boolean;
  error?: unknown;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <Dialog
      open={open}
      title={title}
      kicker="Please confirm"
      onClose={() => {
        if (!pending) onClose();
      }}
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
            {pending ? (pendingLabel ?? 'Working…') : confirmLabel}
          </button>
        </>
      }
    >
      <p className="quiet">{description}</p>
      {error ? (
        <div style={{ marginTop: '0.8rem' }}>
          <InlineError error={error} />
        </div>
      ) : null}
    </Dialog>
  );
}
