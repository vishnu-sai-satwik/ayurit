# FRONTEND API LANDSCAPE - COMPLETE ANALYSIS

**Analysis Date:** May 15, 2026  
**Scope:** Complete frontend API inventory scan  
**Backend:** Running on localhost:4002

---

## 📋 QUICK START

### What You Need to Know
1. **35+ API endpoints** are called by frontend
2. **5 CRITICAL issues** must be fixed before production
3. **14 socket.io events** sync real-time updates
4. **4 polling intervals** refresh data every 25-30 seconds
5. **API responses may be inconsistent** with what frontend expects

### Three Documents to Read
1. **[API_ISSUES_CRITICAL.md](API_ISSUES_CRITICAL.md)** ← Start here if you have 10 mins
2. **[FRONTEND_API_INVENTORY.md](FRONTEND_API_INVENTORY.md)** ← Complete reference (30 mins)
3. **[FRONTEND_API_TESTING_GUIDE.md](FRONTEND_API_TESTING_GUIDE.md)** ← Implementation details (20 mins)

---

## 🎯 CRITICAL ISSUES AT A GLANCE

### 🔴 Must Fix Before Production
| Issue | Impact | File | Fix Effort |
|-------|--------|------|-----------|
| Missing `/reports/patients/{id}/progress` | Patient progress never loads | PatientDashboard | 2-4 hours |
| Removed `/clinical/diet-charts/{id}` | Diet chart feature broken | PatientDashboard | 2-3 hours |
| Silent diet approval failures | Doctor doesn't know if approval worked | DoctorDashboard | 1 hour |
| Admin data polling blocks on EHR error | Admin can't load staff/audits | SuperAdminDashboard | 1 hour |
| SignUpPage uses fetch() not apiRequest() | No retry on network error | SignUpPage | 30 mins |

**Total Fix Time:** ~7-9 hours

---

## 📊 API BREAKDOWN BY CATEGORY

### Authentication (3 endpoints)
- `POST /auth/token` - ✅ Working
- `POST /auth/register` - ⚠️ Uses fetch() instead of apiRequest()
- `GET /auth/me` - ✅ Working

### Appointments (9 endpoints)
- Slot queries - ✅ Working
- Booking - ✅ Working
- Status updates - ✅ Working
- Queue view - ✅ Working

### Diet & AI (5 endpoints)
- Get diet plans - ✅ Working but inconsistent
- Approve/reject plans - ❌ Silent failures (suppressToast)
- Load foods - ✅ Working

### Charts & Metrics (5 endpoints)
- Get charts - ✅ Working
- Create chart - ✅ Working
- Update chart - ✅ Working
- **GET progress reports** - ❌ BROKEN (endpoint missing)
- **GET diet charts** - ❌ BROKEN (endpoint removed)

### Notifications (5 endpoints)
- Get notifications - ✅ Working
- Mark read - ✅ Working (but inconsistent PUT vs PATCH)
- Mark all read - ✅ Working (but inconsistent PUT vs PATCH)

### Admin/Staff (7 endpoints)
- User management - ✅ Working
- Audit logs - ✅ Working
- Invitations - ✅ Working
- Clinic settings - ✅ Working

### EHR Integration (4 endpoints)
- Status - ❌ Likely doesn't exist
- Settings - ❌ Likely doesn't exist
- Rotate token - ❌ Likely doesn't exist
- Test connection - ❌ Likely doesn't exist

**Total: 35+ endpoints, 5 definitely broken, 4 uncertain**

---

## 🔌 SOCKET.IO REAL-TIME PATTERNS

### Events Being Listened For
```
appointment:booked              → Slot lists refresh
appointment:statusUpdated       → Queue/list updates
appointment:updated             → Slot lists refresh
appointment:deleted             → Slot lists refresh
consultation:started            → Queue updates
consultation:ended              → Queue updates
slot:created                    → Available slots refresh
chart:created                   → Daily log updates
chart:updated                   → Daily log updates
```

### Room Joinings
```
join:user {userId}              → Patient/Doctor gets user-specific events
join:patient {patientId}        → Patient gets patient-specific events
join:role {role}                → Gets role-specific broadcast events
```

**Missing:** No room joins for Admin role

---

## 📡 POLLING PATTERNS

### 4 Active Polling Intervals

#### 1️⃣ Notifications (30 seconds)
```javascript
// DoctorDashboard.jsx, PatientDashboard.jsx
GET /notifications every 30s
Issue: No request cancellation ⚠️
```

#### 2️⃣ Appointment Queue (30 seconds)
```javascript
// DoctorAppointmentQueue.jsx
GET /appointments/doctor/queue every 30s
Issue: No request cancellation ⚠️
```

#### 3️⃣ Admin Data (30 seconds)
```javascript
// SuperAdminDashboard.jsx
GET /users, /audits, /patients, /clinic/settings, /health, /integration/ehr/status
Issue: Blocks on EHR error ❌
```

#### 4️⃣ Progress Data (25 seconds)
```javascript
// PatientDashboard.jsx
Calls refreshProgressData() every 25s
Issue: Aggressive interval, no cancellation ⚠️
```

