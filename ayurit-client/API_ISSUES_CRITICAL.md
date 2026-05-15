# CRITICAL: API Patterns That Need Fixing

**Priority:** 🔴 URGENT  
**Last Updated:** May 15, 2026  
**Total Issues:** 5 Critical, 4 High, 6 Medium

---

## 🔴 CRITICAL ISSUES (Fix Before Production)

### 1. Missing Progress Report API Endpoint
**Severity:** CRITICAL  
**Impact:** Patients can't see their progress  
**Files:** PatientDashboard.jsx (line ~458)

```javascript
// CURRENT (BROKEN)
const report = await apiRequest(
  `/reports/patients/${user.id}/progress`, 
  { suppressToast: true }
);
// ↑ This endpoint doesn't exist in backend
// ↑ Error is hidden with suppressToast
// Result: Progress loads forever, patient sees nothing
```

**Action Required:**
- [ ] Implement backend endpoint `/api/reports/patients/{patientId}/progress`
- [ ] Remove suppressToast OR add error UI feedback
- [ ] Return progress summary with adherence, improvements

---

### 2. Clinical Diet Chart Endpoint Removed
**Severity:** CRITICAL  
**Impact:** Diet chart feature unavailable  
**Files:** PatientDashboard.jsx (line ~455)

```javascript
// CURRENT (BROKEN)
const chartRes = await apiRequest(
  `/clinical/diet-charts/${user.id}`, 
  { suppressToast: true }
);
// ↑ Backend removed this endpoint
// ↑ Error silenced with suppressToast
// Result: Diet chart feature doesn't work
```

**Decision Needed:**
- [ ] **Option A:** Re-implement backend endpoint
- [ ] **Option B:** Remove diet chart feature from UI

**If Option A:** Create response like:
```javascript
{
  userId: "...",
  dailyMeals: {
    morning: ["Moong Dal", "Ghee"],
    afternoon: ["Rice", "Vegetables"],
    evening: ["Soup", "Bread"]
  },
  createdAt: "2026-05-15T08:00:00Z"
}
```

---

### 3. Diet Plan Approval Silently Fails
**Severity:** CRITICAL  
**Impact:** Doctor approves diet but it doesn't save  
**Files:** DoctorDashboard.jsx (lines ~360-375)

```javascript
// CURRENT (BROKEN)
try {
  await apiRequest(`/ai/diet-plans/${id}/approve`, { 
    method: "PUT", 
    suppressToast: true  // ← ERROR HIDDEN!
  });
  emitToast('success', 'Diet approved');  // ← Lies to doctor
  await refreshDietPlans();
} catch (err) {
  // Error caught but silenced
  emitToast('error', err?.data?.message || 'Unable to approve');
}
```

**The Problem:**
- Doctor sees "Diet approved" success message
- But the approval actually failed (API returned error)
- Doctor thinks it's saved but it's not

**Fix:**
```javascript
// FIXED
try {
  await apiRequest(`/ai/diet-plans/${id}/approve`, { method: "PUT" });
  emitToast('success', 'Diet plan approved');
  await refreshDietPlans();
} catch (err) {
  emitToast('error', err?.data?.message || 'Failed to approve');
}
// ↑ Remove suppressToast
// ↑ Let natural error handling work
```

**Same issue on line ~370 for reject**

---

### 4. Admin Data Polling Can Block on EHR Error
**Severity:** CRITICAL  
**Impact:** Admin dashboard fails to load if EHR endpoint missing  
**Files:** SuperAdminDashboard.jsx (line ~250-256)

```javascript
// CURRENT (BROKEN)
const [usersResponse, auditsResponse, ..., ehrResponse] = await Promise.all([
  apiRequest('/users?page=1&limit=500'),
  apiRequest('/audits?page=1&limit=200'),
  apiRequest('/patients'),
  apiRequest('/clinic/settings'),
  apiRequest('/users/invites'),
  apiRequest('/health'),
  apiRequest('/integration/ehr/status')  // ← If this fails, everything fails
]);
```

**The Problem:**
- One failing request (`/integration/ehr/status`) breaks all others
- If EHR endpoint missing → admin can't load staff, audits, patients
- Cascading failure

**Fix:**
```javascript
// FIXED
const [
  usersResponse, 
  auditsResponse, 
  patientsResponse, 
  settingsResponse, 
  invitesResponse, 
  healthResponse, 
  ehrResponse
] = await Promise.allSettled([  // ← Use allSettled not all
  apiRequest('/users?page=1&limit=500'),
  apiRequest('/audits?page=1&limit=200'),
  apiRequest('/patients'),
  apiRequest('/clinic/settings'),
  apiRequest('/users/invites'),
  apiRequest('/health'),
  apiRequest('/integration/ehr/status')
]);

// Now extract values safely
const users = usersResponse?.status === 'fulfilled' ? usersResponse.value : [];
const ehrStatus = ehrResponse?.status === 'fulfilled' ? ehrResponse.value : null;
// ↑ Each failure is isolated
```

