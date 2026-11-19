# EasyDoc Web2 — Open Hours

A second, independent client for the EasyDoc API. The original **Friendly Care** client stays in
`../EasyDoc.Web/` and is untouched. Both clients talk to the same API and demo seats, so they can be
run side by side and chosen between.

**Open Hours** treats EasyDoc as a working appointment book: cool form paper, navy ink, the pink and
sky of the mark printed with a visible offset layer, statuses as rubber stamps, and time as the
structural spine. The display face is Bricolage Grotesque; Archivo carries the interface and tabular
times; Noto Sans Arabic renders Arabic names inline.

## Stack

- React 19 + TypeScript + Vite
- React Router (`react-router-dom`)
- TanStack Query and date-fns
- lucide-react
- Fontsource: Bricolage Grotesque, Archivo, Noto Sans Arabic
- Custom CSS only (no Tailwind or component library)
- Vitest for pure date and formatting logic

## Run it

Prerequisites:

1. Node.js 22+.
2. The EasyDoc API at `http://localhost:5215`, with SQL Server configured and migrations applied.
3. Demo mode enabled (`Demo:Enabled=true` in Development).

```bash
npm install
npm run dev
# http://localhost:5175
```

The browser calls `/api/...`; Vite strips `/api` and proxies to `http://localhost:5215` so the
session cookie stays same-origin. Override with `VITE_API_TARGET` when the API runs elsewhere. The
original client uses port 5174, so both can run at once.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on port 5175 with the `/api` proxy |
| `npm run build` | Type-check then build to `dist/` |
| `npm run preview` | Preview the build on port 4175 |
| `npm run check` | Type-check only |
| `npm test` | Run the Vitest suite |

## Routes

| Route | Access | Flow |
| --- | --- | --- |
| `/login` | Public | Demo seat desk with patient, doctor and demo admin tickets |
| `/login/standard` | Public | Patient email/password sign-in |
| `/register` | Public | Patient self-registration |
| `/patient` | Patient | Directory, search, specialty tabs, city filter |
| `/patient/doctors/:doctorId` | Patient | Practice sheet, 10-day date rail, time ledger, booking |
| `/patient/appointments` | Patient | Upcoming visits, records, reschedule, cancel |
| `/doctor` | Doctor | Practice board: requests, scheduled visits, closed record |
| `/doctor/schedule` | Doctor | Weekly windows and date overrides |
| `/doctor/profile` | Doctor | Public profile record |
| `/admin` | Admin | Doctor directory, visibility switches, record editing |
| `/admin/patients` | Admin | Read-only patient directory and record |
| `/account` | Any role | Seat identity, shortcuts, patient contact edit, switch seat |
| `/forbidden` | Any role | Role-boundary screen |

Every protected route is guarded by `/auth/me`; API policies remain authoritative.

## Auth and demo boundary

- **Demo seats:** `GET /auth/demo-users` then one-click `POST /auth/demo-login { key }` for سارة محمد
  (patient), أحمد حسن (doctor), and the demo admin.
- **Patient sign-in:** `POST /auth/login`, then `GET /auth/me`.
- **Patient registration:** `POST /patients/register`, then password sign-in. Demo mode
  auto-confirms new accounts.
- Doctor and admin seats are seeded; there is no doctor/admin self-registration.
- The demo admin is a review seat, not a production bypass. It can inspect directories and toggle
  doctor visibility; no destructive admin actions are exposed.
- Sample data only. Demo data may reset between reviews.

## API surface used

- `GET /auth/me`, `GET /auth/demo-users`, `POST /auth/demo-login`, `POST /auth/login`,
  `POST /auth/logout`
- `POST /patients/register`, `GET /patients/me`, `PATCH /patients/me`
- `GET /lookups/departments`, `GET /lookups/cities`
- `GET /doctors/search`, `GET /doctors`, `GET /doctors/{id}`, `GET /doctors/me`,
  `GET /doctors/{id}/available-slots?date=YYYY-MM-DD`
- `POST /appointments`, `GET /appointments/patient/me`, `POST /appointments/{id}/cancel/patient`,
  `PATCH /appointments/{id}/reschedule`
- `GET /appointments/doctor/me`, `POST /appointments/{id}/accept`, `POST /appointments/{id}/cancel`,
  `POST /appointments/{id}/Complete`, `GET /appointments/patients/{patientId}`
- Doctor weekly schedule and date-override read/add/update/delete endpoints
- `GET /admin/doctors`, `GET /admin/doctors/{id}`, `PATCH /admin/doctors/{id}`,
  `GET /admin/patients`, `GET /admin/patients/{id}`

## Design notes

- **The mark:** the colored right-hand mark from `1645547520474.jpeg`, cut from the source at native
  resolution, with a clean white die-cut edge for darker grounds. The original line-art mark is not
  used.
- **Palette:** `#f3f5fb` sheet, `#211c55` ink, `#f594bd` pink, `#92d3ef` sky, `#a9a7e0` offset.
  Status colors are functional and separate from the brand inks.
- **Signature:** the mark's misregistered printing becomes a 3–4px offset shadow on primary
  actions, held slots, date slips and the login plate. Status stamps are the only all-caps type.
- **Time is the spine:** the patient's booking panel, the doctor's day rows and the admin registry
  all share ruled ledgers, date stubs and tabular times.
- **Motion:** the request slip is stamped on success. Reduced motion is respected globally.
- **Arabic names** render inline with Noto Sans Arabic and are isolated with `bdi` so headings and
  rows keep their left alignment. The interface itself is English.

## Relationship to the original client

`EasyDoc.Web2` copies the API client, auth provider, normalizers and date helpers rather than
importing across apps. The two clients are independent: changing one cannot break the other. The
original `EasyDoc.Web` remains the **Friendly Care** direction; this one is **Open Hours**.

## Verification

- `npm run build` and `npm run check` pass.
- `npm test` covers date/time helpers, sorting, slot periods and formatting.
- The live flows were exercised against the seeded API, including demo login, search, doctor
  detail, booking, visits, doctor board, schedule, profile and admin directories.
