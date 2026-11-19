# Frontend refactor inventory

The design and correctness work is complete; the remaining cleanup is structural. This file tracks
the files that are still larger than the project budget so they cannot quietly grow while they are
split.

## Budgets

- Screens and feature pages: **300 lines**
- Hooks/helpers/other TS: **240 lines**
- CSS: **360 lines**
- Tests are exempt.
- `npm run check:sizes` fails if a legacy file grows or a new file exceeds its budget.

## Already completed

- Friendly Care auth split into layout, brand panel, seat panel, role card, field/UI components,
  validation and scoped CSS.
- Appointment conflict, schedule availability and booking error logic moved into `src/lib/` with
  unit tests.
- `VisitRow` and `BoardRow` extracted out of the 600+ line pages.
- The 997-line schedule screen split into 18 modules under `features/schedule/`; live weekly-window and override CRUD verified.
- API split away from both API apps into separate repositories.
- `DateRail`, `SlotPicker`, `DemoRoleCard`, validation, appointment and schedule logic covered by
  49 frontend tests.

## Remaining splits

| File | Current | Target |
| --- | ---: | --- |
| `screens/PatientVisitsScreen.tsx` | 657 | `features/visits/` page + record dialog + reschedule dialog + mutations hook |
| `screens/DoctorBoardScreen.tsx` | 641 | `features/board/` page + detail dialog + history dialog + complete form + data hook |
| `screens/DoctorProfileScreen.tsx` | 449 | page + public profile + profile sidebar + edit dialog |
| `screens/AccountScreen.tsx` | 380 | page + identity + shortcuts + patient details dialog |
| `screens/PatientSearchScreen.tsx` | 339 | page + search controls + directory row + results state |
| `screens/AdminDoctorDialog.tsx` | 328 | dialog + record fields + form hook |
| `screens/AdminDoctorsScreen.tsx` | 311 | page + table + visibility switch + data hook |
| `api/queries.ts` / `api/normalize.ts` | 548 / 516 | domain modules with a small barrel |
| `styles/ui.css` | 1,720 | buttons, forms, dialogs, layout, tables, states, directory, booking |
| `styles/fc-auth.css` | 1,012 | shared auth, login, auth-screen styles |
| `styles/screens-doctor.css` / `screens-patient.css` | 554 / 482 | board/schedule/profile and search/booking/visits files |

Each split is a behavior-preserving refactor: tests must stay green and screenshots are compared
before and after.
