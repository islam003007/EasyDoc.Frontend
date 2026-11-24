import { Clock3, Mail, MapPin, Phone, Stethoscope } from 'lucide-react';
import type { DoctorDetail } from '../../api/contracts';
import { Monogram } from '../../ui/Monogram';

export function DoctorSummary({ doctor }: { doctor: DoctorDetail }) {
  return (
    <header className="doctor-head">
      <Monogram name={doctor.personName} size="xl" />
      <div className="doctor-head__copy">
        <p className="doctor-head__kicker">
          {doctor.department ?? 'Care team'}, {doctor.city ?? 'Egypt'}
        </p>
        <h1>
          <bdi dir="auto">{doctor.personName}</bdi>
        </h1>
        <p className="doctor-head__lead">
          {doctor.description ??
            'A doctor in the EasyDoc network. Choose a date to see their open times.'}
        </p>
        <div className="doctor-facts">
          <span>
            <MapPin size={14} aria-hidden="true" />
            {doctor.clinicAddress ?? 'Clinic address not provided'}
          </span>
          <span>
            <Clock3 size={14} aria-hidden="true" />
            {doctor.defaultAppointmentTimeInMinutes}-minute visits
          </span>
          <span>
            <Stethoscope size={14} aria-hidden="true" />
            {doctor.department ?? 'General care'}
          </span>
        </div>
      </div>
    </header>
  );
}

export function DoctorPractice({ doctor }: { doctor: DoctorDetail }) {
  return (
    <div className="stack">
      <section className="sheet">
        <div className="sheet__head">
          <div>
            <p className="sheet__kicker">The practice</p>
            <h2>Care, with a clear calendar.</h2>
          </div>
        </div>
        <div className="sheet__body">
          <p className="doctor-about">
            {doctor.description ?? 'This doctor hasn’t added a biography yet.'}
          </p>
          <dl className="facts-grid">
            <div>
              <dt>Specialty</dt>
              <dd>{doctor.department ?? '—'}</dd>
            </div>
            <div>
              <dt>City</dt>
              <dd>{doctor.city ?? '—'}</dd>
            </div>
            <div>
              <dt>Clinic address</dt>
              <dd>{doctor.clinicAddress ?? '—'}</dd>
            </div>
            <div>
              <dt>Visit length</dt>
              <dd>{doctor.defaultAppointmentTimeInMinutes} minutes</dd>
            </div>
            {doctor.phoneNumber ? (
              <div>
                <dt>Clinic phone</dt>
                <dd>
                  <a
                    className="phone-link"
                    href={`tel:${doctor.phoneNumber}`}
                    dir="ltr"
                  >
                    <Phone size={13} aria-hidden="true" />
                    {doctor.phoneNumber}
                  </a>
                </dd>
              </div>
            ) : null}
            {doctor.email ? (
              <div>
                <dt>Email</dt>
                <dd>
                  <a className="phone-link" href={`mailto:${doctor.email}`}>
                    <Mail size={13} aria-hidden="true" />
                    {doctor.email}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <section className="sheet">
        <div className="sheet__head">
          <div>
            <p className="sheet__kicker">Before you book</p>
            <h2>Three small steps.</h2>
          </div>
        </div>
        <div className="sheet__body">
          <ol className="steps">
            <li>
              <span className="steps__number tnum">1</span>
              <div>
                <strong>Pick a date</strong>
                <p>
                  Open days follow the doctor&rsquo;s weekly hours and any changes to
                  specific dates.
                </p>
              </div>
            </li>
            <li>
              <span className="steps__number tnum">2</span>
              <div>
                <strong>Pick a time</strong>
                <p>Only times that are still open appear for the day.</p>
              </div>
            </li>
            <li>
              <span className="steps__number tnum">3</span>
              <div>
                <strong>Send the request</strong>
                <p>
                  The doctor reviews every request before the visit is confirmed.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
