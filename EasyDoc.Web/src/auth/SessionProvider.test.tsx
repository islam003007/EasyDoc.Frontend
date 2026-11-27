import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../api/contracts';
import { fetchSession, warmDemoDatabase } from '../api/queries';
import { SessionGate, SessionProvider } from './SessionProvider';

vi.mock('../api/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/queries')>();
  return {
    ...actual,
    fetchSession: vi.fn(),
    warmDemoDatabase: vi.fn(),
  };
});

const session: Session = {
  userId: 'demo-admin',
  email: 'admin@example.com',
  role: 'admin',
  displayName: 'Administrator',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('SessionProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('warms the demo database before checking the session', async () => {
    const warmup = deferred<void>();
    const sessionResult = deferred<Session | null>();

    vi.mocked(warmDemoDatabase).mockReturnValue(warmup.promise);
    vi.mocked(fetchSession).mockReturnValue(sessionResult.promise);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <SessionGate>
            <div>Workspace ready</div>
          </SessionGate>
        </SessionProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(warmDemoDatabase).toHaveBeenCalledTimes(1);
    });
    expect(fetchSession).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Waking the demo database…',
    );

    warmup.resolve();

    await waitFor(() => {
      expect(fetchSession).toHaveBeenCalledTimes(1);
    });

    sessionResult.resolve(session);

    expect(await screen.findByText('Workspace ready')).toBeInTheDocument();
  });
});
