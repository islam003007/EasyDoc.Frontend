import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DemoUser } from '../../api/contracts';
import { DemoRoleCard } from './DemoRoleCard';

const patient: DemoUser = {
  key: 'sara',
  label: 'سارة محمد',
  role: 'patient',
  email: 'sara@example.com',
};

describe('DemoRoleCard', () => {
  it('renders the role and opens the selected demo user', () => {
    const onSelect = vi.fn();
    render(
      <DemoRoleCard
        role="patient"
        users={[patient]}
        pendingUserKey={undefined}
        disabled={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('I’m here for care')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledWith(patient);
  });

  it('shows the pending state on the active seat', () => {
    render(
      <DemoRoleCard
        role="patient"
        users={[patient]}
        pendingUserKey="sara"
        disabled
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByText('Opening…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows the admin sandbox notice', () => {
    render(
      <DemoRoleCard
        role="admin"
        users={[{ ...patient, key: 'admin', role: 'admin', label: 'Administrator' }]}
        pendingUserKey={undefined}
        disabled={false}
        onSelect={() => undefined}
      />,
    );

    expect(
      screen.getByText(/Open on purpose for portfolio review/i),
    ).toBeInTheDocument();
  });
});
