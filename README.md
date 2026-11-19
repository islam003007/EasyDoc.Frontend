# EasyDoc Frontend

Two independent clients for the **EasyDoc** scheduling API. The API lives in a separate repository:
[islam003007/EasyDoc](https://github.com/islam003007/EasyDoc).

| Client | Direction | Port | Notes |
| --- | --- | --- | --- |
| `EasyDoc.Web/` | **Friendly Care** | 5174 | Original client: ice-white surfaces, indigo, pink/sky mark, rounded cards |
| `EasyDoc.Web2/` | **Open Hours** | 5175 | Second client: paper, ink, offset print, stamped statuses, time ledgers |

Both clients use the same API and seeded demo seats. They copy their API/auth/date plumbing rather
than sharing a package, so changing one cannot break the other.

## Run

Start the EasyDoc API first (see the API repository). Then, from this repository:

```bash
# Friendly Care
cd EasyDoc.Web
npm install
npm run dev
# http://localhost:5174

# Open Hours
cd EasyDoc.Web2
npm install
npm run dev
# http://localhost:5175
```

Both Vite servers proxy `/api` to `http://localhost:5215` and strip the prefix. Override the API
target when it runs elsewhere:

```bash
VITE_API_TARGET=http://172.18.96.1:5215 npm run dev
```

Each client has its own README with routes, auth modes, demo boundaries and build notes.

## Demo seats

- Patient — سارة محمد
- Doctor — أحمد حسن
- Demo admin — Administrator

Patient email/password sign-in and self-registration are available. Doctor and admin seats are
seeded. Everything uses sample clinic data; do not enter real patient information.

## Branches and tags

- `main` — both clients, preserved as the first frontend split
- `v1-both-clients` — tag for the exact state at the split
- `clinic-hours` — design exploration branch for the second client

### Login spikes

On the `clinic-hours` branch, two dev-only login directions are available:

- `http://localhost:5175/spike/clinic-hours` — pale-sage timetable, no split panel
- `http://localhost:5175/spike/register` — white editorial index, one vermilion accent

The current Open Hours login stays at `http://localhost:5175/login`. The spike routes are guarded by
`import.meta.env.DEV` and do not exist in a production build.

## History

The Friendly Care history was extracted from the EasyDoc API repository before the frontend was
removed from it. The API repository now contains only backend code; this repository owns both
clients going forward.
