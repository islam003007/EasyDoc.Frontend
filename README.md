# EasyDoc Frontend

Two independent clients for the **EasyDoc** scheduling API. The API lives in a separate repository:
[islam003007/EasyDoc](https://github.com/islam003007/EasyDoc).

| Client | Direction | Port | Notes |
| --- | --- | --- | --- |
| `EasyDoc.Web/` | **Friendly Care** | 5174 | Original client: ice-white surfaces, indigo, pink/sky mark, rounded cards |
| `EasyDoc.Web2/` | **Open Hours** | 5175 | Second client: paper/ink shell and time ledgers, with the Friendly Care auth flow |

Both clients use the same API and seeded demo seats. They copy their API/auth/date plumbing rather
than sharing a package, so changing one cannot break the other.

## Open Hours auth flow

`EasyDoc.Web2/` uses the **Friendly Care auth flow** for `/login`, `/login/standard` and
`/register`: the indigo brand panel, ice seat cards, mark art and form card. After authentication,
the app switches to the Open Hours paper/ink shell. The auth styles are scoped under `.fc-login`
and `.fc-auth`, so they cannot leak into the application shell.

The previous Open Hours auth screens were removed. Their state is preserved by the
`v1-both-clients` tag.

## Test and guard behavior

`EasyDoc.Web2` blocks a second active visit with the same doctor on the same day before the API is
called, on both booking and reschedule. Canceled visits do not block. The schedule UI hides `Add
hours` for days that already have a window and rejects duplicate override dates. Registration
validation matches the API password policy (8+ characters, upper/lower case, digit, symbol).

```bash
cd EasyDoc.Web2
npm test          # unit and component tests
npm run check     # TypeScript
npm run build     # production build
```

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

- `main` — both clients, including the Friendly Care auth flow in Open Hours
- `v1-both-clients` — tag for the pre-auth-port state
- `clinic-hours` — archived login exploration branch (not part of `main`)

## History

The Friendly Care history was extracted from the EasyDoc API repository before the frontend was
removed from it. The API repository now contains only backend code; this repository owns both
clients going forward.
