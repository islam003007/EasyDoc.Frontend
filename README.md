# EasyDoc Frontend

The EasyDoc scheduling client. The API lives in a separate repository:
[islam003007/EasyDoc](https://github.com/islam003007/EasyDoc).

`EasyDoc.Web/` is the single frontend: React 19, TypeScript, Vite, React Router and TanStack Query.
It includes the demo-seat desk, patient email/password sign-in, patient self-registration, and the
role-based patient, doctor and admin workspaces.

## Run

Start the EasyDoc API first (see the API repository). Then:

```bash
cd EasyDoc.Web
npm install
npm run dev
# http://localhost:5174
```

The Vite dev server proxies `/api` to `http://localhost:5215` and strips the prefix. Override the API
target when it runs elsewhere:

```bash
VITE_API_TARGET=http://172.18.96.1:5215 npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on port 5174 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the build on port 4174 |
| `npm run check` | TypeScript check |
| `npm test` | Vitest unit and component tests |
| `npm run check:sizes` | Enforce the screen, hook and stylesheet budgets |

## Demo seats

- Patient — سارة محمد
- Doctor — أحمد حسن
- Demo admin — Administrator

Patient email/password sign-in and self-registration are available. Doctor and admin seats are
seeded. Passwords are never stored in the browser. Everything uses sample clinic data; do not enter
real patient information.

## Documentation

`EasyDoc.Web/README.md` covers routes, the API surface, demo boundaries, resilience states, design
notes and verification. `docs/refactor-inventory.md` records the frontend size budgets and the
remaining structural work.
