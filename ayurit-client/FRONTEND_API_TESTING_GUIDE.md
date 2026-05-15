# Frontend API - Detailed Testing & Implementation Guide

**Status:** Generated May 15, 2026  
**Related Files:**
- [FRONTEND_API_INVENTORY.md](FRONTEND_API_INVENTORY.md) - Complete API inventory
- Backend running on: `localhost:4002`

---

## QUICK REFERENCE: APIS TO VERIFY

### Must Verify (Used heavily by frontend)

#### 1. AI Diet Plan Endpoints
```
GET /api/ai/diet-plans
GET /api/ai/diet-plans?patientId={id}
PUT /api/ai/diet-plans/{id}/approve
PUT /api/ai/diet-plans/{id}/reject
```
**Used in:** DoctorDashboard, PatientDashboard  
**Current Frontend Behavior:** Calls with `suppressToast: true` (errors hidden)  
**Risk Level:** 🔴 HIGH - Doctor can't see if approval fails

**Test Script:**
```bash
# Get all diet plans
curl http://localhost:4002/api/ai/diet-plans

# Get diet plans for patient (replace {id})
curl http://localhost:4002/api/ai/diet-plans?patientId=user123

# Approve diet plan
curl -X PUT http://localhost:4002/api/ai/diet-plans/plan456/approve \
  -H "Authorization: Bearer {token}"

# Reject diet plan
curl -X PUT http://localhost:4002/api/ai/diet-plans/plan456/reject \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Not suitable for patient"}'
```

**Expected Response Formats:**
- GET: `{ items: [...], total: N }` or `[...]`
- PUT: `{ id, status: "approved"|"rejected", ... }`

---

#### 2. Reports Endpoint (BROKEN - Must Implement)
```
GET /api/reports/patients/{patientId}/progress
```
**Used in:** PatientDashboard, line ~458  
**Current Frontend Behavior:** Call with suppressToast (fails silently)  
**Risk Level:** 🔴 CRITICAL - User progress never shows

**What Frontend Expects:**
```javascript
{
  patientId: "...",
  month: "May",
  metricsImproved: 3,
  adherence: 85,
  recommendations: ["Increase water intake", ...],
  generatedAt: "2026-05-15T10:30:00Z"
}
```

**To Implement:**
1. Create endpoint in backend
2. Calculate metrics from charts
3. Return progress summary
4. Remove suppressToast from frontend call

---

#### 3. Clinical Diet Charts Endpoint (REMOVED - Decide: Keep or Remove)
```
GET /api/clinical/diet-charts/{userId}
```
**Used in:** PatientDashboard, line ~455  
**Current Frontend Behavior:** Call with suppressToast (fails silently)  
**Risk Level:** 🟡 MEDIUM - Diet chart feature unavailable but app works

**Decision Needed:**
- **Option A:** Re-implement backend endpoint
- **Option B:** Remove from frontend completely

**If Implementing:**
```javascript
{
  userId: "...",
  patientName: "...",
  dailyMeals: {
    morning: ["Moong Dal", "Ghee", ...],
    afternoon: ["Rice", "Vegetables", ...],
    evening: ["Soup", "Bread", ...]
  },
  createdAt: "2026-05-15T08:00:00Z"
}
```

---

### May Not Exist (EHR Integration)
```
GET /api/integration/ehr/status
PUT /api/integration/ehr/settings
POST /api/integration/ehr/rotate-token
POST /api/integration/ehr/test-connection
```
**Used in:** SuperAdminDashboard only  
**Risk Level:** 🟡 MEDIUM - Admin dashboard shows errors but app works

**To Verify:**
```bash
curl http://localhost:4002/api/integration/ehr/status
# If 404 error, endpoint doesn't exist
```

**Decision Needed:**
1. **If not implemented:** Hide EHR section in admin UI
2. **If planned:** Implement backend endpoints

---

## POLLING ANALYSIS & RECOMMENDATIONS

### Current Polling Setup

#### Pattern 1: 30-second Notifications Poll
```javascript
// DoctorDashboard.jsx, PatientDashboard.jsx
const loadNotifications = async () => { /* ... */ };
useEffect(() => {
  loadNotifications();
  const timer = window.setInterval(loadNotifications, 30000);
  return () => window.clearInterval(timer);
}, [currentUser?.id]);
```

**Issues:**
- ⚠️ No request cancellation if unmount happens during fetch
- ⚠️ If API takes >30s, requests stack up
- ⚠️ Socket events `appointment:booked`, etc. could trigger same load

**Better Implementation:**
```javascript
useEffect(() => {
  let active = true;
  let controller = null;

  const loadNotifications = async () => {
    try {
      controller = new AbortController();
      const items = await apiRequest('/notifications', { 
        signal: controller.signal 
      });
      if (active) setNotifications(items);
    } catch (err) {
      if (err.name !== 'AbortError' && active) {
        setNotificationsError(err?.message);
      }
    }
  };

  loadNotifications();
  const timer = setInterval(loadNotifications, 30000);

  return () => {
    active = false;
    controller?.abort();
    clearInterval(timer);
  };
}, [currentUser?.id]);
```

