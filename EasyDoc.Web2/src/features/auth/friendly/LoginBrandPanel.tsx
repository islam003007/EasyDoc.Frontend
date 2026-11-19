import { FcBrand } from './fc-ui';

export function LoginBrandPanel() {
  return (
    <section className="login-brand-panel">
      <div className="login-brand-panel__top">
        <FcBrand to="/login" light />
        <span className="login-brand-panel__edition">Portfolio demo · 2026</span>
      </div>

      <div className="login-brand-panel__copy">
        <p className="fc-eyebrow fc-eyebrow--light">EasyDoc · care scheduling</p>
        <h1>
          Care,
          <br />
          <em>scheduled well.</em>
        </h1>
        <p>
          A working clinic directory built around real availability. Find a
          doctor, hold a time, or run the practice — from a seeded demo seat or
          your own patient account.
        </p>
        <div className="login-brand-chips" aria-label="Demo highlights">
          <span>Egypt care network</span>
          <span>Arabic + English</span>
          <span>Live availability</span>
        </div>
      </div>

      <div className="login-brand-panel__mark" aria-hidden="true">
        <img src="/brand/easydoc-mark.png" alt="" />
      </div>

      <ol className="login-steps">
        <li>
          <span>01</span>
          <div>
            <strong>Find the right care</strong>
            <p>Search by name, city, or specialty in Arabic or English.</p>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <strong>Pick a real time</strong>
            <p>Open slots come from weekly hours, date overrides, and bookings.</p>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <strong>Keep the day moving</strong>
            <p>Patients book. Doctors decide. Admins keep the directory honest.</p>
          </div>
        </li>
      </ol>

      <div className="login-brand-panel__foot">
        <span>Egypt care network</span>
        <span className="fc-mono-label">Sample clinic data · demo accounts</span>
      </div>
    </section>
  );
}
