import { AuthBrand } from './AuthBrand';

export function LoginBrandPanel() {
  return (
    <section className="login-brand-panel">
      <div className="login-brand-panel__top">
        <AuthBrand to="/login" light />
        <span className="login-brand-panel__edition">2026 portfolio demo</span>
      </div>

      <div className="login-brand-panel__copy">
        <p className="auth-eyebrow auth-eyebrow--light">EasyDoc care scheduling</p>
        <h1>
          Care,
          <br />
          <em>scheduled well.</em>
        </h1>
        <p>
          A working clinic directory built around real availability. Find a
          doctor, request a time, or run the practice, using a demo seat or your
          own patient account.
        </p>
        <div className="login-brand-chips" aria-label="Demo highlights">
          <span>Egypt care network</span>
          <span>Arabic and English</span>
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
            <p>Open times follow the clinic’s weekly hours and any changes to specific days.</p>
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
        <span className="auth-mono-label">Sample clinic data and demo accounts</span>
      </div>
    </section>
  );
}
