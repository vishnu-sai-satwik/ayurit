# Known Limitations

## Confirmed Non-Blocking Items
- MongoDB startup logs still report the database name as `unknown` in this environment, even though the connection succeeds and the app runs normally.
- The frontend production bundle still emits a Vite chunk-size warning because the main bundle is large.
- The backend process continues to emit normal health and notifications traffic during active sessions.

## Historical Note
- The duplicate `appointmentId` index warning was resolved during this pass and is no longer present on a fresh backend start.

## Out of Scope
- No CSS, layout, color, spacing, typography, animation, or component-structure changes were made.
- No unrelated business logic refactors were introduced.