---

### 5. SignUp Uses fetch() Not apiRequest()
**Severity:** CRITICAL  
**Impact:** Registration has no retry, no error handling  
**Files:** SignUpPage.jsx (line ~350-380)

```javascript
// CURRENT (BROKEN)
const res = await fetch(`${apiBase}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const data = await res.json();
if (!res.ok) {
  throw new Error(data.message);
}
```

**Problems:**
- ❌ No automatic retry on network error
- ❌ No 401 handling (if session expires during signup)
- ❌ No toast notifications
- ❌ Inconsistent with rest of app

**Fix:**
```javascript
// FIXED
try {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  setCreatedUser(data.user);
  // ↑ Uses same retry/error logic as rest of app
} catch (err) {
  setApiError(err?.data?.message || 'Registration failed');
}
```

---

## 🟠 HIGH PRIORITY ISSUES (Fix Soon)

### 6. Polling Without Request Cancellation
**Severity:** HIGH  
**Impact:** Memory leaks, stale responses, double updates  
**Files:** DoctorDashboard.jsx, PatientDashboard.jsx, DoctorAppointmentQueue.jsx, SuperAdminDashboard.jsx

```javascript
// CURRENT (RISKY)
useEffect(() => {
  loadNotifications();
  const timer = window.setInterval(loadNotifications, 30000);
  return () => window.clearInterval(timer);
}, [currentUser?.id]);

// What if:
// 1. Component unmounts while API call is in flight?
// 2. API takes 35 seconds but interval is 30?
// → Requests pile up
// → Old responses overwrite new ones
// → Memory leak from pending promises
```

**Fix:**
```javascript
// FIXED
useEffect(() => {
  let active = true;
  let controller = null;

  const loadNotifications = async () => {
    try {
      controller = new AbortController();
      const items = await apiRequest('/notifications', { 
        signal: controller.signal 
      });
      if (active) setNotifications(items);  // Only update if still mounted
    } catch (err) {
      if (err.name !== 'AbortError' && active) {
        setError(err);
      }
    }
  };

  loadNotifications();
  const timer = setInterval(loadNotifications, 30000);

  return () => {
    active = false;           // Mark component as unmounted
    controller?.abort();      // Cancel in-flight request
    clearInterval(timer);     // Stop polling
  };
}, [currentUser?.id]);
```

**Affected Locations:**
- [DoctorDashboard.jsx](DoctorDashboard.jsx#L240-250)
- [PatientDashboard.jsx](PatientDashboard.jsx#L595-605)
- [DoctorAppointmentQueue.jsx](DoctorAppointmentQueue.jsx#L60-70)
- [SuperAdminDashboard.jsx](SuperAdminDashboard.jsx#L300-310)

---

### 7. EHR Endpoints Likely Don't Exist
**Severity:** HIGH  
**Impact:** Admin dashboard EHR section fails  
**Files:** SuperAdminDashboard.jsx

```javascript
// THESE LIKELY DON'T EXIST
apiRequest('/integration/ehr/status')           // Line ~256
apiRequest('/integration/ehr/settings', PUT)    // Line ~411
apiRequest('/integration/ehr/rotate-token')     // Line ~420
apiRequest('/integration/ehr/test-connection')  // Line ~425
```

**Check Backend:**
```bash
curl http://localhost:4002/api/integration/ehr/status
# If 404 → endpoints don't exist
```

**Action:**
- [ ] Verify backend has these endpoints
- [ ] If not: Hide EHR settings from admin UI
- [ ] If yes: Fix response format to match frontend expectations

---

### 8. Inconsistent PUT/PATCH for Notifications
**Severity:** HIGH  
**Impact:** Confusing API contract  
**Files:** PatientDashboard vs DoctorDashboard

**Problem:** Different files use different HTTP methods for same operation

```javascript
// PatientDashboard.jsx (line ~620)
await apiRequest(`/notifications/{id}/read`, { method: 'PUT' });

