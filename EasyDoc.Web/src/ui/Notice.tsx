import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'error';

export function Notice({
  tone = 'info',
  children,
  onDismiss,
}: {
  tone?: Tone;
  children: ReactNode;
  onDismiss?: () => void;
}) {
  const Icon =
    tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div
      className={`notice ${tone !== 'info' ? `notice--${tone}` : ''}`.trim()}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={16} aria-hidden="true" />
      <div className="notice__body">{children}</div>
      {onDismiss ? (
        <button
          type="button"
          className="notice__close"
          onClick={onDismiss}
          aria-label="Dismiss message"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
