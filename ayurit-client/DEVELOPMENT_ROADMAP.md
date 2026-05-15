# AyurIT Development Roadmap - Healthcare Workflow Architecture

**Current Status:** Core infrastructure complete (Auth, Dashboards, DB, Daily Logs)  
**Next Stage:** Healthcare workflow completion (Appointments → Consultations → Analytics)  
**Architecture Approach:** Dependency-driven phased development

---

## 📋 Development Phases (Correct Dependency Order)

```
Phase 1: Appointments (CORE DEPENDENCY)
    ↓
Phase 2: Video Consultations
    ↓
Phase 3: Consultation History
    ↓
Phase 4: Notifications
    ↓
Phase 5: Real Analytics
    ↓
Phase 6: Reports & PDFs
```

> **Critical:** Do NOT build notifications/analytics/prescriptions before appointments work. Appointments are the workflow engine.

---

## 🔴 PHASE 1: APPOINTMENT SYSTEM (Highest Priority)

**Why First:** Everything else depends on appointments existing.

**Deliverables:**
- Doctor slot management (create/edit/delete)
- Patient appointment booking
- Doctor appointment queue/dashboard
- MongoDB collections populated

### 1.1 Doctor Slot Management (Doctor Dashboard)

**UI Component:** `DoctorSlotManager.jsx`

**Features:**
- Create available slots (date, start time, end time)
- Edit existing slots
- Delete slots
- Mark unavailable
- View all slots (weekly/monthly calendar)
- Slot duration: 30 min (configurable)

**Example UI:**
```
Doctor Available Slots
┌─────────────────────────────────┐
│ May 14, 2026                    │
├─────────────────────────────────┤
│ 10:00 AM - 10:30 AM [Delete]    │
│ 11:00 AM - 11:30 AM [Delete]    │
│ 2:00 PM - 2:30 PM   [Delete]    │
├─────────────────────────────────┤
│ + Add New Slot                  │
└─────────────────────────────────┘
```

**Database Schema (appointments collection):**
```javascript
{
  _id: ObjectId,
  doctorId: "doctor_123",
  date: "2026-05-14",
  startTime: "10:00",        // HH:MM format
  endTime: "10:30",          // HH:MM format
  isBooked: false,
  patientId: null,           // Set when booked
  createdAt: Date,
  updatedAt: Date
}
```

**Backend Endpoints Needed:**
- `POST /api/slots` - Create slot
- `GET /api/slots?doctorId=X` - Get doctor's slots
- `PUT /api/slots/:slotId` - Update slot
- `DELETE /api/slots/:slotId` - Delete slot

### 1.2 Patient Appointment Booking

**UI Component:** `AppointmentBooking.jsx`

**Features:**
- View available slots (search by doctor/date)
- Book appointment
- View booking confirmation

**Example UI:**
```
Available Appointments with Dr. Sharma
┌─────────────────────────────────┐
│ Filter: May 14, 2026            │
├─────────────────────────────────┤
│ □ 10:00 AM - 10:30 AM [Book]    │
│ □ 11:00 AM - 11:30 AM [Book]    │
│ □ 2:00 PM - 2:30 PM   [Book]    │
└─────────────────────────────────┘
```

**Flow:**
1. Patient clicks "View Slots Today"
2. Fetch available slots: `GET /api/slots?doctorId=X&date=TODAY`
3. Display unbooked slots (isBooked = false)
4. Patient clicks "Book"
5. POST to `POST /api/appointments/book` with:
   - slotId
   - patientId
   - reason (optional)
6. Update slot: isBooked = true, patientId attached
7. Create consultation record
8. Show confirmation

**Backend Endpoint:**
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments?patientId=X` - Get patient appointments

### 1.3 Doctor Appointment Queue

**UI Component:** `DoctorAppointmentQueue.jsx`

**Features:**
- Show upcoming appointments today
- Show past consultations
- Patient details
- "Join Consultation" button

**Example UI:**
```
Today's Consultations
┌──────────────────────────────────┐
│ 10:00 AM - Rajesh (Digestion)    │
│ Status: Confirmed                │
│ [Join Consultation]              │
├──────────────────────────────────┤
│ 11:00 AM - Priya (Energy)        │
│ Status: Confirmed                │
│ [Join Consultation]              │
└──────────────────────────────────┘
```

**Fetch:** `GET /api/appointments?doctorId=X&date=TODAY`

---

## 🟠 PHASE 2: VIDEO CONSULTATION (Jitsi Meet Integration)

**Implementation:** Use Jitsi Meet (free, no backend complexity)

### 2.1 Consultation Room Setup

**Dependencies:**
```bash
npm install @jitsi/react-sdk
```

**Component:** `ConsultationRoom.jsx`

**Flow:**
1. Appointment confirmed → Generate roomId
2. Store roomId in consultation record
3. Doctor clicks "Join Consultation"
4. Patient sees "Join" button when appointment time arrives
5. Both join same Jitsi room: `https://meet.jit.si/ayurit-consult-{roomId}`

