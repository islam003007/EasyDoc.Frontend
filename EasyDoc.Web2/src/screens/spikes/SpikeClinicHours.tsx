import '@fontsource-variable/overpass';
import '@fontsource/overpass-mono/400.css';
import '@fontsource/overpass-mono/600.css';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/spikes.css';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  SPIKE_SEATS,
  fallbackSeat,
  seatFor,
  useSpikeSeats,
} from './useSpikeSeats';

export function SpikeClinicHours() {
  useDocumentTitle('Spike — Clinic Hours');
  const { users, login } = useSpikeSeats();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="ch">
      <header className="ch__bar">
        <Link to="/login" className="ch__brand" aria-label="Back to the current EasyDoc login">
          <img src="/brand/easydoc-mark.png" alt="" width="34" height="34" />
          <span className="ch__brand-copy">
            <strong>EasyDoc</strong>
            <small>Clinic timetable</small>
          </span>
        </Link>

        <div className="ch__clock">
          <span className="ch__live" aria-hidden="true" />
          <span className="ch__clock-time">{format(now, 'HH:mm')}</span>
          <span className="ch__clock-date">{format(now, 'EEE d MMM yyyy')}</span>
        </div>
      </header>

      <main className="ch__main">
        <div className="ch__head">
          <h1 id="ch-title">The clinic day, kept in one book.</h1>
          <p>
            Pick a seat and step into the schedule. One click opens a seeded
            role; patient email sign-in is at the bottom.
          </p>
        </div>

        <section className="ch__sheet" aria-labelledby="ch-seats">
          <h2 id="ch-seats" className="sr-only">
            Demo seats
          </h2>

          <div className="ch__sheet-head" aria-hidden="true">
            <span>Time</span>
            <span>Seat</span>
            <span>Enter</span>
          </div>

          {SPIKE_SEATS.map((seat) => {
            const user = seatFor(users.data, seat.role);
            const fallback = fallbackSeat(seat.role);
            const pending =
              login.isPending && login.variables?.role === seat.role;
            return (
              <article key={seat.role} className="ch__row">
                <span className="ch__time">{seat.time}</span>
                <div className="ch__seat">
                  <span
                    className={`ch__tone ch__tone--${seat.tone}`}
                    aria-hidden="true"
                  />
                  <div className="ch__seat-copy">
                    <p className="ch__role">{seat.label}</p>
                    <p className="ch__name">
                      <bdi dir="auto">{user?.label ?? fallback.name}</bdi>
                      <span>{user?.email ?? fallback.email}</span>
                    </p>
                    <p className="ch__blurb">{seat.blurb}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="ch__take"
                  onClick={() => {
                    if (user) login.mutate(user);
                  }}
                  disabled={!user || login.isPending}
                  aria-label={`Take the ${seat.label.toLowerCase()}`}
                >
                  {pending ? 'Opening…' : 'Take this seat'}
                  {pending ? null : <ArrowUpRight size={14} aria-hidden="true" />}
                </button>
              </article>
            );
          })}
        </section>

        {users.isError || login.isError ? (
          <p className="ch__error" role="alert">
            {login.isError
              ? 'That seat did not open. Try again, or use patient sign-in below.'
              : 'The demo seats did not answer. Try again, or use patient sign-in below.'}
          </p>
        ) : null}

        <footer className="ch__foot">
          <div className="ch__foot-links">
            <Link to="/login/standard">
              Patient sign-in
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
            <Link to="/register">
              Create a patient account
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <p className="ch__fineprint">
            Sample clinic data only. Seats may reset between reviews.
          </p>
        </footer>
      </main>
    </div>
  );
}
