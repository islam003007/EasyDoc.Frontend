import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

type NoticeTone = 'success' | 'info' | 'error';

export function Notice({
  tone = 'success',
  children,
  onDismiss,
}: {
  tone?: NoticeTone;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertTriangle : Info;

  return (
    <div
      className={`notice notice--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} aria-hidden="true" />
      <div className="notice__body">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          className="notice__close"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          <X size={16} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