**Implementation:**
```javascript
// Generate unique room ID
const roomId = `ayurit-${appointmentId}-${Date.now()}`;

// Store in consultation
POST /api/consultations {
  appointmentId,
  doctorId,
  patientId,
  roomId,
  status: "scheduled"
}

// Jitsi Room Component
<JitsiMeeting
  roomName={roomId}
  userInfo={{
    displayName: userName,
    email: userEmail
  }}
/>
```

### 2.2 Doctor-Patient Screen Share

**Features:**
- Video call
- Screen sharing
- Chat
- Recording (optional - Jitsi handles)

---

## 🟡 PHASE 3: CONSULTATION HISTORY

**Database Schema (consultations collection):**
```javascript
{
  _id: ObjectId,
  appointmentId: "apt_123",
  patientId: "pat_123",
  doctorId: "doc_123",
  roomId: "ayurit-apt_123-xxx",
  status: "completed",        // scheduled, ongoing, completed
  notes: "Patient shows good digestion...",
  prescription: "Continue warm water, avoid cold foods",
  recommendations: ["Increase ghee", "Morning yoga"],
  recordingUrl: "...",        // If recorded
  consultationDate: Date,
  createdAt: Date
}
```

**Features:**

Patient sees:
- Past consultations
- Doctor notes
- Prescriptions
- Recommendations

Doctor sees:
- Consultation history
- Patient progress
- Past prescriptions

**UI Component:** `ConsultationHistory.jsx`

**Example:**
```
Past Consultations
┌─────────────────────────────────┐
│ May 10, 2026 - Dr. Sharma       │
│ Topic: Digestion Issues         │
│ Status: Completed               │
│ Notes: Good progress observed   │
│ Prescription: View              │
├─────────────────────────────────┤
│ May 3, 2026 - Dr. Patel         │
│ Topic: Energy Levels            │
│ Status: Completed               │
│ Prescription: View              │
└─────────────────────────────────┘
```

---

## 🟢 PHASE 4: NOTIFICATIONS SYSTEM

**Triggers:**
- Appointment booked
- Appointment reminder (30 min before)
- Consultation reminder
- Prescription added
- Diet plan updated

**Database Schema (notifications collection):**
```javascript
{
  _id: ObjectId,
  userId: "user_123",
  type: "appointment_booked",    // appointment_booked, reminder, prescription, diet_update
  message: "Your consultation with Dr. Sharma starts in 15 minutes",
  relatedId: "appointment_123",  // Link to relevant record
  read: false,
  createdAt: Date,
  readAt: Date
}
```

**Frontend Features:**
- Notification bell (shows unread count)
- Notification dropdown
- Mark as read
- Clear notifications

**Backend Endpoints:**
- `POST /api/notifications` - Create notification
- `GET /api/notifications?userId=X` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

---

## 🔵 PHASE 5: REAL ANALYTICS

**Replace static values with calculated metrics.**

### 5.1 Adherence Calculation

**Formula:**
```
Adherence = (Meals Logged / Meals Expected) × 100
```

**Example:**
- Prescribed: 3 meals/day × 7 days = 21 meals
- Logged: 15 meals
- Adherence: (15/21) × 100 = 71%

**Implementation:**
```javascript
const calculateAdherence = (patientId, daysBack = 7) => {
  // 1. Get diet plan for patient
  const dietPlan = getDietPlan(patientId);
  const mealsPerDay = 3;  // Morning, Afternoon, Evening
  const expectedMeals = mealsPerDay * daysBack;
  
  // 2. Count logged meals from charts collection
  const loggedMeals = getLoggedMeals(patientId, daysBack);
  
  // 3. Calculate
  return (loggedMeals.length / expectedMeals) * 100;
};
```

### 5.2 Energy Trend Analysis

**Data Points:**
- Energy ratings (1-10 scale)
- Digestion quality
- Symptom reports
- Mood logs

**Calculation:**
```
Compare:
- Week 1 average energy
- Week 2 average energy
- Recent 3 days average

Status:
- If recent > week1 average: "Improving ↑"
- If recent ≈ week1 average: "Stable →"
- If recent < week1 average: "Declining ↓"
```

