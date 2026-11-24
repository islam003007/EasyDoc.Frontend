import { DoctorDirectory } from '../features/search/DoctorDirectory';
import { SearchControls } from '../features/search/SearchControls';
import { useDoctorSearch } from '../features/search/useDoctorSearch';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { PageHeader } from '../ui/PageHeader';

export function PatientSearchScreen() {
  useDocumentTitle('Find care');
  const search = useDoctorSearch();

  return (
    <div className="page">
      <PageHeader
        kicker="Care directory"
        title="Find the right care."
        lead="Search the Egypt care network by name, specialty, or city, then open a doctor’s profile to see their open times."
      />

      <SearchControls search={search} />
      <DoctorDirectory search={search} />
    </div>
  );
}