// DoctorDashboard.jsx (line ~260)  
await apiRequest(`/notifications/{id}/read`, { method: 'PATCH' });
```

**Backend must support BOTH or frontend must be standardized**

**Fix:**
Choose one and use consistently everywhere:
```javascript
// Use PATCH everywhere (REST best practice)
await apiRequest(`/notifications/{id}/read`, { method: 'PATCH' });
```

---

### 9. Socket Room Joins Incomplete
**Severity:** MEDIUM-HIGH  
**Impact:** Admin won't get real-time updates  
**Files:** SuperAdminDashboard.jsx

```javascript
// CURRENT (NO SOCKET SETUP)
// SuperAdminDashboard has NO socket.io code
// Result: Admin dashboard only polls
// Should join room for audit/user events
```

**Add to SuperAdminDashboard:**
```javascript
useEffect(() => {
  let socket = null;
  const init = async () => {
    socket = await getRealtimeSocket();
    socket.emit('join:role', 'admin');
    socket.on('user:created', handleUserUpdate);
    socket.on('user:updated', handleUserUpdate);
    socket.on('audit:logged', handleAuditUpdate);
  };
  init();
  return () => {
    socket?.off('user:created', handleUserUpdate);
    socket?.off('user:updated', handleUserUpdate);
    socket?.off('audit:logged', handleAuditUpdate);
  };
}, []);
```

---

## 🟡 MEDIUM PRIORITY ISSUES (Fix This Sprint)

### 10. Aggressive Polling (25 seconds)
**File:** PatientDashboard.jsx (line ~680)
```javascript
// Polls progress data every 25 seconds
const progressRefreshTimer = window.setInterval(refreshProgressData, 25000);
```
**Recommendation:** Change to 30-60 seconds

---

### 11. No Error Feedback on Silent Failures
**Files:** DoctorDashboard.jsx, PatientDashboard.jsx
```javascript
// Uses suppressToast on several endpoints
// Should at least log to console for debugging
```

---

### 12. Promise.allSettled Already Used But Incomplete
**File:** PatientDashboard.jsx (line ~450)
```javascript
// Good: Uses allSettled for graceful degradation
// Bad: Some endpoints still fail silently
```

---

### 13. Double Polling of Notifications
**Files:** Notifications loaded both via:
- Polling (30 second interval)
- Socket events (appointment:booked, etc.)

**Can cause duplicate requests - implement deduplication**

---

### 14. Admin Staff View Performance
**File:** SuperAdminDashboard.jsx
```javascript
// Fetches 500 users and 200 audits on every 30-second poll
// Consider pagination or incremental loading
```

---

### 15. Unvalidated JSON Response Parsing
**File:** SignUpPage.jsx
```javascript
// Uses fetch then JSON parsing separately
// If JSON is invalid, app crashes with no recovery
```

---

## SUMMARY TABLE

| # | Issue | File | Line | Severity | Status |
|---|-------|------|------|----------|--------|
| 1 | Missing /reports/patients/{id}/progress | PatientDashboard | ~458 | 🔴 CRITICAL | ❌ NOT FIXED |
| 2 | Removed /clinical/diet-charts/{id} | PatientDashboard | ~455 | 🔴 CRITICAL | ❌ NOT FIXED |
| 3 | Silent diet approval failures | DoctorDashboard | ~360 | 🔴 CRITICAL | ❌ NOT FIXED |
| 4 | Promise.all blocks on EHR error | SuperAdminDashboard | ~250 | 🔴 CRITICAL | ❌ NOT FIXED |
| 5 | SignUp uses fetch not apiRequest | SignUpPage | ~350 | 🔴 CRITICAL | ❌ NOT FIXED |
| 6 | Polling without cancellation | Multiple | Various | 🟠 HIGH | ❌ NOT FIXED |
| 7 | EHR endpoints missing | SuperAdminDashboard | ~256 | 🟠 HIGH | ⚠️ UNVERIFIED |
| 8 | Inconsistent PUT vs PATCH | PatientDashboard/DoctorDashboard | ~620/260 | 🟠 HIGH | ❌ NOT FIXED |
| 9 | Admin socket setup missing | SuperAdminDashboard | - | 🟠 HIGH | ❌ NOT FIXED |
| 10 | Aggressive 25s polling | PatientDashboard | ~680 | 🟡 MEDIUM | ⚠️ REVIEW |
| 11 | No error logging for silent failures | Multiple | Multiple | 🟡 MEDIUM | ❌ NOT FIXED |
| 12 | Double notifications polling | DoctorDashboard/PatientDashboard | Multiple | 🟡 MEDIUM | ❌ NOT FIXED |

---

## IMPLEMENTATION ORDER

### Week 1 (Critical Fixes)
1. **Implement `/reports/patients/{id}/progress` backend OR remove from frontend**
2. **Remove suppressToast from diet plan approve/reject**
3. **Change Promise.all to Promise.allSettled in admin**
4. **Fix SignUpPage to use apiRequest**

### Week 2 (High Priority)
5. **Add request cancellation to polling**
6. **Verify/implement EHR endpoints**
7. **Standardize on PATCH for notifications**

### Week 3 (Medium Priority)
8. **Add admin socket setup**
9. **Reduce polling intervals**
10. **Add error logging**

---

## TEST BEFORE DEPLOYING

```bash
# Test critical endpoints
curl http://localhost:4002/api/reports/patients/test/progress
curl http://localhost:4002/api/clinical/diet-charts/test
curl http://localhost:4002/api/integration/ehr/status

# Test in browser
# 1. Login as doctor
# 2. Approve a diet plan → should see success/error
# 3. Reject a diet plan → should see success/error
# 4. As admin: Load dashboard → should not hang
# 5. Check console → no AbortError spam
```

---

**Status:** Generated May 15, 2026  
**Severity Summary:** 5 Critical, 4 High, 6 Medium  
**Total Debt:** ~40 hours of work
