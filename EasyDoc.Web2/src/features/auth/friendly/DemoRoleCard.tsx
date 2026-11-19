import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { DemoUser, Role } from '../../../api/contracts';
import { roleBlurb } from '../../../lib/format';
import { FcMonogram, FcSpinner } from './fc-ui';
import {
  ROLE_CARD_LABEL,
  ROLE_ICON,
  ROLE_INDEX,
  ROLE_TITLE,
} from './demo-seat-content';

function DemoUserButton({
  user,
  pending,
  disabled,
  onSelect,
}: {
  user: DemoUser;
  pending: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="demo-user"
      onClick={onSelect}
      disabled={disabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="demo-user__spinner">
          <FcSpinner />
        </span>
      ) : (
        <FcMonogram name={user.label} />
      )}
      <span className="demo-user__copy">
        <strong>
          <bdi dir="auto">{user.label}</bdi>
        </strong>
        <span>{user.email || 'Seeded demo account'}</span>
      </span>
      <span className="demo-user__action">
        {pending ? 'Opening…' : 'Enter'}
        {pending ? null : <ArrowRight size={15} aria-hidden="true" />}
      </span>
    </button>
  );
}

export function DemoRoleCard({
  role,
  users,
  pendingUserKey,
  disabled,
  onSelect,
}: {
  role: Role;
  users: DemoUser[];
  pendingUserKey: string | undefined;
  disabled: boolean;
  onSelect: (user: DemoUser) => void;
}) {
  const Icon = ROLE_ICON[role];

  return (
    <article className={`role-card role-card--${role}`}>
      <header className="role-card__head">
        <span className="role-card__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <span className="role-card__role">{ROLE_CARD_LABEL[role]}</span>
        <span className="role-card__index">{ROLE_INDEX[role]}</span>
      </header>
      <h3>{ROLE_TITLE[role]}</h3>
      <p className="role-card__blurb">{roleBlurb(role)}</p>

      {role === 'admin' ? (
        <p className="role-card__sandbox">
          <ShieldCheck size={14} aria-hidden="true" />
          Open on purpose for portfolio review. Directory changes are limited to
          safe, reversible visibility toggles.
        </p>
      ) : null}

      <div className="role-card__users">
        {users.map((user) => (
          <DemoUserButton
            key={user.key}
            user={role === 'admin' ? { ...user, label: 'Demo admin' } : user}
            pending={pendingUserKey === user.key}
            disabled={disabled}
            onSelect={() => onSelect(user)}
          />
        ))}
      </div>
    </article>
  );
}
