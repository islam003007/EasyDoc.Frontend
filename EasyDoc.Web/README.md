# EasyDoc Web

A role-based portfolio demo for the EasyDoc doctor-scheduling API. It uses real
API calls and seeded accounts — no passwords, registration, email confirmation,
uploads, or payments.

The design is deliberately clinical-editorial: warm paper, deep forest green,
cobalt links, and terracotta status notes. Fraunces sets the display type, Instrument
Sans carries the interface, and IBM Plex Mono marks metadata and references.

## Stack

- React 19 + TypeScript + Vite
- React Router (`react-router-dom`)
- TanStack Query
- date-fns
- lucide-react
- Fontsource: Instrument Sans Variable, Fraunces Variable, IBM Plex Mono
- Custom CSS only (no Tailwind or component library)

## Run it

Prerequisites:

1. Node.js 22+ (the production build was verified on Node 26).
2. The EasyDoc API running at `http://localhost:5215`.
3. SQL Server configured and migrations applied for the API.
4. Demo auth enabled on the API (`Demo:Enabled`, already `true` in
   `appsettings.Development.json`) with the companion demo/lookup/profile endpoints
   below.

From this directory:

```bash
npm install
npm run dev
```

Open `http://localhost:5174`.

The browser calls `/api/...`. Vite proxies that to `http://localhost:5215` and
strips the `/api` prefix, so authentication cookies stay same-origin and CORS is
not required.

To point the dev or preview proxy at another API host, copy `.env.example` to
`.env` and set:

```bash
VITE_API_TARGET=http://localhost:5215
```

`VITE_API_BASE_URL` can bypass the proxy with a direct API origin, but that origin
must allow credentialed CORS (the demo API does not). Use the proxy for the
portfolio deployment.

### Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with `/api` proxy |
| `npm run build` | Type-check (`tsc --noEmit`) then production build to `dist/` |
| `npm run preview` | Preview the built SPA (also proxied) |
| `npm run check` | Type-check only |

Production hosting needs to serve `dist/` for SPA routes and reverse-proxy `/api`
to the EasyDoc API with the prefix removed.

## Demo roles

The login screen fetches the server-side allowlist from `GET /auth/demo-users`.
Whichever keys the API returns are rendered as one-click role cards.

Seeded accounts in the API data:

| Role | Seed account | Notes |
| --- | --- | --- |
| Patient | `sara@example.com` (سارة محمد) | Search, book, review visits, cancel |
| Doctor | `ahmed@example.com` (أحمد حسن) | Practice board, complete visits, schedule |
| Admin | `admin@example.com` | Doctor visibility and patient directory |

The UI never collects a password. The standard password flow is represented by a
single explanatory link on `/login`; registration and email flows are intentionally
absent.

## Routes

| Route | Access | Flow |
| --- | --- | --- |
| `/login` | Public | Demo role picker |
| `/login/standard` | Public | Explains why password sign-in is out of scope |
| `/patient` | Patient | Hero search, department/city filters, directory |
| `/patient/doctors/:doctorId` | Patient | Profile, date rail, real slots, booking |
| `/patient/appointments` | Patient | Upcoming/history, cancel pending or scheduled |
| `/doctor` | Doctor | Pending first, accept/cancel/complete visits |
| `/doctor/schedule` | Doctor | Weekly windows, date overrides, add/remove |
| `/doctor/profile` | Doctor | Public profile record |
| `/admin` | Admin | Doctor table with visibility toggles |
| `/admin/patients` | Admin | Patient directory |
| `/account` | Any signed-in role | Session, role shortcuts, switch role/sign out |

Every protected route is guarded client-side by `/auth/me` role; API policies remain
the source of truth. Visiting another role's area renders a friendly 403, and the
API's 401/403 responses surface as errors rather than silent failures.

## API surface used

The frontend expects the companion demo API changes described in
`docs/superpowers/specs/2026-11-18-easydoc-demo-frontend-design.md`:

- `GET /auth/me`, `GET /auth/demo-users`, `POST /auth/demo-login { key }`,
  `POST /auth/logout`
- `GET /lookups/departments`, `GET /lookups/cities`
- `GET /doctors/search?query=&cityId=&departmentId=`, `GET /doctors?cityId=&departmentId=`
- `GET /doctors/{id}`, `GET /doctors/{id}/available-slots?date=YYYY-MM-DD`
- `GET /doctors/me`
- `POST /appointments`, `GET /appointments/patient/me`,
  `POST /appointments/{id}/cancel/patient`
- `GET /appointments/doctor/me`, `POST /appointments/{id}/accept`,
  `POST /appointments/{id}/cancel`, `POST /appointments/{id}/Complete`
- `GET /doctors/{id}/schedules`, `GET /doctors/{id}/schedule-overrides`
- `POST /doctors/me/schedules`, `DELETE /doctors/me/schedules/{id}`
- `POST /doctors/me/schedule-overrides`,
  `DELETE /doctors/me/schedule-overrides/{id}`
- `GET /admin/doctors`, `PATCH /admin/doctors/{id}` with `{ isVisible }`
- `GET /admin/patients`

`GET /admin/doctors` may return either an array or a paged object (`items`) — the
normalizer handles both.

## Design and behavior notes

- **Search is the hero.** Live search is debounced; the URL stores `q`, `cityId`,
  and `departmentId` so a result page can be shared or restored.
- **Empty search uses `GET /doctors`.** A non-empty term uses
  `GET /doctors/search`; department and city filters are sent to both.
- **Monograms everywhere.** Seeded `profilePictureUrl` values are placeholders, so
  cards and profiles use initials rather than broken images.
- **Availability is honest.** The date rail covers the next 10 days, a native date
  field covers up to the API's 30-day booking limit, and already-passed times for
  today are hidden. Booking is a deliberate two-step select → confirm flow.
- **Server transition rules are respected in the UI.** Doctors can accept/cancel
  pending requests and complete scheduled visits, matching the API service.
  Patients can cancel pending or scheduled visits.
- **Tables become cards** below 760px using `data-label` rows; the doctor visibility
  toggle stays accessible on mobile.
- **States are real.** Loading skeletons, empty states, API error panels with retry,
  disabled pending actions, inline validation, success notices, and a session
  loading/offline screen are implemented throughout.
- **No registration surface.** The doctor profile explicitly notes that uploads and
  profile editing are out of scope.

## Assumptions and limitations

- The companion API endpoints must be present. If `/auth/me` itself is unavailable,
  the app shows a connection screen instead of a login form.
- Demo user response shapes are normalized tolerantly (`role`/`roles`, user lists or
  arrays), and lookup/admin list responses may be arrays or paged `items`.
- Enum values from System.Text.Json may be numeric or string; appointment statuses
  and schedule days are normalized on the client. Times may include seconds.
- Doctor appointment responses contain `patientId`, not a patient display name.
  Because doctors cannot read the admin patient list, the practice board labels
  records with a short patient reference rather than inventing a name.
- Seed appointment dates may be in the past relative to today. Pending seeded
  requests still appear on the doctor board; new patient bookings produce current
  upcoming visits.
- This demo does not implement registration, email delivery/confirmation, password
  reset, uploads, payments, or notifications.
- There is no automated test suite in this package; `npm run build` is the verified
  compile/build check.

## Structure

```text
src/
  api/         fetch client, contracts, tolerant normalizers, TanStack query functions
  auth/        session provider, route guards, logout
  components/  shell, monograms, date rail, slots, tables, modal, states
  lib/         date/time formatting, initials, debounce, document title
  pages/       login, patient, doctor, admin, account, access screens
  styles/      tokens/base, shared components, page layouts
```
