import { X } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
} from 'react';

export function Dialog({
  open,
  title,
  kicker,
  description,
  onClose,
  footer,
  children,
  wide = false,
  side = false,
}: {
  open: boolean;
  title: ReactNode;
  kicker?: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  side?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }

    if (dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    return () => {
      if (ref.current?.open) ref.current.close();
      document.body.style.overflow = '';
    };
  }, []);

  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? 'dialog--wide' : ''} ${side ? 'dialog--side' : ''}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdrop}
    >
      <div className="dialog__panel">
        <header className="dialog__head">
          <div>
            {kicker ? <p className="dialog__kicker">{kicker}</p> : null}
            <h2 id={titleId}>{title}</h2>
            {description ? (
              <p className="dialog__description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="dialog__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div className="dialog__body">{children}</div>
        {footer ? <footer className="dialog__foot">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