**Problem:** All 4 intervals lack proper cancellation logic → memory leaks possible

---

## 📁 FILE DEPENDENCY MAP

### Pages Making API Calls

```
LoginPage.jsx
  └─ POST /auth/token

SignUpPage.jsx
  └─ POST /auth/register (uses fetch, not apiRequest)

PatientDashboard.jsx
  ├─ GET /auth/me
  ├─ GET /users (load providers)
  ├─ GET /appointments/patient/bookings?patientId={id}
  ├─ GET /charts?patientId={id}
  ├─ GET /clinical/diet-charts/{id} ❌ BROKEN
  ├─ GET /reports/patients/{id}/progress ❌ BROKEN
  ├─ GET /ai/diet-plans?patientId={id}
  ├─ GET /notifications (polling 30s)
  ├─ POST /charts
  ├─ PUT /charts/{id}
  ├─ PUT /notifications/{id}/read
  ├─ PUT /notifications/read-all
  ├─ Socket: join:user, join:patient, join:role
  └─ Socket: listen for slot:created, chart:created, chart:updated

DoctorDashboard.jsx
  ├─ GET /auth/me
  ├─ GET /appointments/doctor/queue
  ├─ GET /appointments?doctorId={id}&status=requested
  ├─ GET /patients
  ├─ GET /foods
  ├─ GET /charts
  ├─ GET /ai/diet-plans
  ├─ GET /notifications (polling 30s)
  ├─ PATCH /notifications/{id}/read
  ├─ PATCH /notifications/read-all
  ├─ PUT /ai/diet-plans/{id}/approve ❌ SILENT FAILURE
  ├─ PUT /ai/diet-plans/{id}/reject ❌ SILENT FAILURE
  ├─ PATCH /appointments/{id}/status
  ├─ Socket: join:user, join:role
  └─ Socket: listen for appointment:booked, appointment:statusUpdated, appointment:deleted
  
  ├─ DoctorSlotManager (nested)
  │  ├─ GET /appointments/doctor/slots?status=available&date={date}
  │  ├─ POST /appointments/doctor/slots
  │  ├─ DELETE /appointments/{id}
  │  └─ Socket: listen for slot:created, appointment:booked, appointment:updated, appointment:deleted
  
  └─ DoctorAppointmentQueue (nested)
     ├─ GET /appointments/doctor/queue (polling 30s)
     ├─ PATCH /appointments/{id}/status
     └─ Socket: listen for appointment:*, consultation:*, appointment:deleted

SuperAdminDashboard.jsx
  ├─ GET /users?page=1&limit=500
  ├─ GET /audits?page=1&limit=200
  ├─ GET /patients
  ├─ GET /clinic/settings
  ├─ GET /users/invites
  ├─ GET /health
  ├─ GET /integration/ehr/status ❌ UNCERTAIN
  ├─ POST /users/invites
  ├─ PUT /users/{id}
  ├─ DELETE /users/{id}
  ├─ PUT /clinic/settings
  ├─ PUT /integration/ehr/settings ❌ UNCERTAIN
  ├─ POST /integration/ehr/rotate-token ❌ UNCERTAIN
  ├─ POST /integration/ehr/test-connection ❌ UNCERTAIN
  └─ Polling: 30s refresh of all the above ❌ USES Promise.all (BLOCKS)

LandingPage.jsx
  └─ No API calls (no auth required)
```

### Components Making API Calls

```
AppointmentBooking.jsx
  ├─ GET /appointments/patient/available?date={date}&doctorId={id}
  ├─ POST /appointments/patient/book
  └─ Socket: listen for slot:created, appointment:booked, appointment:updated, appointment:deleted

DoctorSlotManager.jsx
  ├─ GET /appointments/doctor/slots?status=available&date={date}
  ├─ POST /appointments/doctor/slots
  ├─ DELETE /appointments/{id}
  └─ Socket: listen for slot:created, appointment:booked, appointment:updated, appointment:deleted

DoctorAppointmentQueue.jsx
  ├─ GET /appointments/doctor/queue (polling 30s)
  ├─ PATCH /appointments/{id}/status
  └─ Socket: listen for appointment:booked, appointment:statusUpdated, appointment:updated, consultation:started, consultation:ended, appointment:deleted

ProtectedRoute.jsx
  └─ No API calls (routing only)

ToastHost.jsx
  └─ No API calls (event listener only)
```

### Utility Files

```
api.js
  └─ Core apiRequest() function + API base URL resolution
     Features: Retry logic, auth token injection, error handling, toast notifications
     Issue: Pings /api/health on ports 4000-5000 in dev (slow)

realtime.js
  └─ Socket.io singleton + connection management
     Features: Auto-connect on auth, fallback to polling transport
     Issue: No admin room joins

appointments.js
  └─ Utilities only (no API calls)

session.js
  └─ Session storage (localStorage) - no API calls
```

---

## 🚨 RISK MATRIX

### Likelihood vs Impact

