# EasyDoc Web

A role-based portfolio client for the EasyDoc doctor-scheduling API. Demo seats open in one click;
patient email/password login and self-registration are also available.

The visual direction is **Friendly Care**: ice-white surfaces, deep indigo, and the pink/sky-blue
EasyDoc mark, with Plus Jakarta Sans, IBM Plex Sans Arabic, IBM Plex Mono and soft rounded cards.
The records themselves stay precise.

## Stack

- React 19 + TypeScript + Vite
- React Router (`react-router-dom`)
- TanStack Query and date-fns
- lucide-react
- Fontsource: Plus Jakarta Sans, IBM Plex Sans Arabic, IBM Plex Mono
- Custom CSS only (no Tailwind or component library)

## Run it

Prerequisites:

1. Node.js 22+ (verified on Node 26).
2. The EasyDoc API at `http://localhost:5215`, with SQL Server configured and migrations applied.
3. Demo mode enabled (`Demo:Enabled=true` in Development). For immediate patient registration,
   keep `Demo:AutoConfirmRegistrations=true` in Development.

```bash
npm install
npm run dev
```

Open `http://localhost:5174`.

The browser calls `/api/...`; Vite strips `/api` and proxies to `http://localhost:5215`, keeping
cookies same-origin. Override with `VITE_API_TARGET` in `.env.local` when the API runs elsewhere.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | Type-check then production build to `dist/` |
| `npm run preview` | Preview the built SPA with the same proxy |
| `npm run check` | Type-check only |

Production hosting serves `dist/` for SPA routes and reverse-proxies `/api` to EasyDoc with the
prefix removed.

## Auth modes

- **Demo roles:** `GET /auth/demo-users` → one-click `POST /auth/demo-login { key }` for patient
  سارة محمد, doctor أحمد حسن, and the **Demo admin** seat.
- **Patient sign-in:** `/login/standard` → `POST /auth/login`, then `GET /auth/me`.
- **Patient registration:** `/register` → `POST /patients/register`, then password login. New
  accounts are auto-confirmed in demo mode; real email delivery is not part of this build.
- Doctor and demo-admin registration are not offered. Those seats remain seeded.

## Demo security boundary

The demo is a review sandbox, not a production authentication bypass.

- `Demo:Enabled` is `false` in the base `appsettings.json` and turned on only by
  `appsettings.Development.json`. A production deployment keeps it off, which disables
  `/auth/demo-users` and `/auth/demo-login` entirely.
- Demo login accepts only keys from a server-side allowlist and only signs in the matching seeded
  account. It does not create users, elevate roles, or bypass API authorization policies.
- Every API endpoint remains authoritative: admin routes still require the admin role, doctor routes
  require the doctor role, and patient records are scoped to the signed-in patient.
- The demo uses separate seeded sample data. Do not enter real or sensitive patient information;
  demo data may be reset between reviews.
- The demo admin seat is intentionally open so reviewers can reach every screen. It is limited to
  safe, reversible work: doctor visibility toggles and the read-only patient directory. There are no
  destructive admin actions in this client.
- Demo-only behavior (auto-confirmed registration, log-only email) is documented above and should be
  replaced before any real deployment.

## Routes

| Route | Access | Flow |
| --- | --- | --- |
| `/login` | Public | Demo role picker + standard/register links |
| `/login/standard` | Public | Patient email/password sign-in |
| `/register` | Public | Patient self-registration |
| `/patient` | Patient | Search, filters, directory |
| `/patient/doctors/:doctorId` | Patient | Profile, date rail, slots, booking |
| `/patient/appointments` | Patient | Upcoming/history, cancel |
| `/doctor` | Doctor | Practice board; accept/cancel/complete |
| `/doctor/schedule` | Doctor | Weekly windows, date overrides |
| `/doctor/profile` | Doctor | Public profile record |
| `/admin` | Admin | Doctor directory and visibility |
| `/admin/patients` | Admin | Patient directory |
| `/account` | Any signed-in role | Account details, shortcuts, switch role/sign out |

Every protected route is guarded by `/auth/me`; API policies remain authoritative.

## API surface used

- `GET /auth/me`, `GET /auth/demo-users`, `POST /auth/demo-login { key }`,
  `POST /auth/login { email, password }`, `POST /auth/logout`
- `POST /patients/register` with email/password/confirm/name/phone
- `GET /lookups/departments`, `GET /lookups/cities`
- `GET /doctors/search`, `GET /doctors`, `GET /doctors/{id}`,
  `GET /doctors/{id}/available-slots?date=YYYY-MM-DD`, `GET /doctors/me`
- `POST /appointments`, `GET /appointments/patient/me`,
  `POST /appointments/{id}/cancel/patient`
- `GET /appointments/doctor/me`, `POST /appointments/{id}/accept`,
  `POST /appointments/{id}/cancel`, `POST /appointments/{id}/Complete`
- Doctor schedule/override read, add and remove endpoints
- `GET /admin/doctors`, `PATCH /admin/doctors/{id}` with `{ isVisible }`,
  `GET /admin/patients`

Responses are normalized tolerantly: arrays or paged `items`, numeric or string enums, and
`patientName`/`doctorName` appointment additions.

## Design and behavior notes

- **Search:** debounced; URL stores `q`, `cityId`, `departmentId` for sharing/restoring.
- **Availability:** next 10 days, native date for the API’s booking window, past times hidden;
  booking is select → confirm.
- **Records stay readable:** monogram identities, dates and slot times, with a 12px floor for
  functional labels, 13px secondary metadata, 14px table/control text, and 15px lead copy. The mono
  labels were raised in size and weight rather than scaling the whole document.
- **Doctor/patient transitions** match the API: doctors accept/cancel pending and complete scheduled;
  patients cancel pending or scheduled.
- **Real states:** loading/empty/error/success, disabled pending actions, validation, reconnect
  guard and a friendly session screen.
- **No doctor/admin self-registration, uploads, payments or real email delivery.**

## Notes

- Seed appointment dates may be historical; new bookings are current upcoming visits.
- Doctor appointment responses now include patient names where available; records remain linked by ID.
- There is no automated test suite in this package; `npm run build` is the verified check.
