# Frontend refactor inventory

The design, correctness and structural cleanup work is complete. Every source file now stays within
the project budget, and the size guard has no legacy exceptions.

## Budgets

- Screens and feature pages: **300 lines**
- Hooks/helpers/other TS: **240 lines**
- CSS: **360 lines**
- Tests are exempt.
- `npm run check:sizes` fails if any file exceeds its budget.

## Completed

- Auth split into `features/auth/`: screen shell, brand, fields, feedback, validation, demo seats
  and scoped styling under `styles/auth/`.
- Appointment conflict, schedule availability and booking-error logic moved into `src/lib/` with
  unit tests.
- `VisitRow` and `BoardRow` extracted out of the large pages.
- The schedule screen split into focused modules under `features/schedule/`; weekly-window and
  override CRUD verified.
- `PatientVisitsScreen` split into `features/visits/`: data hook, reschedule hook, record dialog and
  reschedule dialog.
- `DoctorBoardScreen` split into `features/board/`: board data hook, record dialog, history dialog
  and complete-visit dialog.
- `DoctorDetailScreen` split into `features/booking/`: booking hook, profile summary/practice panel
  and availability panel.
- `DoctorProfileScreen` split with a dedicated profile editor dialog.
- `AccountScreen` split into `features/account/`: shortcuts, patient-details hook and edit dialog.
- `PatientSearchScreen` split into `features/search/`: search state hook, search controls and
  directory results.
- Admin doctor editing split into `features/admin/`: form hook, edit form, directory table and data
  hook.
- API calls split by domain under `src/api/` with `queries.ts` as a small barrel.
- Response normalizers split by domain under `src/api/normalize/` with `normalize.ts` as a small
  barrel.
- `ui.css` split into semantic files under `styles/ui/`: brand, controls, layout, search, ledger,
  tables, states, recovery, dialog and utilities.
- Auth and patient/doctor screen styles split under `styles/auth/` and `styles/screens/`.
- The authenticated shell and screens load through `React.lazy` with a branded Suspense fallback;
  auth stays eager.
- `DateRail`, `SlotPicker`, demo role cards, validation, appointment and schedule logic covered by
  49 frontend tests.

## Remaining

None. All source files are within budget and `LEGACY_DEBT` has been removed from the size guard.
