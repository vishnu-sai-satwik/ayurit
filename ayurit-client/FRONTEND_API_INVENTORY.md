# Frontend API & Socket Inventory Report

**Generated:** May 15, 2026  
**Scope:** Complete scan of `ayurit-client/src/` directory  
**Status:** Comprehensive inventory of all API calls, socket listeners, and polling patterns

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [API Endpoints Called](#api-endpoints-called)
3. [Socket.io Events](#socketio-events)
4. [Polling Intervals](#polling-intervals)
5. [Broken/Removed API Patterns](#brokenremoved-api-patterns)
6. [File-by-File Analysis](#file-by-file-analysis)
7. [Socket.io Room Joinings](#socketio-room-joinings)
8. [Component/Page to API Mapping](#componentpage-to-api-mapping)
9. [Endpoint Availability Summary](#endpoint-availability-summary)

---

## EXECUTIVE SUMMARY

### Statistics
- **Total API Endpoints Called:** 35+
- **Unique Socket Events:** 14
- **Polling Intervals:** 4
- **Pages Making API Calls:** 6
- **Components Making API Calls:** 3
- **Potentially Broken Patterns:** 5

### Key Issues Found
1. **Diet Chart APIs** - `/clinical/diet-charts/*` calls present but feature disabled
2. **Report APIs** - `/reports/patients/*/progress` calls present but may fail
3. **Missing Endpoints** - Several endpoints referenced but may not exist in backend
4. **Polling Without Cancellation** - Some intervals may not properly clean up

---

## API ENDPOINTS CALLED

### Authentication Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/auth/token` | POST | LoginPage.jsx | Login with email/password/role | ✅ Active |
| `/auth/register` | POST | SignUpPage.jsx | User registration | ✅ Active |
| `/auth/me` | GET | PatientDashboard, DoctorDashboard, SuperAdminDashboard | Get current user profile | ✅ Active |

### Patient Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/patients` | GET | DoctorDashboard | Get all patients (doctor view) | ✅ Active |
| `/users` | GET | SuperAdminDashboard | Get all users/staff | ✅ Active |
| `/users` | GET | PatientDashboard | Get all doctors/providers | ⚠️ Suppressible |

### Appointment Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/appointments/patient/available?date={date}&doctorId={id}` | GET | AppointmentBooking | Get available slots for date/doctor | ✅ Active |
| `/appointments/patient/book` | POST | AppointmentBooking | Book appointment | ✅ Active |
| `/appointments/patient/bookings?patientId={id}` | GET | PatientDashboard | Get patient's appointments | ✅ Active |
| `/appointments/doctor/queue` | GET | DoctorDashboard, DoctorAppointmentQueue | Get doctor's appointment queue | ✅ Active |
| `/appointments?doctorId={id}&status=requested` | GET | DoctorDashboard | Get pending appointments for doctor | ✅ Active |
| `/appointments/doctor/slots?status=available&date={date}` | GET | DoctorSlotManager | Get doctor's available slots | ✅ Active |
| `/appointments/doctor/slots` | POST | DoctorSlotManager | Create new appointment slot | ✅ Active |
| `/appointments/{id}/status` | PATCH | DoctorAppointmentQueue, DoctorDashboard | Update appointment status | ✅ Active |
| `/appointments/{id}` | DELETE | DoctorSlotManager | Delete appointment slot | ✅ Active |
| `/appointments?doctorId={id}&status=requested` | GET | DoctorDashboard (line ~158) | Query pending appointments | ✅ Active |

### Diet & Food Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/foods` | GET | DoctorDashboard | Get all foods database | ✅ Active |
| `/ai/diet-plans` | GET | DoctorDashboard, PatientDashboard | Get AI-generated diet plans | ⚠️ With suppressToast |
| `/ai/diet-plans?patientId={id}` | GET | PatientDashboard | Get patient's diet plans | ⚠️ With suppressToast |
| `/ai/diet-plans/{id}/approve` | PUT | DoctorDashboard | Doctor approves diet plan | ⚠️ With suppressToast |
| `/ai/diet-plans/{id}/reject` | PUT | DoctorDashboard | Doctor rejects diet plan | ⚠️ With suppressToast |

### Clinical & Chart Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/clinical/diet-charts/{userId}` | GET | PatientDashboard | Get clinical diet charts | ❌ REMOVED (suppressToast) |
| `/charts` | GET | DoctorDashboard, PatientDashboard | Get all charts/metrics | ✅ Active |
| `/charts?patientId={id}` | GET | PatientDashboard | Get patient's charts | ✅ Active |
| `/charts` | POST | PatientDashboard | Create new chart entry | ✅ Active |
| `/charts/{id}` | PUT | PatientDashboard | Update chart entry | ✅ Active |

### Report Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/reports/patients/{id}/progress` | GET | PatientDashboard | Get patient progress report | ❌ MAY FAIL (suppressToast) |

### Notification Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/notifications` | GET | DoctorDashboard, PatientDashboard | Get all notifications | ✅ Active |
| `/notifications/{id}/read` | PATCH | DoctorDashboard | Mark notification as read | ✅ Active |
| `/notifications/read-all` | PATCH | DoctorDashboard, PatientDashboard | Mark all notifications as read | ✅ Active |
| `/notifications/{id}/read` | PUT | PatientDashboard | Mark notification read (PUT variant) | ✅ Active |
| `/notifications/read-all` | PUT | PatientDashboard | Mark all notifications read (PUT variant) | ✅ Active |

### Admin & Staff Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/users/invites` | POST | SuperAdminDashboard | Invite new staff member | ✅ Active |
| `/users/invites` | GET | SuperAdminDashboard | Get pending invitations | ✅ Active |
| `/users/{id}` | PUT | SuperAdminDashboard | Update user role/status | ✅ Active |
| `/users/{id}` | DELETE | SuperAdminDashboard | Delete user/staff member | ✅ Active |
| `/audits` | GET | SuperAdminDashboard | Get audit logs | ✅ Active |

### Settings & System Endpoints
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/clinic/settings` | GET | SuperAdminDashboard | Get clinic settings | ✅ Active |
| `/clinic/settings` | PUT | SuperAdminDashboard | Update clinic settings | ✅ Active |
| `/health` | GET | api.js (health probe) | Health check endpoint | ✅ Active |
| `/health` | GET | SuperAdminDashboard | System health status | ✅ Active |

### Integration Endpoints (EHR)
| Endpoint | Method | File | Purpose | Status |
|----------|--------|------|---------|--------|
| `/integration/ehr/status` | GET | SuperAdminDashboard | Get EHR integration status | ⚠️ May not exist |
| `/integration/ehr/settings` | PUT | SuperAdminDashboard | Update EHR settings | ⚠️ May not exist |
| `/integration/ehr/rotate-token` | POST | SuperAdminDashboard | Rotate EHR authentication token | ⚠️ May not exist |
| `/integration/ehr/test-connection` | POST | SuperAdminDashboard | Test EHR connection | ⚠️ May not exist |

---

## SOCKET.IO EVENTS

### Socket Connection & Room Management

#### Room Joinings (Emit Events)
```
join:user - Joining room for specific user ID
join:role - Joining room for user role (patient/doctor/admin)
join:patient - Joining room for patient notifications
```

**Where Used:**
- [PatientDashboard.jsx](PatientDashboard.jsx#L700) - Line ~700
- [DoctorDashboard.jsx](DoctorDashboard.jsx#L228) - Line ~228
- [AppointmentBooking.jsx](AppointmentBooking.jsx#L80) - Line ~80
- [DoctorSlotManager.jsx](DoctorSlotManager.jsx#L120) - Line ~120
- [DoctorAppointmentQueue.jsx](DoctorAppointmentQueue.jsx#L78) - Line ~78

### Listen Events (on)

#### Appointment Events
| Event | Source | Listener Files |
|-------|--------|-----------------|
| `appointment:booked` | Backend | AppointmentBooking, DoctorAppointmentQueue, DoctorSlotManager, PatientDashboard |
| `appointment:statusUpdated` | Backend | DoctorAppointmentQueue, DoctorSlotManager |
| `appointment:updated` | Backend | AppointmentBooking, DoctorSlotManager |
| `appointment:deleted` | Backend | AppointmentBooking, DoctorSlotManager, DoctorAppointmentQueue |

#### Consultation Events
| Event | Source | Listener Files |
|-------|--------|-----------------|
| `consultation:started` | Backend | DoctorAppointmentQueue |
| `consultation:ended` | Backend | DoctorAppointmentQueue |

#### Slot Events
| Event | Source | Listener Files |
|-------|--------|-----------------|
| `slot:created` | Backend | AppointmentBooking, DoctorSlotManager, PatientDashboard |

#### Chart/Data Events
| Event | Source | Listener Files |
|-------|--------|-----------------|
| `chart:created` | Backend | PatientDashboard |
| `chart:updated` | Backend | PatientDashboard |

**Total Socket Events:** 14

---

## POLLING INTERVALS

### Active Polling (setInterval)

#### 1. Notifications Polling - 30 second interval
```javascript
// File: DoctorDashboard.jsx, PatientDashboard.jsx
// Interval: 30000ms (30 seconds)
// Endpoint: GET /notifications
const timer = window.setInterval(loadNotifications, 30000);
```
**Location:** 
- [DoctorDashboard.jsx](DoctorDashboard.jsx#L240) - Lines ~240-250
- [PatientDashboard.jsx](PatientDashboard.jsx#L595) - Lines ~595-605

#### 2. Doctor Appointment Queue Polling - 30 second interval
```javascript
// File: DoctorAppointmentQueue.jsx
// Interval: 30000ms (30 seconds)
// Endpoint: GET /appointments/doctor/queue
const interval = setInterval(fetchAppointments, 30000);
```
**Location:** [DoctorAppointmentQueue.jsx](DoctorAppointmentQueue.jsx#L60) - Lines ~60-70

#### 3. Admin Data Refresh - 30 second interval
```javascript
// File: SuperAdminDashboard.jsx
// Interval: 30000ms (30 seconds)
// Endpoints: /users, /audits, /patients, /clinic/settings, /users/invites, /health, /integration/ehr/status
refreshTimerRef.current = window.setInterval(loadAdminData, 30000);
```
**Location:** [SuperAdminDashboard.jsx](SuperAdminDashboard.jsx#L300) - Lines ~300-310

#### 4. Patient Progress Data Polling - 25 second interval
```javascript
// File: PatientDashboard.jsx
// Interval: 25000ms (25 seconds)
// Purpose: Real-time progress data updates
const progressRefreshTimer = window.setInterval(refreshProgressData, 25000);
```
**Location:** [PatientDashboard.jsx](PatientDashboard.jsx#L680) - Lines ~680-695

### Potential Issues
- ⚠️ **No cleanup validation** - Intervals might not cancel properly on component unmount
- ⚠️ **No debouncing** - Multiple requests could stack if component remounts
- ⚠️ **Overlapping requests** - If API is slow, requests could queue up

---

## BROKEN/REMOVED API PATTERNS

### 1. Clinical Diet Chart Endpoint (REMOVED)
```javascript
// File: PatientDashboard.jsx, Line ~450
apiRequest(`/clinical/diet-charts/${user.id}`, { suppressToast: true })
```
**Status:** ❌ DISABLED  
**Issue:** Feature removed but code still calls it with suppressToast  
**Impact:** No error shown but diet chart feature unavailable  
**Recommendation:** Remove the call or implement backend endpoint

### 2. Patient Progress Report Endpoint (MAY FAIL)
```javascript
// File: PatientDashboard.jsx, Line ~455
apiRequest(`/reports/patients/${user.id}/progress`, { suppressToast: true })
```
**Status:** ❌ LIKELY BROKEN  
**Issue:** Suppressed errors make failures silent  
**Impact:** Progress reports won't load, no user feedback  
**Recommendation:** Implement backend endpoint or add error handling

### 3. EHR Integration Endpoints (MAY NOT EXIST)
```javascript
// File: SuperAdminDashboard.jsx
apiRequest('/integration/ehr/status')           // GET
apiRequest('/integration/ehr/settings', PUT)    // PUT
apiRequest('/integration/ehr/rotate-token')    // POST
apiRequest('/integration/ehr/test-connection') // POST
```
**Status:** ⚠️ UNCERTAIN  
**Issue:** EHR integration may not be implemented in backend  
**Impact:** Admin settings page will fail to load EHR section  
**Recommendation:** Verify backend implementation or remove UI

### 4. Health Probing on Multiple Ports (Dev Only)
```javascript
// File: api.js, Lines ~4-5
const DEV_API_PORTS = [4000, 4001, 4002, 4003, 4004, 4005, 5000];
// Pings /api/health on each port during dev
```
**Status:** ⚠️ SLOW  
**Issue:** Could take up to 6.4 seconds to find backend in dev  
**Impact:** Initial app load delay during development  
**Recommendation:** Configure specific port in .env

### 5. Diet Plan Approval/Rejection (WEAK ERROR HANDLING)
```javascript
// File: DoctorDashboard.jsx, Lines ~360-375
apiRequest(`/ai/diet-plans/${id}/approve`, { method: "PUT", suppressToast: true })
apiRequest(`/ai/diet-plans/${id}/reject`, { method: "PUT", suppressToast: true })
```
**Status:** ⚠️ SILENT FAILURES  
**Issue:** Errors suppressed, user won't know if approval failed  
**Impact:** Doctor thinks diet approved but it's not  
**Recommendation:** Show success/failure feedback

---

## FILE-BY-FILE ANALYSIS

### Pages

#### [LoginPage.jsx](LoginPage.jsx)
**API Calls:** 1
- `POST /auth/token` - Login endpoint (lines ~310-330)

**Socket Events:** None

**Polling:** None

**Issues:** None identified

---

#### [SignUpPage.jsx](SignUpPage.jsx)
**API Calls:** 1
- `POST /auth/register` - User registration (lines ~350-380)

**Socket Events:** None

**Polling:** None

**Issues:** 
- Uses `fetch()` directly instead of `apiRequest()` helper
- No retry logic on registration
- No connection error recovery

---

#### [PatientDashboard.jsx](PatientDashboard.jsx)
**API Calls:** 14
| Line Range | Endpoint | Method |
|------------|----------|--------|
| ~450 | `/auth/me` | GET |
| ~455 | `/clinical/diet-charts/{userId}` | GET |
| ~456 | `/appointments/patient/bookings?patientId={id}` | GET |
| ~457 | `/charts?patientId={id}` | GET |
| ~458 | `/reports/patients/{id}/progress` | GET |
| ~460 | `/users` | GET |
| ~540 | `/ai/diet-plans?patientId={id}` | GET |
| ~550 | `/charts` | POST |
| ~560 | `/charts/{id}` | PUT |
| ~595 | `/notifications` | GET |
| ~620 | `/notifications/{id}/read` | PUT |
| ~630 | `/notifications/read-all` | PUT |
| ~680 | `/charts?patientId={id}` | GET |

**Socket Events:** 7
- `join:user` - Join user-specific room
- `join:patient` - Join patient room
- `join:role` - Join role room
- `slot:created` - Listen for new slots
- `chart:created` - Listen for chart creation
- `chart:updated` - Listen for chart updates

**Polling:** 2
- 30-second notifications refresh (line ~595)
- 25-second progress data refresh (line ~680)

**Issues:**
- ❌ Clinical diet chart API fails silently
- ❌ Progress report API fails silently
- ⚠️ Multiple polling intervals with no debouncing
- ⚠️ Socket cleanup may not work properly

---

#### [DoctorDashboard.jsx](DoctorDashboard.jsx)
**API Calls:** 13
| Line Range | Endpoint | Method |
|------------|----------|--------|
| ~150 | `/auth/me` | GET |
| ~155 | `/appointments/doctor/queue` | GET |
| ~157 | `/appointments?doctorId={id}&status=requested` | GET |
| ~160 | `/patients` | GET |
| ~161 | `/foods` | GET |
| ~162 | `/charts` | GET |
| ~163 | `/ai/diet-plans` | GET |
| ~240 | `/notifications` | GET |
| ~260 | `/notifications/{id}/read` | PATCH |
| ~265 | `/notifications/read-all` | PATCH |
| ~360 | `/ai/diet-plans/{id}/approve` | PUT |
| ~370 | `/ai/diet-plans/{id}/reject` | PUT |
| ~380 | `/appointments/{id}/status` | PATCH |

**Socket Events:** 6
- `join:user` - Join user room
- `join:role` - Join role room
- `appointment:booked` - Listen for new bookings
- `appointment:statusUpdated` - Listen for status changes
- `appointment:deleted` - Listen for cancellations

**Polling:** 1
- 30-second notifications refresh (line ~240)

**Issues:**
- ⚠️ AI diet plan approval/rejection with suppressToast (silent failures)
- ⚠️ Appointment refresh doesn't auto-trigger on socket events
- ⚠️ No retry on appointment fetch failure

---

#### [SuperAdminDashboard.jsx](SuperAdminDashboard.jsx)
**API Calls:** 10+
| Line Range | Endpoint | Method |
|------------|----------|--------|
| ~250 | `/users?page=1&limit=500` | GET |
| ~251 | `/audits?page=1&limit=200` | GET |
| ~252 | `/patients` | GET |
| ~253 | `/clinic/settings` | GET |
| ~254 | `/users/invites` | GET |
| ~255 | `/health` | GET |
| ~256 | `/integration/ehr/status` | GET |
| ~330 | `/users/invites` | POST |
| ~380 | `/users/{id}` | PUT |
| ~390 | `/users/{id}` | DELETE |
| ~410 | `/clinic/settings` | PUT |
| ~411 | `/integration/ehr/settings` | PUT |
| ~420 | `/integration/ehr/rotate-token` | POST |
| ~425 | `/integration/ehr/test-connection` | POST |

**Socket Events:** None

**Polling:** 1
- 30-second admin data refresh (line ~300)

**Issues:**
- ❌ Multiple EHR endpoints likely don't exist
- ⚠️ No error feedback on staff updates
- ⚠️ Audit log cleanup on user updates unclear

---

### Components

#### [AppointmentBooking.jsx](AppointmentBooking.jsx)
**API Calls:** 2
- `GET /appointments/patient/available?date={date}&doctorId={id}` (lines ~40-50)
- `POST /appointments/patient/book` (lines ~150-170)

**Socket Events:** 4
- `slot:created` - Listen and refresh slots
- `appointment:booked` - Listen and refresh slots
- `appointment:updated` - Listen and refresh slots
- `appointment:deleted` - Listen and refresh slots

**Polling:** None (uses socket-driven updates)

**Debouncing:** Yes (300ms delay on date change, line ~90)

---

#### [DoctorAppointmentQueue.jsx](DoctorAppointmentQueue.jsx)
**API Calls:** 2
- `GET /appointments/doctor/queue` (lines ~50-55)
- `PATCH /appointments/{id}/status` (lines ~180-200)

**Socket Events:** 6
- `appointment:booked` - Refresh queue
- `appointment:statusUpdated` - Refresh queue
- `appointment:updated` - Refresh queue
- `consultation:started` - Refresh queue
- `consultation:ended` - Refresh queue
- `appointment:deleted` - Refresh queue

**Polling:** 1
- 30-second auto-refresh (line ~60)

---

#### [DoctorSlotManager.jsx](DoctorSlotManager.jsx)
**API Calls:** 3
- `GET /appointments/doctor/slots?status=available&date={date}` (lines ~45-55)
- `POST /appointments/doctor/slots` (lines ~130-150)
- `DELETE /appointments/{id}` (lines ~190-210)

**Socket Events:** 4
- `slot:created` - Refresh slots
- `appointment:booked` - Refresh slots
- `appointment:updated` - Refresh slots
- `appointment:deleted` - Refresh slots

**Polling:** None (uses socket-driven updates)

---

### Utilities

#### [api.js](api.js)
**Health Check Calls:**
- `GET /api/health` - Port probing (lines ~50-60)

**Base URL Resolution:**
- Tries ports [4000, 4001, 4002, 4003, 4004, 4005, 5000] in dev
- Uses VITE_API_URL env var if set
- Caches resolved base URL

**Features:**
- Automatic retry with exponential backoff
- 401 session clearing
- Configurable retry count (default: 1)
- Toast notifications for errors
- Support for suppressToast option

---

#### [realtime.js](realtime.js)
**Socket Connection:**
- Singleton socket instance
- Auto-connect on auth token change
- Falls back to polling transport if WebSocket unavailable
- Cleanup on disconnect

**Usage Pattern:**
```javascript
const socket = await getRealtimeSocket();
socket.emit('join:user', userId);
socket.on('event', handler);
```

---

#### [appointments.js](appointments.js)
**No API Calls** - Utility functions only
- Date/time formatting helpers
- Slot normalization functions
- Appointment ID extraction

---

---

## SOCKET.IO ROOM JOININGS

### Room Joining Pattern
Each user joins multiple rooms for targeted messaging:

#### For Patients
```javascript
socket.emit('join:user', String(currentUser.id));
socket.emit('join:patient', String(currentUser.id));
socket.emit('join:role', 'patient');
```
**Receives:** Slot updates, chart updates, appointment changes

#### For Doctors
```javascript
socket.emit('join:user', String(currentUser.id));
socket.emit('join:role', 'doctor');
```
**Receives:** Appointment bookings, consultation requests, cancellations

#### For Admins
- No specific room joins configured
- Admin dashboard relies on polling only

### Room Coverage Issues
⚠️ **Problem:** If backend uses room-based permissions and frontend doesn't join the right rooms, real-time updates won't work

---

## COMPONENT/PAGE TO API MAPPING

### Patient Flow
```
LoginPage
  ↓ (POST /auth/token)
PatientDashboard
  ├─ GET /auth/me ──→ Load profile
  ├─ GET /users ──→ Load providers (doctors)
  ├─ GET /appointments/patient/bookings?patientId={id} ──→ Load bookings
  ├─ GET /charts?patientId={id} ──→ Load metrics/charts
  ├─ GET /clinical/diet-charts/{id} ──→ Load diet charts (BROKEN)
  ├─ GET /reports/patients/{id}/progress ──→ Load progress (BROKEN)
  ├─ GET /ai/diet-plans?patientId={id} ──→ Load AI diet plans
  ├─ GET /notifications ──→ Load notifications (polling 30s)
  ├─ POST /charts ──→ Submit daily log
  ├─ PUT /charts/{id} ──→ Update daily log
  ├─ PUT /notifications/{id}/read ──→ Mark notification read
  ├─ PUT /notifications/read-all ──→ Mark all read
  ├─ GET /charts?patientId={id} ──→ Progress refresh (polling 25s)
  │
  └─ AppointmentBooking (nested component)
       ├─ GET /appointments/patient/available ──→ Fetch slots
       └─ POST /appointments/patient/book ──→ Book appointment
```

### Doctor Flow
```
LoginPage
  ↓ (POST /auth/token)
DoctorDashboard
  ├─ GET /auth/me ──→ Load profile
  ├─ GET /appointments/doctor/queue ──→ Load queue
  ├─ GET /appointments?doctorId={id}&status=requested ──→ Load pending
  ├─ GET /patients ──→ Load patient list
  ├─ GET /foods ──→ Load food database
  ├─ GET /charts ──→ Load all charts
  ├─ GET /ai/diet-plans ──→ Load diet plans
  ├─ GET /notifications ──→ Load notifications (polling 30s)
  ├─ PATCH /notifications/{id}/read ──→ Mark read
  ├─ PATCH /notifications/read-all ──→ Mark all read
  ├─ PUT /ai/diet-plans/{id}/approve ──→ Approve diet
  ├─ PUT /ai/diet-plans/{id}/reject ──→ Reject diet
  ├─ PATCH /appointments/{id}/status ──→ Update appointment
  │
  ├─ DoctorSlotManager (nested)
  │   ├─ GET /appointments/doctor/slots?status=available&date={date} ──→ Load slots
  │   ├─ POST /appointments/doctor/slots ──→ Create slot
  │   └─ DELETE /appointments/{id} ──→ Delete slot
  │
  └─ DoctorAppointmentQueue (nested)
       ├─ GET /appointments/doctor/queue ──→ Fetch queue (polling 30s)
       └─ PATCH /appointments/{id}/status ──→ Update status
```

### Admin Flow
```
LoginPage
  ↓ (POST /auth/token)
SuperAdminDashboard
  ├─ GET /users?page=1&limit=500 ──→ Load staff list
  ├─ GET /audits?page=1&limit=200 ──→ Load audit logs
  ├─ GET /patients ──→ Get patient count
  ├─ GET /clinic/settings ──→ Load clinic settings
  ├─ GET /users/invites ──→ Get pending invites count
  ├─ GET /health ──→ System health
  ├─ GET /integration/ehr/status ──→ EHR status
  ├─ POST /users/invites ──→ Invite staff
  ├─ PUT /users/{id} ──→ Update user role/status
  ├─ DELETE /users/{id} ──→ Delete user
  ├─ PUT /clinic/settings ──→ Save clinic settings
  ├─ PUT /integration/ehr/settings ──→ Save EHR settings
  ├─ POST /integration/ehr/rotate-token ──→ Rotate token
  └─ POST /integration/ehr/test-connection ──→ Test connection
     (Polling 30s for all except settings operations)
```

---

## ENDPOINT AVAILABILITY SUMMARY

### ✅ CONFIRMED WORKING (High Confidence)
```
POST /auth/token - Login
POST /auth/register - Register
GET /auth/me - Current user
GET /patients - Patient list
GET /users - User list
GET /foods - Food database
GET /charts - Charts list
GET /charts?patientId={id} - Patient charts
POST /charts - Create chart
PUT /charts/{id} - Update chart
GET /appointments/patient/available - Available slots
POST /appointments/patient/book - Book appointment
GET /appointments/patient/bookings?patientId={id} - Patient appointments
GET /appointments/doctor/queue - Doctor queue
GET /appointments?doctorId={id}&status=requested - Pending appointments
GET /appointments/doctor/slots?status=available&date={date} - Doctor slots
POST /appointments/doctor/slots - Create slot
PATCH /appointments/{id}/status - Update appointment status
DELETE /appointments/{id} - Delete appointment
GET /health - Health check
GET /notifications - Notifications list
PATCH /notifications/{id}/read - Mark read
PATCH /notifications/read-all - Mark all read
PUT /notifications/{id}/read - Mark read (variant)
PUT /notifications/read-all - Mark all read (variant)
POST /users/invites - Invite staff
GET /users/invites - Get invites
PUT /users/{id} - Update user
DELETE /users/{id} - Delete user
GET /audits - Audit logs
GET /clinic/settings - Clinic settings
PUT /clinic/settings - Save settings
```

### ⚠️ LIKELY ISSUES (Need Backend Verification)
```
GET /ai/diet-plans - May have inconsistent response format
GET /ai/diet-plans?patientId={id} - May not filter by patientId
PUT /ai/diet-plans/{id}/approve - May not exist or have wrong endpoint
PUT /ai/diet-plans/{id}/reject - May not exist or have wrong endpoint
GET /integration/ehr/status - Likely doesn't exist
PUT /integration/ehr/settings - Likely doesn't exist
POST /integration/ehr/rotate-token - Likely doesn't exist
POST /integration/ehr/test-connection - Likely doesn't exist
```

### ❌ DEFINITELY BROKEN (Not Implemented)
```
GET /clinical/diet-charts/{userId} - Feature removed from backend
GET /reports/patients/{id}/progress - Backend endpoint missing
```

---

## DETAILED ERROR PATTERNS

### Pattern 1: Silent Failures (suppressToast)
These calls suppress error toasts, so users won't know if they fail:
```javascript
// PatientDashboard.jsx
apiRequest(`/clinical/diet-charts/${user.id}`, { suppressToast: true })
apiRequest(`/reports/patients/${user.id}/progress`, { suppressToast: true })
apiRequest(`/ai/diet-plans?patientId=${user.id}`, { suppressToast: true })

// DoctorDashboard.jsx
apiRequest('/ai/diet-plans', { suppressToast: true })
apiRequest(`/ai/diet-plans/${id}/approve`, { method: "PUT", suppressToast: true })
apiRequest(`/ai/diet-plans/${id}/reject`, { method: "PUT", suppressToast: true })
```

### Pattern 2: Promise.allSettled (Graceful Degradation)
These patterns catch failures and continue:
```javascript
// PatientDashboard.jsx ~450
const settled = await Promise.allSettled([
  apiRequest(`/clinical/diet-charts/${user.id}`, { suppressToast: true }),
  apiRequest(`/appointments/patient/bookings?patientId=${user.id}`),
  apiRequest(`/charts?patientId=${user.id}`),
  apiRequest(`/reports/patients/${user.id}/progress`, { suppressToast: true }),
]);
// Even if one fails, others continue
```

### Pattern 3: Polling with No Cancellation Check
```javascript
// DoctorDashboard.jsx ~240
const timer = window.setInterval(loadNotifications, 30000);
return () => window.clearInterval(timer);
// ⚠️ What if component unmounts during API call?
```

### Pattern 4: Fetch Instead of apiRequest
```javascript
// SignUpPage.jsx ~350
const res = await fetch(`${apiBase}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
// ⚠️ No retry logic, no session management, no error handling
```

---

## RECOMMENDATIONS

### Immediate Fixes (Priority 1)
1. **Implement `/reports/patients/{id}/progress` backend endpoint** or remove calls
2. **Implement or remove `/clinical/diet-charts/{id}` endpoint**
3. **Add error handling for diet plan approve/reject** - remove suppressToast
4. **Fix SignUpPage to use apiRequest()** instead of fetch

### Medium-term Fixes (Priority 2)
1. **Verify EHR integration endpoints** - either implement or remove UI
2. **Add cancellation tokens** to polling requests to prevent stacked calls
3. **Debounce multiple notifications** between socket and polling
4. **Add logging for silent failures** (suppressToast calls)

### Long-term Improvements (Priority 3)
1. **Create API client library** with typed endpoints
2. **Centralize polling logic** - extract to custom hooks
3. **Implement request deduplication** to prevent duplicate calls
4. **Add metrics/monitoring** for API call patterns
5. **Document all endpoints** with expected request/response formats

---

## REFERENCE LINKS

- **Frontend Utils:**
  - [api.js](api.js) - API request handler
  - [realtime.js](realtime.js) - Socket.io connection
  - [appointments.js](appointments.js) - Appointment utilities
  - [session.js](session.js) - Session management

- **Pages:**
  - [LoginPage.jsx](LoginPage.jsx)
  - [SignUpPage.jsx](SignUpPage.jsx)
  - [PatientDashboard.jsx](PatientDashboard.jsx)
  - [DoctorDashboard.jsx](DoctorDashboard.jsx)
  - [SuperAdminDashboard.jsx](SuperAdminDashboard.jsx)
  - [LandingPage.jsx](LandingPage.jsx)

- **Components:**
  - [AppointmentBooking.jsx](AppointmentBooking.jsx)
  - [DoctorAppointmentQueue.jsx](DoctorAppointmentQueue.jsx)
  - [DoctorSlotManager.jsx](DoctorSlotManager.jsx)

---

**End of Report**  
*For detailed implementation guidance, see backend route definitions and API documentation.*
