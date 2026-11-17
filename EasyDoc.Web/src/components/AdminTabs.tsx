import { NavLink } from 'react-router-dom';

export function AdminTabs({
  doctorCount,
  patientCount,
}: {
  doctorCount?: number;
  patientCount?: number;
}) {
  return (
    <nav className="subnav" aria-label="Admin sections">
      <NavLink to="/admin" end className="subnav__link">
        Doctors
        {doctorCount !== undefined ? (
          <span className="subnav__count">{doctorCount}</span>
        ) : null}
      </NavLink>
      <NavLink to="/admin/patients" className="subnav__link">
        Patients
        {patientCount !== undefined ? (
          <span className="subnav__count">{patientCount}</span>
        ) : null}
      </NavLink>
    </nav>
  );
}