```
┌─────────────────────────────────────────────────────────┐
│                   IMPACT                                │
│            Low        Medium       High                 │
├─────────────────────────────────────────────────────────┤
│           │           │            │                    │
│ High      │ #10       │ #11,#12,#14│ #6,#7,#8,#9       │
│           │           │            │                    │
│ Medium    │           │ #13,#15    │ #2                │
│           │           │            │                    │
│ Low       │           │            │ #1,#3,#4,#5       │
│           │           │            │                    │
└─────────────────────────────────────────────────────────┘

Issues 1-5: Already broken (Low likelihood because they're known)
Issues 6-9: Common patterns (High likelihood of causing issues)
Issues 10-15: Quality/performance (Medium likelihood)
```

---

## ✅ VALIDATION CHECKLIST

### Before Merging to Main
- [ ] All 5 critical issues fixed or accepted as known limitation
- [ ] EHR endpoints verified (exist or UI removed)
- [ ] Promise.allSettled used in admin polling
- [ ] Request cancellation added to all polling
- [ ] SignUpPage uses apiRequest()
- [ ] All API endpoints return expected response format
- [ ] Socket room joins configured correctly
- [ ] No suppressToast on user-facing operations
- [ ] Error messages show to users
- [ ] Polling doesn't exceed backend rate limits

### Before Going to Production
- [ ] All APIs tested with realistic network conditions
- [ ] Timeout scenarios tested (slow network)
- [ ] Double-booking prevented (409 handling)
- [ ] Load tested with concurrent users
- [ ] Admin dashboard doesn't hang on failed EHR call
- [ ] Polling cleanup verified (no memory leaks)
- [ ] Socket reconnection tested
- [ ] Rate limiting configured on backend

---

## 📈 MIGRATION PATH

### Phase 1: Fix Critical Issues (Week 1)
```
Priority 1: /reports/patients/{id}/progress endpoint
Priority 2: Remove suppressToast from diet operations
Priority 3: Promise.allSettled in admin
Priority 4: SignUpPage apiRequest fix
Estimated: 7-9 hours
```

### Phase 2: Fix High Priority (Week 2)
```
Priority 1: Request cancellation for polling
Priority 2: Verify/implement EHR endpoints
Priority 3: Standardize PUT vs PATCH
Estimated: 8-10 hours
```

### Phase 3: Optimize (Week 3-4)
```
Priority 1: Add admin socket setup
Priority 2: Reduce polling intervals
Priority 3: Add error logging
Priority 4: Implement request deduplication
Estimated: 10-12 hours
```

---

## 🔍 HOW TO USE THESE DOCUMENTS

### For Frontend Developers
1. Start with **API_ISSUES_CRITICAL.md** - Know what's broken
2. Check **FRONTEND_API_INVENTORY.md** - Understand your specific feature's API calls
3. Use **FRONTEND_API_TESTING_GUIDE.md** - Test your changes

### For Backend Developers
1. Read **FRONTEND_API_INVENTORY.md** - See what endpoints are called
2. Check **Endpoint Availability Summary** section - Verify your endpoints exist
3. Use **FRONTEND_API_TESTING_GUIDE.md** - Validate response formats

### For QA/Testers
1. Use **FRONTEND_API_TESTING_GUIDE.md** - Test script section
2. Reference **API_ISSUES_CRITICAL.md** - Know what should be fixed
3. Use **FRONTEND_API_INVENTORY.md** - Cross-reference features to endpoints

### For DevOps/Infrastructure
1. Check polling intervals in **FRONTEND_API_LANDSCAPE.md** - Plan rate limiting
2. Monitor endpoints in **Endpoint Availability Summary** - All possible API calls
3. Check **Socket.io Events** - Ensure WebSocket support

---

## 📞 QUICK REFERENCE LINKS

- **Critical Issues:** [API_ISSUES_CRITICAL.md](API_ISSUES_CRITICAL.md)
- **Complete Inventory:** [FRONTEND_API_INVENTORY.md](FRONTEND_API_INVENTORY.md)
- **Testing Guide:** [FRONTEND_API_TESTING_GUIDE.md](FRONTEND_API_TESTING_GUIDE.md)
- **Backend Port:** localhost:4002
- **Frontend Port:** localhost:5173
- **Frontend Source:** `./ayurit-client/src/`

---

## 📊 STATISTICS

| Metric | Count |
|--------|-------|
| Total API Endpoints | 35+ |
| Confirmed Working | 28 |
| Likely Broken | 5 |
| Uncertain | 4 |
| Socket.io Events | 14 |
| Polling Intervals | 4 |
| Pages Making Calls | 6 |
| Components Making Calls | 3 |
| Files with API Calls | 15 |
| Critical Issues | 5 |
| High Priority Issues | 4 |
| Medium Priority Issues | 6 |
| Estimated Fix Time | 25-32 hours |

---

**Generated:** May 15, 2026  
**Last Updated:** May 15, 2026  
**Status:** ✅ Ready for Review

*For questions or updates, refer to the detailed documents listed above.*