**Implementation:**
```javascript
const calculateEnergyTrend = (patientId) => {
  // Get energy logs from last 14 days
  const logsWeek1 = getLogsWeek(patientId, 1);
  const logsWeek2 = getLogsWeek(patientId, 2);
  
  const avg1 = calculateAverage(logsWeek1);
  const avg2 = calculateAverage(logsWeek2);
  
  if (avg2 > avg1) return { trend: "Improving ↑", value: avg2 };
  if (avg2 ≈ avg1) return { trend: "Stable →", value: avg2 };
  return { trend: "Declining ↓", value: avg2 };
};
```

---

## 🟣 PHASE 6: REPORTS & PDFs (Later Phase)

**Deliverables:**
- Downloadable consultation reports
- Diet charts PDF
- Prescription summaries
- Progress reports

**Libraries:**
```bash
npm install pdfkit html-pdf
```

---

## 🎯 Implementation Priority (Week-by-Week Suggested)

### Week 1: Phase 1 (Appointments)
- [ ] Doctor slot creation UI/backend
- [ ] Patient appointment booking UI/backend
- [ ] Doctor appointment queue
- [ ] MongoDB queries optimized
- [ ] **Estimated:** 20-30 hours

### Week 2: Phase 2 (Video Consultations)
- [ ] Jitsi Meet integration
- [ ] Room ID generation
- [ ] Doctor-patient join flow
- [ ] **Estimated:** 8-10 hours

### Week 3: Phases 3-4 (History + Notifications)
- [ ] Consultation history display
- [ ] Notification triggers
- [ ] Notification UI component
- [ ] **Estimated:** 12-15 hours

### Week 4: Phase 5 (Analytics)
- [ ] Adherence calculation
- [ ] Energy trend analysis
- [ ] Dashboard metric updates
- [ ] **Estimated:** 10-12 hours

### Week 5+: Phase 6 (PDFs & Polish)
- [ ] Report generation
- [ ] Testing & bug fixes
- [ ] Performance optimization
- [ ] **Estimated:** 15-20 hours

---

## 🏗️ Architecture Decision: Data Flow

**Appointment Booking Flow:**
```
Patient clicks "View Slots"
    ↓
Frontend: GET /api/slots?doctorId=X&date=TODAY
    ↓
Backend: Query appointments collection (isBooked=false)
    ↓
Frontend: Display available slots
    ↓
Patient clicks "Book"
    ↓
Frontend: POST /api/appointments/book
    ↓
Backend:
  1. Update appointment: isBooked=true, patientId=X
  2. Create consultation record
  3. Return confirmation
    ↓
Frontend: Show "Appointment Confirmed" + Create notification
```

---

## 📝 Database Collections to Use

✅ **Already exist, need population:**
- `appointments` (slots + bookings)
- `consultations` (doctor-patient meetings)
- `notifications` (user alerts)

**Need schema updates:**
- `appointments`: Add fields for slots vs bookings
- `consultations`: Add roomId, status, notes
- `charts`: Add energy/mood rating fields

---

## ✅ Recommended Starting Point

**Start with Phase 1 - Doctor Slot Management:**

1. Create `DoctorSlotManager.jsx` component
2. Add backend endpoints:
   - `POST /api/slots` (create)
   - `GET /api/slots` (list)
   - `DELETE /api/slots/:id` (delete)
3. Test appointment creation in MongoDB
4. Then move to patient booking

**Timeline:** 4-5 hours for Phase 1 foundation

---

## 🔗 Related Files to Update

- `src/pages/DoctorDashboard.jsx` - Add slot manager
- `src/pages/PatientDashboard.jsx` - Add appointment booking
- `backend/controllers/appointmentController.js` - Add slot endpoints
- `backend/routes/appointmentRoutes.js` - Add routes
- `backend/models/appointment.js` - Update schema

---

## 📌 Key Principles

1. **Appointments first** - Don't build analytics until appointments exist
2. **Dependency order** - Follow the phases (1→2→3→4→5→6)
3. **Test each phase** - Verify MongoDB data before moving to UI
4. **Real data** - Replace all static placeholders with calculated values
5. **User workflows** - Design for actual patient-doctor interaction

---

**Status:** Ready to begin Phase 1  
**Confidence:** High (clear architecture, no blockers)  
**Complexity:** Medium (requires API design, DB queries, UI coordination)

What would you like to tackle first? 🚀