---

#### Pattern 2: 25-second Progress Poll
```javascript
// PatientDashboard.jsx
const progressRefreshTimer = window.setInterval(() => {
  refreshProgressData();
}, 25000);
```

**Recommendation:**
- Move to 30-60 second interval (25s is aggressive)
- Add request de-duplication
- Cancel previous request if new one starts

---

#### Pattern 3: 30-second Admin Data Poll
```javascript
// SuperAdminDashboard.jsx
const loadAdminData = async () => {
  await Promise.all([
    apiRequest('/users?page=1&limit=500'),
    apiRequest('/audits?page=1&limit=200'),
    apiRequest('/patients'),
    apiRequest('/clinic/settings'),
    apiRequest('/users/invites'),
    apiRequest('/health'),
    apiRequest('/integration/ehr/status')
  ]);
};

refreshTimerRef.current = window.setInterval(loadAdminData, 30000);
```

**Critical Issue:** 
- 🔴 `GET /integration/ehr/status` may fail and block all other requests
- Fix: Use Promise.allSettled instead of Promise.all

**Better Implementation:**
```javascript
const [usersResponse, auditsResponse, ...] = await Promise.allSettled([
  apiRequest('/users?page=1&limit=500'),
  apiRequest('/audits?page=1&limit=200'),
  // ...
]);
```

---

## SOCKET EVENT ANALYSIS

### Missing Room Joins
**Issue:** AdminDashboard doesn't join any socket rooms
```javascript
// No socket setup in SuperAdminDashboard
// Admin won't get real-time user/audit updates
```

**Recommendation:**
```javascript
// Add to SuperAdminDashboard
socket.emit('join:role', 'admin');
socket.on('user:updated', handleUserUpdate);
socket.on('audit:logged', handleAuditLog);
```

---

### Potential Race Conditions

#### Scenario 1: Slot Creation Race
```javascript
// User creates slot while DoctorSlotManager is refreshing
socket.on('slot:created', () => refreshSlots(date));
// Meanwhile user just created a slot
// Gets refreshed twice - could lose UI state
```

**Solution:** Use request deduplication
```javascript
let pendingRefresh = null;
const refreshSlots = async (date) => {
  if (pendingRefresh) return pendingRefresh;
  pendingRefresh = apiRequest(...)
    .finally(() => { pendingRefresh = null; });
  return pendingRefresh;
};
```

---

## CRITICAL API ISSUES

### Issue 1: Sign Up Uses fetch() Instead of apiRequest()
**File:** SignUpPage.jsx, line ~350

**Current Code:**
```javascript
const res = await fetch(`${apiBase}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

**Problems:**
- ❌ No automatic retry on network errors
- ❌ No 401 session handling
- ❌ No toast notifications
- ❌ No access token sent (if needed)

**Fix:**
```javascript
const data = await apiRequest('/auth/register', {
  method: 'POST',
  body: JSON.stringify(payload)
});
```

---

### Issue 2: Silent Failures on Diet Plans
**Files:** DoctorDashboard.jsx (~360-375), PatientDashboard.jsx (~540)

**Current Pattern:**
```javascript
// Doctor approves diet - if fails, no error shown
await apiRequest(`/ai/diet-plans/${id}/approve`, { 
  method: "PUT", 
  suppressToast: true 
});
```

**Problem:** Doctor thinks approval succeeded but it failed

**Fix - Remove suppressToast:**
```javascript
try {
  await apiRequest(`/ai/diet-plans/${id}/approve`, { method: "PUT" });
  emitToast('success', 'Diet plan approved');
  refreshDietPlans();
} catch (err) {
  emitToast('error', err?.data?.message || 'Failed to approve');
}
```

---

### Issue 3: Suppressed Reports Load
**File:** PatientDashboard.jsx, line ~458

**Current Code:**
```javascript
const report = await apiRequest(
  `/reports/patients/${user.id}/progress`, 
  { suppressToast: true }
);
```

**Problem:** 
- User never knows their progress report failed to load
- No UI feedback - looks like loading forever

**Solution:**
1. Remove suppressToast OR
2. Show error in UI but don't block other loads

```javascript
try {
  const reportRes = await Promise.allSettled([
    apiRequest(`/reports/patients/${user.id}/progress`)
  ]);
  if (reportRes[0].status === 'fulfilled') {
    setProgressReport(reportRes[0].value);
  } else {
    logger.warn('Progress report failed to load', reportRes[0].reason);
  }
} catch (err) {
  // OK to fail silently here since graceful degradation
}
```

---

## ENDPOINT RESPONSE VALIDATION

### Expected Formats (For Backend Implementation)

