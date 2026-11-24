import { Save } from 'lucide-react';
import type { AdminDoctor, LookupItem } from '../../api/contracts';
import { Dialog } from '../../ui/Dialog';
import { InlineError } from '../../ui/ErrorPanel';
import { Field } from '../../ui/Field';
import { Spinner } from '../../ui/Loading';
import { Monogram } from '../../ui/Monogram';
import { useAdminDoctorForm } from './useAdminDoctorForm';

export function DoctorEditForm({
  doctor,
  cities,
  onClose,
  onSaved,
}: {
  doctor: AdminDoctor;
  cities: LookupItem[];
  onClose: () => void;
  onSaved: (doctor: AdminDoctor) => void;
}) {
  const form = useAdminDoctorForm({ doctor, cities, onSaved });

  return (
    <Dialog
      open
      title="Edit doctor"
      kicker="Admin directory"
      description="Edit the profile patients see and the details used for scheduling. This does not remove the doctor from the directory."
      onClose={() => {
        if (!form.save.isPending) onClose();
      }}
      wide
      footer={
        <>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={form.save.isPending}
          >
            Close
          </button>
          <button
            type="submit"
            form="admin-doctor-form"
            className="btn btn--primary"
            disabled={!form.canSave || form.save.isPending}
          >
            {form.save.isPending ? (
              <Spinner />
            ) : (
              <Save size={15} aria-hidden="true" />
            )}
            {form.save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form
        id="admin-doctor-form"
        className="form-stack"
        onSubmit={form.submit}
      >
        <div className="dialog-context">
          <Monogram name={doctor.personName} size="sm" />
          <div>
            <strong>
              <bdi dir="auto">{doctor.personName}</bdi>
            </strong>
            <span>{doctor.email || 'No email on file'}</span>
          </div>
          <span className="mini-label">{doctor.department ?? 'Care team'}</span>
        </div>

        <div className="form-row">
          <Field id="admin-doctor-name" label="Full name">
            <input
              id="admin-doctor-name"
              value={form.personName}
              onChange={(event) => form.setPersonName(event.target.value)}
              dir="auto"
              required
            />
          </Field>
          <Field id="admin-doctor-phone" label="Public phone">
            <input
              id="admin-doctor-phone"
              type="tel"
              value={form.phoneNumber}
              onChange={(event) => form.setPhoneNumber(event.target.value)}
              placeholder="+20 100 000 0000"
              required
            />
          </Field>
        </div>

        <div className="form-row">
          <Field id="admin-doctor-city" label="City">
            <select
              id="admin-doctor-city"
              value={form.cityId}
              onChange={(event) => form.setCityId(event.target.value)}
            >
              <option value="">Choose a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="admin-doctor-duration"
            label="Default visit length"
            hint="Minutes per visit, 10–120."
          >
            <input
              id="admin-doctor-duration"
              type="number"
              value={form.duration}
              onChange={(event) => form.setDuration(event.target.value)}
              min={10}
              max={120}
              step={5}
              required
            />
          </Field>
        </div>

        <Field id="admin-doctor-address" label="Clinic address">
          <input
            id="admin-doctor-address"
            value={form.clinicAddress}
            onChange={(event) => form.setClinicAddress(event.target.value)}
            required
          />
        </Field>

        <Field id="admin-doctor-description" label="Biography">
          <textarea
            id="admin-doctor-description"
            value={form.description}
            onChange={(event) => form.setDescription(event.target.value)}
            placeholder="What should patients know about the practice?"
          />
        </Field>

        <Field
          id="admin-doctor-picture"
          label="Profile picture URL"
          hint="Optional. This demo uses initials instead of a photo."
        >
          <input
            id="admin-doctor-picture"
            type="url"
            value={form.profilePictureUrl}
            onChange={(event) => form.setProfilePictureUrl(event.target.value)}
            placeholder="https://…"
          />
        </Field>

        <Field
          id="admin-doctor-visibility"
          label="Directory visibility"
          hint="You can change this at any time."
        >
          <select
            id="admin-doctor-visibility"
            value={form.isVisible ? 'listed' : 'hidden'}
            onChange={(event) =>
              form.setIsVisible(event.target.value === 'listed')
            }
          >
            <option value="listed">Listed in patient search</option>
            <option value="hidden">Hidden from patients</option>
          </select>
        </Field>

        {!form.durationValid ? (
          <p className="field__error" role="alert">
            Visit length must be between 10 and 120 minutes.
          </p>
        ) : null}

        {form.save.isError ? <InlineError error={form.save.error} /> : null}
      </form>
    </Dialog>
  );
}
