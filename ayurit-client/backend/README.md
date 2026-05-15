# Ayurit Backend

Real-time healthcare backend scaffold with Node.js APIs, optional Spring Boot reference, MongoDB/PostgreSQL support, AES encryption, role-based access, and built-in CSV export endpoints.

## Stack Coverage

- Backend: Node.js (active implementation) + Spring Boot (reference starter)
- Database: MongoDB or PostgreSQL (`DB_PROVIDER`)
- Cloud readiness: AWS/Azure via environment config and stateless API design
- Integration: REST endpoint for EHR/HIS push
- Security: JWT RBAC + AES-256 encryption for sensitive notes
- Real-time: Socket.IO events for patient/food/chart updates
-- Analytics: built-in CSV export endpoints (no Python required)

## Quick Start (Node API)

1. Copy `.env.example` to `.env` and set secrets.
2. Install packages:
   ```bash
   npm install
   ```
3. Start API:
   ```bash
   npm run dev
   ```
4. Health check:
   - `GET http://localhost:5000/api/health`

## Main APIs

- `POST /api/auth/token` issue role token
- `GET/POST /api/patients` patient records
- `GET/POST /api/foods` food records
- `GET/POST /api/charts` nutrition chart records
- `POST /api/integration/ehr/push` external EHR/HIS push (API key + role protected)

## Real-Time Events (Socket.IO)

- `patient:created`
- `food:created`
- `chart:created`
- `chart:updated` (patient room)

Client can join room with:

```js
socket.emit("join:patient", patientId);
```

## Analytics

The backend exposes CSV export endpoints and lightweight analytics derived from stored chart data. No separate Python tooling is required.

## Spring Boot Reference

A starter skeleton exists in `springboot-reference/` for teams that prefer Java services.