#### Appointments
```javascript
// GET /appointments/doctor/queue
[
  {
    id: "appt_123",
    patientId: "pat_456",
    patientName: "John Doe",
    doctorId: "doc_789",
    startAt: "2026-05-15T10:00:00Z",
    endAt: "2026-05-15T10:30:00Z",
    status: "booked|in-progress|completed|cancelled",
    reason: "Knee pain",
    durationMinutes: 30
  }
]

// PATCH /appointments/{id}/status
{
  id: "appt_123",
  status: "in-progress",
  updatedAt: "2026-05-15T10:00:30Z"
}
```

#### Notifications
```javascript
// GET /notifications
[
  {
    id: "notif_123",
    userId: "user_456",
    type: "appointment|diet_plan|progress",
    message: "...",
    isRead: false,
    createdAt: "2026-05-15T10:00:00Z",
    readAt: null
  }
]
```

#### Diet Plans
```javascript
// GET /ai/diet-plans
[
  {
    id: "plan_123",
    patientId: "pat_456",
    version: 1,
    status: "pending|approved|rejected",
    generatedDiet: {
      Monday: { Breakfast: "...", Lunch: "...", Dinner: "..." },
      // ... other days
    },
    recommendations: ["...", "..."],
    createdAt: "2026-05-15T08:00:00Z"
  }
]
```

---

## TESTING CHECKLIST

### Must Test Before Going to Production

- [ ] **Login/Signup Flow**
  - [ ] POST /auth/token - successful login
  - [ ] POST /auth/token - invalid credentials
  - [ ] POST /auth/register - successful signup
  - [ ] POST /auth/register - duplicate email

- [ ] **Appointments**
  - [ ] GET /appointments/patient/available - empty results
  - [ ] GET /appointments/patient/available - multiple slots
  - [ ] POST /appointments/patient/book - success
  - [ ] POST /appointments/patient/book - double booking (409 error)
  - [ ] PATCH /appointments/{id}/status - all status transitions

- [ ] **Notifications**
  - [ ] GET /notifications - multiple unread
  - [ ] PATCH /notifications/{id}/read - single mark read
  - [ ] PATCH /notifications/read-all - mark all

- [ ] **Diet Plans** 
  - [ ] GET /ai/diet-plans - check response format
  - [ ] PUT /ai/diet-plans/{id}/approve - verify update
  - [ ] PUT /ai/diet-plans/{id}/reject - with reason

- [ ] **Reports**
  - [ ] GET /reports/patients/{id}/progress - endpoint exists
  - [ ] Response format matches frontend expectations
  - [ ] Handles missing patient gracefully

- [ ] **EHR Integration**
  - [ ] GET /integration/ehr/status - endpoint exists
  - [ ] PUT /integration/ehr/settings - endpoint exists
  - [ ] POST /integration/ehr/rotate-token - endpoint exists

- [ ] **Socket Events**
  - [ ] appointment:booked - queue refreshes
  - [ ] appointment:statusUpdated - status updates
  - [ ] slot:created - slots refresh
  - [ ] chart:created - daily log updates

---

## DEBUGGING TIPS

### Check Network Calls in Browser
```javascript
// Open DevTools Console
// Log all API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('FETCH:', args[0], args[1]);
  return originalFetch.apply(this, args);
};
```

### Monitor Socket Events
```javascript
const socket = await getRealtimeSocket();
const originalOn = socket.on;
socket.on = function(event, ...args) {
  console.log('SOCKET EVENT:', event);
  return originalOn.apply(this, [event, ...args]);
};
```

### Find Suppressed Toast Calls
```bash
# In project root
grep -r "suppressToast: true" src/
# Shows all silent failure points
```

### Check Polling Intervals
```bash
grep -r "setInterval" src/
# Shows all polling locations
```

---

## QUICK FIXES

### Fix 1: Remove Silent Failures
```bash
# Remove all suppressToast except where intentional
find src/ -name "*.jsx" -exec sed -i 's/, suppressToast: true//' {} \;
```

### Fix 2: Add Cancellation to Polls
```javascript
// In each useEffect with setInterval:
let controller;
const load = async () => {
  controller = new AbortController();
  try {
    await apiRequest('/endpoint', { signal: controller.signal });
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  }
};

return () => {
  controller?.abort();
  clearInterval(timer);
};
```

### Fix 3: Use Promise.allSettled in Admin
```javascript
// SuperAdminDashboard.jsx
const results = await Promise.allSettled([
  apiRequest('/users?page=1&limit=500'),
  apiRequest('/audits?page=1&limit=200'),
  apiRequest('/patients'),
  apiRequest('/clinic/settings'),
  apiRequest('/users/invites'),
  apiRequest('/health'),
  apiRequest('/integration/ehr/status')
]);

results.forEach(result => {
  if (result.status === 'rejected') {
    console.warn('Admin API failed:', result.reason);
  }
});
```

---

**End of Implementation Guide**
