# Codebase Cleanup Findings - Comprehensive Analysis

## Executive Summary
This document contains comprehensive findings of references to removed modules ("consultation", "dietitian", "clinic_staff" roles), socket listeners, API endpoints, environment variables, console.logs, setTimeout/setInterval calls, and unused imports across the entire codebase.

---

## 1. REFERENCES TO REMOVED MODULES - BY FILE

### 1.1 Dietitian Role References

**Backend Files:**
- [backend/src/services/platformService.js](backend/src/services/platformService.js#L36-L39)
  - Lines 36-39: Test user creation with ROLES.DIETITIAN
  - `role: ROLES.DIETITIAN` and `email: "dietitian@ayurit.com"`
  
- [backend/src/controllers/userController.js](backend/src/controllers/userController.js#L54)
  - Line 54: Filter for practitioners includes `user.role === "dietitian"`

- [backend/src/constants/roles.js](backend/src/constants/roles.js)
  - Likely defines ROLES.DIETITIAN constant

- [backend/src/routes/userRoutes.js](backend/src/routes/userRoutes.js#L17)
  - Line 17: `permit("superadmin", "doctor", "dietitian", "clinic_staff")`

- [backend/src/routes/prescriptionRoutes.js](backend/src/routes/prescriptionRoutes.js#L11,L18)
  - Line 11: `permit("superadmin", "doctor", "dietitian", "clinic_staff", "patient")`
  - Line 18: `permit("superadmin", "doctor", "dietitian", "clinic_staff")`

- [backend/src/routes/reportRoutes.js](backend/src/routes/reportRoutes.js#L11)
  - Line 11: `permit("superadmin", "doctor", "dietitian", "clinic_staff", "patient")`

### 1.2 Clinic_staff Role References

**Backend Files:**
- [backend/src/routes/userRoutes.js](backend/src/routes/userRoutes.js#L17)
  - Line 17: `permit("superadmin", "doctor", "dietitian", "clinic_staff")`

- [backend/src/routes/prescriptionRoutes.js](backend/src/routes/prescriptionRoutes.js#L11,L18)
  - Lines 11, 18: References in permit() calls

- [backend/src/routes/reportRoutes.js](backend/src/routes/reportRoutes.js#L11)
  - Line 11: `permit("superadmin", "doctor", "dietitian", "clinic_staff", "patient")`

- [backend/src/routes/providerRoutes.js](backend/src/routes/providerRoutes.js#L8-L9)
  - Line 8-9: `permit("superadmin", "doctor", "clinic_staff")`

- [backend/src/routes/patientRoutes.js](backend/src/routes/patientRoutes.js#L9)
  - Line 9: `permit("superadmin", "clinic_staff")`

- [backend/src/services/notificationService.js](backend/src/services/notificationService.js#L194)
  - Line 194: `recipientRole: recipientRole || "clinic_staff"`

- [backend/src/controllers/patientController.js](backend/src/controllers/patientController.js#L9)
  - Line 9: Role validation includes `"clinic_staff"`

### 1.3 Consultation Module References

**Backend Files:**
- [backend/src/models/consultation.js](backend/src/models/consultation.js)
  - Complete Mongoose model for consultations
  - Lines 3-32: Full schema definition
  - Indexes on appointmentId, patientId, doctorId

- [backend/src/routes/consultationRoutes.js](backend/src/routes/consultationRoutes.js)
  - Complete route definitions for consultation endpoints
  - Imports consultationController functions
  - Routes: GET/POST/PUT for consultations, notes, recommendations, prescriptions, followups

- [backend/src/services/dataService.js](backend/src/services/dataService.js#L4,L117,L777-L836)
  - Line 4: Import of ConsultationModel
  - Line 117: consultations: [] memory array
  - Lines 777-836: Consultation service methods
    - createConsultation()
    - listConsultations()
    - findConsultationById()
    - getConsultationByAppointmentId()

- [backend/src/controllers/consultationController.js](backend/src/controllers/consultationController.js)
  - Complete controller for consultation operations

- [backend/src/routes/index.js](backend/src/routes/index.js#L8)
  - Line 8: Import of clinicRoutes

- [backend/src/socket/index.js](backend/src/socket/index.js#L29,L34,L42)
  - Line 29: `socket.on("join:consultation", ...)`
  - Line 34: `socket.join(\`consultation:${safeAppointmentId}\`)`
  - Line 42: `io.to(\`consultation:${safeAppointmentId}\`).emit(...)`

**Frontend Files:**
- [ayurit-client/src/components/VideoConsultation.jsx](ayurit-client/src/components/VideoConsultation.jsx#L2)
  - Line 2: Import of VideoConsultation.css

- [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx#L15)
  - Line 15: Import VideoConsultation component

### 1.4 Diet/Clinical Module References

**Backend Files:**
- [backend/src/routes/clinicalRoutes.js](backend/src/routes/clinicalRoutes.js)
  - Complete route file for clinical/diet operations
  - Routes: /food-catalog, /diet-charts, /recipe-analyzer
  - Note: NOT imported in [backend/src/routes/index.js](backend/src/routes/index.js)

- [backend/src/models/dietPlan.js](backend/src/models/dietPlan.js)
  - Complete Mongoose model for diet plans
  - Indexes on patientId, createdAt

- [backend/src/services/dietPlanService.js](backend/src/services/dietPlanService.js)
  - Complete service with methods:
    - createDietPlan()
    - listDietPlans()
    - findDietPlanById()
    - updateDietPlan()

- [backend/src/services/platformService.js](backend/src/services/platformService.js#L36-L39,L48,L444-L454)
  - Lines 36-39: Dietitian test user creation
  - Line 48: dietCharts: {} memory storage
  - Lines 444-454: setDietChart() and getDietChart() methods

- [backend/src/validators/dietPlan.js](backend/src/validators/dietPlan.js)
  - Schema validators for diet plan operations

**Frontend Files:**
- [ayurit-client/src/pages/PatientDashboard.jsx](ayurit-client/src/pages/PatientDashboard.jsx#L430)
  - Line 430: `apiRequest(\`/clinical/diet-charts/${user.id}\`)`

- [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx#L484,L494)
  - Line 484: `downloadCsv('diet-chart.csv', rows)`
  - Line 494: `apiRequest('/clinical/diet-charts', ...)`

### 1.5 Clinic Settings References

**Backend Files:**
- [backend/src/models/clinicSetting.js](backend/src/models/clinicSetting.js)
  - Mongoose model for clinic settings

- [backend/src/services/platformService.js](backend/src/services/platformService.js#L460,L462,L492)
  - Lines 460-492: Clinic settings operations

- [backend/src/controllers/integrationController.js](backend/src/controllers/integrationController.js#L5)
  - Line 5: Import ClinicSettingModel

- [backend/src/routes/clinicRoutes.js](backend/src/routes/clinicRoutes.js)
  - Routes for clinic settings management

**Frontend Files:**
- [ayurit-client/src/pages/SuperAdminDashboard.jsx](ayurit-client/src/pages/SuperAdminDashboard.jsx#L225,L436)
  - Line 225: `apiRequest('/clinic/settings')`
  - Line 436: Update clinic settings

---

## 2. SOCKET LISTENERS - CONSULTATION RELATED

**Backend:**
- [backend/src/socket/index.js](backend/src/socket/index.js#L29)
  - Line 29: `socket.on("join:consultation", ({ appointmentId, roomId, userId, role }) => { ... })`
    - Joins room: `consultation:${safeAppointmentId}`
    - Emits: `participant:joined`

**Frontend:**
- [ayurit-client/src/components/DoctorAppointmentQueue.jsx](ayurit-client/src/components/DoctorAppointmentQueue.jsx#L96-L97)
  - Line 96: `socket.on('consultation:started', refreshQueue)`
  - Line 97: `socket.on('consultation:ended', refreshQueue)`

- [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx#L325-L329,L341-L342)
  - Lines 325-329: Socket listeners registered:
    - `socket.on('appointment:booked', handleConsultationEvent)`
    - `socket.on('appointment:statusUpdated', handleConsultationEvent)`
    - `socket.on('consultation:started', handleConsultationEvent)`
    - `socket.on('consultation:ended', handleConsultationEvent)`
    - `socket.on('participant:joined', handleConsultationEvent)`
  - Lines 341-342: Listeners removed on cleanup

---

## 3. API ENDPOINTS FOR CONSULTATIONS

**Active Endpoints (tested in video_smoke_test.js):**

- `POST /api/appointments/:appointmentId/consultation/start`
  - Starts consultation, returns roomId and consultationId
  - Tests: [backend/video_smoke_test.js](backend/video_smoke_test.js#L86,L94,L103)

- `GET /api/appointments/:appointmentId/consultation/start`
  - Patient joins consultation (GET used for joins)
  - Tests: [backend/video_smoke_test.js](backend/video_smoke_test.js#L110,L118,L126)

- `GET /api/appointments/:appointmentId/consultation`
  - Get consultation details
  - Tests: [backend/video_smoke_test.js](backend/video_smoke_test.js#L132,L139,L148)

- `POST /api/appointments/:appointmentId/consultation/end`
  - Doctor ends consultation with notes/prescriptions/followups
  - Tests: [backend/video_smoke_test.js](backend/video_smoke_test.js#L187,L212,L220)

- `GET /api/consultations?patientId={patientId}`
  - Retrieve consultation history
  - Tests: [backend/video_smoke_test.js](backend/video_smoke_test.js#L242,L251)

**Clinical/Diet Endpoints (NOT currently mounted in routes/index.js):**

- `GET /clinical/food-catalog`
  - Defined in [backend/src/routes/clinicalRoutes.js](backend/src/routes/clinicalRoutes.js#L15)
  - Called from: [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx)

- `GET /clinical/diet-charts/:patientId`
  - Defined in [backend/src/routes/clinicalRoutes.js](backend/src/routes/clinicalRoutes.js#L20)
  - Called from: [ayurit-client/src/pages/PatientDashboard.jsx#L430](ayurit-client/src/pages/PatientDashboard.jsx#L430)
  - Called from: [ayurit-client/src/pages/DoctorDashboard.jsx#L494](ayurit-client/src/pages/DoctorDashboard.jsx#L494)

- `POST /clinical/diet-charts`
  - Defined in [backend/src/routes/clinicalRoutes.js](backend/src/routes/clinicalRoutes.js#L26)

- `POST /clinical/recipe-analyzer`
  - Defined in [backend/src/routes/clinicalRoutes.js](backend/src/routes/clinicalRoutes.js#L32)

**Clinic Settings Endpoints:**

- `GET /clinic/settings`
  - Called from: [ayurit-client/src/pages/SuperAdminDashboard.jsx#L225](ayurit-client/src/pages/SuperAdminDashboard.jsx#L225)

- `PUT /clinic/settings`
  - Called from: [ayurit-client/src/pages/SuperAdminDashboard.jsx#L436](ayurit-client/src/pages/SuperAdminDashboard.jsx#L436)

- `POST /clinic/custom-foods`
  - Defined in [backend/src/routes/clinicRoutes.js](backend/src/routes/clinicRoutes.js#L20)

---

## 4. REDUX/CONTEXT CODE FOR REMOVED MODULES

**Finding: No Redux store or Context API implementation found**

- No `/src/store` directory exists
- No `/src/hooks` directory exists
- All state management is done via React hooks (useState, useRef)
- No Redux-like patterns detected

**State management for removed features uses useState:**
- [ayurit-client/src/pages/SuperAdminDashboard.jsx](ayurit-client/src/pages/SuperAdminDashboard.jsx#L165-L190)
  - Staff state management (useState)
  - Clinic state management

- [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx)
  - Consultation-related state via useState

- [ayurit-client/src/pages/PatientDashboard.jsx](ayurit-client/src/pages/PatientDashboard.jsx)
  - Diet/clinical data state via useState

---

## 5. ENVIRONMENT VARIABLES FOR REMOVED MODULES

**No specific environment variables for removed modules found**

General environment variables used:
- [backend/src/config/env.js](backend/src/config/env.js#L21-L31)
  - PORT
  - NODE_ENV
  - DB_PROVIDER (mongodb, postgres, memory)
  - MONGODB_URI
  - POSTGRES_URI
  - API_KEY (for Gemini)
  - INTEGRATION_API_KEY
  - CLOUD_PROVIDER
  - ALLOWED_ORIGIN

- [ayurit-client/src/utils/api.js](ayurit-client/src/utils/api.js#L8,L58-L59)
  - VITE_API_URL

- [ayurit-client/src/utils/realtime.js](ayurit-client/src/utils/realtime.js#L8-L9)
  - VITE_SOCKET_URL

**Note:** No dietitian, clinic_staff, or consultation-specific environment variables found.

---

## 6. CONSOLE.LOG STATEMENTS - COMPREHENSIVE LIST

**Backend - Test Files:**
- [backend/comprehensive_smoke_test.js](backend/comprehensive_smoke_test.js) - ~60 console.log statements
  - Lines 6-166: Test logging for all test cases
  
- [backend/smoke_test.js](backend/smoke_test.js) - ~8 console.log statements
  - Lines 6-62: Basic test logging

- [backend/video_smoke_test.js](backend/video_smoke_test.js) - ~75 console.log statements
  - Lines 6-300: Comprehensive video consultation testing logs

**Backend - Production Code:**
- [backend/src/config/db.js](backend/src/config/db.js)
  - Line 15: `console.log("[db] Attempting to connect to MongoDB...")`
  - Line 16: `console.log("[db] URI (masked):", ...)`
  - Line 24: `console.log("[db] ✓ Successfully connected to MongoDB")`
  - Line 25: `console.log("[db] Database:", ...)`
  - Line 33: `console.log("[db] Attempting to connect to PostgreSQL...")`
  - Line 72: `console.log("[db] ✓ Successfully connected to PostgreSQL")`
  - Line 77: `console.log("[db] Using in-memory provider (development mode)")`
  - Line 88: `console.error("[db]   Configured provider:", ...)`
  - Line 90: `console.error("[db] → To fix, ...")`

- [backend/src/seeds/init-seed.js](backend/src/seeds/init-seed.js) - ~30 console.log statements
  - Lines 23-208: Seed data initialization logging

- [backend/src/server.js](backend/src/server.js)
  - Line 35: `console.log(\`Ayurit backend running on port ${listenPort}\`)`

- [backend/src/services/dataService.js](backend/src/services/dataService.js)
  - Lines 165-216: ~15 console.log statements for data operations

- [backend/src/controllers/authController.js](backend/src/controllers/authController.js)
  - Lines 162-251: ~10 console.log statements for auth operations

**Note:** Most console.logs are for debugging/development. Production deployment notes indicate verbose logs should be removed.

---

## 7. SETTIMEOUT/SETINTERVAL FOR POLLING

**setInterval Calls (30-second polling):**

- [ayurit-client/src/components/DoctorAppointmentQueue.jsx](ayurit-client/src/components/DoctorAppointmentQueue.jsx#L15,L67)
  - Line 15: `const interval = setInterval(fetchAppointments, 30000);`
  - Line 67: Duplicate in alternate version

- [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx#L272,L280,L285)
  - Line 272: `const timer = window.setInterval(loadNotifications, 30000);`
  - Line 280: `const dietRefreshTimer = window.setInterval(() => { ... }, 30000);` (diet-related polling)
  - Line 285: `const appointmentRefreshTimer = window.setInterval(() => { ... }, 30000);`

- [ayurit-client/src/pages/PatientDashboard.jsx](ayurit-client/src/pages/PatientDashboard.jsx#L575,L583)
  - Line 575: `const timer = window.setInterval(loadNotifications, 30000);`
  - Line 583: `const progressRefreshTimer = window.setInterval(() => { ... }, 30000);` (diet/progress polling)

- [ayurit-client/src/pages/SuperAdminDashboard.jsx](ayurit-client/src/pages/SuperAdminDashboard.jsx#L300)
  - Line 300: `refreshTimerRef.current = window.setInterval(loadAdminData, 30000);`

- [ayurit-client/src/pages/LandingPage.jsx](ayurit-client/src/pages/LandingPage.jsx#L527,L532,L564-L565)
  - Line 527: `sceneCycleRef.current = setInterval(() => ..., 2500);` (carousel)
  - Line 532: `autoRef.current = setInterval(goNext, 8000);` (carousel)
  - Line 564-565: Duplicate carousel intervals

**setTimeout Calls:**

- [ayurit-client/src/components/DoctorSlotManager.jsx](ayurit-client/src/components/DoctorSlotManager.jsx#L62,L144)
  - Line 62: `const timer = setTimeout(fetchSlots, 300);` (debounce)
  - Line 144: `setTimeout(() => setSuccess(false), 2000);` (toast)

- [ayurit-client/src/components/AppointmentBooking.jsx](ayurit-client/src/components/AppointmentBooking.jsx#L79)
  - Line 79: `setTimeout(() => { ... }, ...);` (booking flow)

- [ayurit-client/src/pages/LandingPage.jsx](ayurit-client/src/pages/LandingPage.jsx#L547,L555,L563)
  - Lines 547, 555, 563: `setTimeout(() => setIsTransitioning(false), 900);` (animation)

- [ayurit-client/src/pages/PatientDashboard.jsx](ayurit-client/src/pages/PatientDashboard.jsx#L768)
  - Line 768: `logResetTimerRef.current = window.setTimeout(() => { ... });`

- [ayurit-client/src/utils/api.js](ayurit-client/src/utils/api.js#L40,L96)
  - Line 40: `const timeoutId = window.setTimeout(() => controller.abort(), DEV_API_TIMEOUT_MS);`
  - Line 96: `const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));`

- [backend/src/services/geminiService.js](backend/src/services/geminiService.js#L6)
  - Line 6: `const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));`

- [ayurit-client/src/components/ToastHost.jsx](ayurit-client/src/components/ToastHost.jsx#L49)
  - Line 49: `window.setTimeout(() => { ... });`

---

## 8. UNUSED IMPORTS REFERENCING REMOVED MODULES

**Frontend Imports:**

- [ayurit-client/src/components/VideoConsultation.jsx](ayurit-client/src/components/VideoConsultation.jsx#L2)
  - Import: `import './VideoConsultation.css'`
  - Status: Component exists but may have unused functionality

- [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx#L15)
  - Import: `import VideoConsultation from '../components/VideoConsultation'`
  - Status: Likely used for video consultations

**Backend Imports:**

- [backend/src/routes/index.js](backend/src/routes/index.js#L8)
  - Import: `import clinicRoutes from "./clinicRoutes.js";`
  - Status: **NOT USED** - clinicRoutes is imported but never mounted

- [backend/src/services/platformService.js](backend/src/services/platformService.js#L1-L6)
  - Imports related to removed features

- [backend/src/models/consultation.js](backend/src/models/consultation.js)
  - Complete Mongoose model (may or may not be exported/used)

---

## 9. SUMMARY OF FINDINGS BY CATEGORY

### Files to Review/Clean Up:

**High Priority:**
1. [backend/src/routes/index.js](backend/src/routes/index.js) - Remove unused clinicRoutes import
2. [backend/src/constants/roles.js](backend/src/constants/roles.js) - Check if ROLES.DIETITIAN still defined
3. [backend/src/services/platformService.js](backend/src/services/platformService.js) - Remove dietitian seed user, dietCharts methods
4. Remove clinical route endpoints not in use

**Medium Priority:**
1. [ayurit-client/src/pages/DoctorDashboard.jsx](ayurit-client/src/pages/DoctorDashboard.jsx) - Diet chart polling (line 280)
2. [ayurit-client/src/pages/PatientDashboard.jsx](ayurit-client/src/pages/PatientDashboard.jsx) - Diet chart API calls (line 430)
3. [backend/src/routes/userRoutes.js](backend/src/routes/userRoutes.js) - Remove dietitian/clinic_staff from permits
4. [backend/src/routes/prescriptionRoutes.js](backend/src/routes/prescriptionRoutes.js) - Remove dietitian/clinic_staff permissions
5. [backend/src/routes/reportRoutes.js](backend/src/routes/reportRoutes.js) - Remove dietitian/clinic_staff permissions

**Low Priority (Testing/Documentation):**
1. Backend test files - Leave as-is (comprehensive_smoke_test.js, video_smoke_test.js)
2. Documentation files - Update with current scope
3. Console.logs in seed/config files - Keep for debugging

### Active Consultation Features (KEEP):
- ✅ Consultation model and service
- ✅ Consultation routes and controllers
- ✅ Socket listeners for consultations
- ✅ Video smoke test
- ✅ Consultation API endpoints

### Removed Features (REMOVE):
- ❌ Dietitian role references
- ❌ Clinic_staff role references (or keep if needed for other purposes)
- ❌ Diet chart functionality (clinical routes)
- ❌ Clinic settings (or keep if needed)

---

## File Count Summary

| Category | Count |
|----------|-------|
| Files referencing "consultation" | 15+ |
| Files referencing "dietitian" | 6+ |
| Files referencing "clinic_staff" | 8+ |
| Socket listeners | 6 |
| API endpoints | 9+ |
| setTimeout/setInterval calls | 20+ |
| Console.log statements | 150+ |

---

## Appendix: Complete File Listing

### Models
- backend/src/models/consultation.js
- backend/src/models/dietPlan.js
- backend/src/models/clinicSetting.js

### Routes
- backend/src/routes/consultationRoutes.js
- backend/src/routes/clinicalRoutes.js
- backend/src/routes/clinicRoutes.js
- backend/src/routes/userRoutes.js
- backend/src/routes/prescriptionRoutes.js
- backend/src/routes/reportRoutes.js
- backend/src/routes/providerRoutes.js
- backend/src/routes/patientRoutes.js

### Services
- backend/src/services/dataService.js
- backend/src/services/platformService.js
- backend/src/services/dietPlanService.js

### Controllers
- backend/src/controllers/consultationController.js
- backend/src/controllers/clinicalController.js
- backend/src/controllers/clinicController.js
- backend/src/controllers/userController.js

### Frontend Components
- ayurit-client/src/components/VideoConsultation.jsx
- ayurit-client/src/pages/DoctorDashboard.jsx
- ayurit-client/src/pages/PatientDashboard.jsx
- ayurit-client/src/pages/SuperAdminDashboard.jsx
- ayurit-client/src/components/DoctorAppointmentQueue.jsx
