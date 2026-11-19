import { NavLink } from 'react-router-dom';

export function AdminTabs({
  doctorCount,
  patientCount,
}: {
  doctorCount?: number;
  patientCount?: number;
}) {
  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      <NavLink to="/admin" end className="admin-tabs__link">
        Doctors
        {doctorCount !== undefined ? <span>{doctorCount}</span> : null}
      </NavLink>
      <NavLink to="/admin/patients" className="admin-tabs__link">
        Patients
        {patientCount !== undefined ? <span>{patientCount}</span> : null}
      </NavLink>
    </nav>
  );
}
