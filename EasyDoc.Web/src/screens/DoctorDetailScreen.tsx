import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { BookingPanel } from '../features/booking/BookingPanel';
import { DoctorPractice, DoctorSummary } from '../features/booking/DoctorSummary';
import { useDoctorBooking } from '../features/booking/useDoctorBooking';
import { ErrorPanel } from '../ui/ErrorPanel';
import { Skeleton } from '../ui/Loading';

export function DoctorDetailScreen() {
  const { session } = useSession();
  const booking = useDoctorBooking();
  const { doctorQuery, doctor } = booking;

  useDocumentTitle(doctor ? doctor.personName : 'Doctor profile');

  return (
    <div className="page">
      <Link to="/patient" className="back-link">
        <ArrowLeft size={15} aria-hidden="true" />
        Back to the directory
      </Link>

      {doctorQuery.isPending ? (
        <div className="stack" aria-busy="true" aria-label="Loading doctor">
          <div className="doctor-head">
            <Skeleton width="86px" height="86px" />
            <div className="stack--tight doctor-head__skeleton">
              <Skeleton width="8rem" height="0.75rem" />
              <Skeleton width="min(24rem, 70%)" height="2.4rem" />
              <Skeleton width="min(34rem, 90%)" height="0.9rem" />
            </div>
          </div>
          <div className="split">
            <Skeleton height="18rem" />
            <Skeleton height="26rem" />
          </div>
        </div>
      ) : null}

      {doctorQuery.isError ? (
        <ErrorPanel
          error={doctorQuery.error}
          title="We couldn’t open this profile"
          onRetry={() => {
            void doctorQuery.refetch();
          }}
        />
      ) : null}

      {doctor ? (
        <>
          <DoctorSummary doctor={doctor} />
          <div className="split split--booking">
            <DoctorPractice doctor={doctor} />
            <BookingPanel
              booking={booking}
              displayName={session?.displayName ?? 'your account'}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
