import { ArrowUpRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DoctorSummary } from '../api/contracts';
import { Monogram } from './Monogram';

export function DoctorCard({ doctor }: { doctor: DoctorSummary }) {
  return (
    <Link
      to={`/patient/doctors/${doctor.id}`}
      className="doctor-card"
      aria-label={`View ${doctor.personName}`}
    >
      <Monogram name={doctor.personName} size="md" />
      <div className="doctor-card__body">
        <p className="doctor-card__dept">{doctor.department ?? 'Care team'}</p>
        <h3>{doctor.personName}</h3>
        <p className="doctor-card__meta">
          <MapPin size={13} aria-hidden="true" />
          {doctor.city ?? 'Clinic location available on profile'}
        </p>
      </div>
      <span className="doctor-card__arrow" aria-hidden="true">
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}
