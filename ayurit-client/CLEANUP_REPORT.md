# AyurIT Cleanup Report

Date: 2026-05-15

Summary
-------
Performed a staged, safety-first cleanup focused on removing orphaned consultation/video-related code and verifying the project still builds and parses. I did not remove modules referenced by active code (e.g., clinical/diet endpoints still referenced from the frontend) to avoid breaking required flows.

Deleted files
-------------
The following files were removed after verifying there were no live imports or active route mounts referencing them:

- ayurit-client/src/components/VideoConsultation.jsx
- ayurit-client/src/components/VideoConsultation.css
- ayurit-client/src/utils/consultationClient.js
- backend/src/routes/consultationRoutes.js
- backend/src/controllers/consultationController.js
- backend/src/models/consultation.js
- backend/video_smoke_test.js

Note: all of the above were unmounted/unreferenced by active route mounts or frontend imports.

Deleted dependencies
--------------------
- No dependencies were removed from `package.json` in this pass. A full dependency analysis (unused npm packages) requires static analysis tooling or running `depcheck` — I can run that next if you want.

Active modules remaining
------------------------
These modules remain and are actively referenced by the app:

- Authentication (login / signup)
- Protected route handling
- Doctor dashboard
- Patient dashboard
- Superadmin dashboard
- Appointments and slot booking
- Diet chart flow and AI diet plans (`/api/ai/*`)
- MongoDB integration (Mongoose) and DataService

Files/services intentionally retained for safety
------------------------------------------------
- `backend/src/services/dataService.js` — still contains consultation/prescription helpers but they are not used by active routes; left intact to avoid removing shared logic that might be referenced elsewhere. If you want, I can remove consultation-related methods from `dataService` in a follow-up pass after confirming no references.

Build and validation results
----------------------------
- Frontend build: `npm run build` (client) — succeeded.
  - Output: `dist/` created. Build showed a chunk-size warning (one JS chunk > 500 KB). This is a performance warning only.

- Backend syntax check: `node --check backend/src/server.js` — no syntax errors reported.

Warnings & risky items
----------------------
- `backend/src/services/dataService.js` still contains consultation and prescription methods. Removing these requires more comprehensive cross-referencing and test coverage. Marked as RISK: medium if removed without further verification.
- `backend/src/routes/clinicalRoutes.js` and related clinical/diet routes exist but are not mounted; the frontend still calls `/clinical/*` endpoints in a few places (these calls are being suppressed on the client). Decide whether to mount clinical routes or remove them; both options require coordinated changes on frontend or backend.
- I did not remove any `package.json` dependencies. Automated dependency removal should be done with `depcheck` and human review before editing `package.json`.

Next recommended steps (safe, staged)
------------------------------------
1. Run `depcheck` on both frontend and backend to produce a list of unused npm packages, review results, then remove safe dependencies.
2. Decide on clinical module fate:
   - If you want clinical/diet endpoints removed: remove `/clinical` routes and related backend code and remove or update all frontend calls (some already guarded with `suppressToast`).
   - If you want clinical kept: mount `clinicalRoutes` in `backend/src/routes/index.js` and restore backend handlers.
3. Optionally remove consultation-related methods from `dataService` and any orphan `PrescriptionModel` code after verifying no remaining references.
4. Run full test cycle (manual smoke tests or unit tests if available), then commit changes.

Commands I ran
--------------
- `cd ayurit-client && npm run build` (frontend build)
- `node --check c:\\Users\\ursha\\Desktop\\ayurit-client\\backend\\src\\server.js` (backend syntax check)

Files modified (not deleted)
----------------------------
- `backend/src/routes/index.js` — AI routes were mounted at `/api/ai` earlier in this session to restore diet endpoints.
- `ayurit-client/src/pages/DoctorDashboard.jsx` — added `suppressToast` to AI calls and guarded approve/reject actions.
- `ayurit-client/src/pages/PatientDashboard.jsx` — added `suppressToast` to AI calls and PDF download handling; suppressed `/users` toast.
- `ayurit-client/src/utils/api.js` — already had `suppressToast` logic; no changes made in this pass.

If you approve, I'll continue the staged cleanup:
- run `depcheck` and prepare a safe list of removable npm packages,
- identify and remove unused methods in `dataService` (consultation/prescription) and confirm no references,
- remove the `clinical` backend routes if you want them removed and update frontend calls accordingly,
- run the frontend build + backend checks again and produce a final CLEANUP_REPORT with a full deletion list and exact git commit commands.

Would you like me to proceed with `depcheck` and a deeper pass to remove unused npm packages and clean `dataService` methods now?