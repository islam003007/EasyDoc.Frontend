import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@fontsource/overpass-mono/400.css';
import '../../styles/spikes.css';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  SPIKE_SEATS,
  fallbackSeat,
  seatFor,
  useSpikeSeats,
} from './useSpikeSeats';

const ROLE_LABEL: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Demo admin',
};

export function SpikeRegister() {
  useDocumentTitle('Spike — The Register');
  const { users, login } = useSpikeSeats();

  return (
    <div className="reg">
      <header className="reg__bar">
        <Link to="/login" className="reg__brand" aria-label="Back to the current EasyDoc login">
          <img src="/brand/easydoc-mark.png" alt="" width="28" height="28" />
          <span className="reg__brand-copy">
            <strong>EasyDoc</strong>
            <small>Scheduling index</small>
          </span>
        </Link>
        <span className="reg__edition">Demo 2026</span>
      </header>

      <main className="reg__main">
        <div className="reg__topline">
          <span>Scheduling index</span>
          <span>Three seats</span>
        </div>

        <h1>
          Take a seat<span className="reg__period">.</span>
        </h1>
        <p className="reg__lead">
          A working clinic index: choose a role to open its seeded desk, or use
          the patient sign-in at the bottom.
        </p>

        <section className="reg__index" aria-label="Demo seats">
          {SPIKE_SEATS.map((seat, index) => {
            const user = seatFor(users.data, seat.role);
            const fallback = fallbackSeat(seat.role);
            const pending =
              login.isPending && login.variables?.role === seat.role;
            return (
              <article key={seat.role} className="reg__row">
                <span className="reg__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="reg__role">
                  <strong>{ROLE_LABEL[seat.role] ?? seat.label}</strong>
                  <span>
                    <bdi dir="auto">{user?.label ?? fallback.name}</bdi>
                  </span>
                  <span className="reg__email">
                    {user?.email ?? fallback.email}
                  </span>
                </div>
                <p className="reg__desc">{seat.blurb}</p>
                <button
                  type="button"
                  className="reg__open"
                  onClick={() => {
                    if (user) login.mutate(user);
                  }}
                  disabled={!user || login.isPending}
                  aria-label={`Open the ${ROLE_LABEL[seat.role]?.toLowerCase() ?? 'demo'} seat`}
                >
                  {pending ? 'Opening…' : 'Open'}
                  {pending ? null : <ArrowUpRight size={13} aria-hidden="true" />}
                </button>
              </article>
            );
          })}
        </section>

        {users.isError || login.isError ? (
          <p className="reg__error" role="alert">
            {login.isError
              ? 'That seat did not open. Try again, or use patient sign-in below.'
              : 'The demo seats did not answer. Try again, or use patient sign-in below.'}
          </p>
        ) : null}

        <footer className="reg__foot">
          <div className="reg__links">
            <Link to="/login/standard">Patient sign-in</Link>
            <Link to="/register">Create a patient account</Link>
          </div>
          <p className="reg__fineprint">
            Sample clinic data only. Seats may reset between reviews.
          </p>
        </footer>
      </main>
    </div>
  );
}
