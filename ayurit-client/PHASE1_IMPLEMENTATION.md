# Phase 1: Appointment System - Implementation Checklist

**Objective:** Enable doctors to create time slots and patients to book appointments  
**Timeline:** 4-5 days  
**Complexity:** Medium

---

## 📋 Task Breakdown

### Step 1: Backend Appointment Model (2 hours)

**File:** `backend/models/appointment.js`

```javascript
const appointmentSchema = new Schema({
  // Doctor Info
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Slot Details
  date: {
    type: String,        // "2026-05-14"
    required: true
  },
  startTime: {
    type: String,        // "10:00"
    required: true
  },
  endTime: {
    type: String,        // "10:30"
    required: true
  },

  // Booking Status
  isBooked: {
    type: Boolean,
    default: false
  },
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'Patient'
  },

  // Reason for visit
  reason: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for fast queries
appointmentSchema.index({ doctorId: 1, date: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ date: 1, isBooked: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
```

**Checklist:**
- [ ] Create schema
- [ ] Add indexes
- [ ] Export model
- [ ] Test in MongoDB Compass

---

### Step 2: Backend Controller (3 hours)

**File:** `backend/controllers/appointmentController.js`

**Functions Needed:**

```javascript
// 1. Create slot (Doctor only)
exports.createSlot = async (req, res) => {
  const { date, startTime, endTime } = req.body;
  const doctorId = req.user._id;  // From auth middleware
  
  // TODO: Validate time format
  // TODO: Check no overlaps
  // TODO: Save to DB
};

// 2. Get available slots (Patient views)
exports.getAvailableSlots = async (req, res) => {
  const { doctorId, date } = req.query;
  
  // TODO: Query appointments where:
  //   doctorId = X
  //   date = X
  //   isBooked = false
  // TODO: Return sorted by time
};

// 3. Get doctor's all slots (Doctor management)
exports.getDoctorSlots = async (req, res) => {
  const doctorId = req.user._id;
  
  // TODO: Query all slots for doctor
  // TODO: Show booking status
};

// 4. Book appointment (Patient books)
exports.bookAppointment = async (req, res) => {
  const { slotId } = req.body;
  const patientId = req.user._id;
  
  // TODO: Check slot exists & isBooked = false
  // TODO: Update slot: isBooked = true, patientId = X
  // TODO: Create consultation record
  // TODO: Trigger notification
};

// 5. Cancel appointment (Patient/Doctor)
exports.cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  
  // TODO: Mark slot as available again
  // TODO: Delete/mark consultation
  // TODO: Trigger notification
};

// 6. Get doctor's today appointments (Doctor dashboard)
exports.getDoctorTodayAppointments = async (req, res) => {
  const doctorId = req.user._id;
  const today = getCurrentDate();
  
  // TODO: Get all booked appointments for today
  // TODO: Join with patient data
  // TODO: Sort by time
};

// 7. Get patient's appointments (Patient dashboard)
exports.getPatientAppointments = async (req, res) => {
  const patientId = req.user._id;
  
  // TODO: Get all patient appointments
  // TODO: Sort by date (upcoming first)
};

// 8. Delete slot (Doctor removes available slot)
exports.deleteSlot = async (req, res) => {
  const { slotId } = req.params;
  
  // TODO: Check slot not booked
  // TODO: Delete from DB
};
```

**Checklist:**
- [ ] Write all 8 functions
- [ ] Add input validation
- [ ] Add auth checks (doctor-only actions)
- [ ] Add error handling
- [ ] Test each endpoint

---

### Step 3: Backend Routes (1 hour)

**File:** `backend/routes/appointmentRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middlewares/auth');

// Doctor endpoints (protected)
router.post('/slots', auth, appointmentController.createSlot);
router.get('/slots/doctor', auth, appointmentController.getDoctorSlots);
router.delete('/slots/:slotId', auth, appointmentController.deleteSlot);
router.get('/doctor/today', auth, appointmentController.getDoctorTodayAppointments);

// Patient endpoints (protected)
router.get('/available', auth, appointmentController.getAvailableSlots);
router.post('/book', auth, appointmentController.bookAppointment);
router.delete('/:appointmentId', auth, appointmentController.cancelAppointment);
router.get('/patient', auth, appointmentController.getPatientAppointments);

module.exports = router;
```

**Checklist:**
- [ ] Create routes file
- [ ] Add auth middleware to all
- [ ] Register in main routes index
- [ ] Test routes respond

---

### Step 4: Frontend - Doctor Slot Manager (3 hours)

**File:** `src/components/DoctorSlotManager.jsx`

**Features:**
- Create slot form (date picker, time pickers)
- Display existing slots
- Delete slot button
- Form validation

**Checklist:**
- [ ] Create component
- [ ] Add date/time input fields
- [ ] Add create slot function
- [ ] Add display slots list
- [ ] Add delete slot function
- [ ] Add error handling
- [ ] Test API integration

---

### Step 5: Frontend - Patient Appointment Booking (3 hours)

**File:** `src/components/AppointmentBooking.jsx`

**Features:**
- Search available slots
- Display slots as cards
- Book appointment button
- Show confirmation

**Checklist:**
- [ ] Create component
- [ ] Add doctor/date filter
- [ ] Fetch available slots
- [ ] Display as selectable list
- [ ] Add book function
- [ ] Show confirmation modal
- [ ] Add error handling

---

### Step 6: Frontend - Doctor Appointment Queue (2 hours)

**File:** `src/components/DoctorAppointmentQueue.jsx`

**Features:**
- Show today's appointments
- Patient details
- Join button

**Checklist:**
- [ ] Create component
- [ ] Fetch today's appointments
- [ ] Display in list/card format
- [ ] Add "Join Consultation" button
- [ ] Link to Jitsi room (Phase 2)

---

### Step 7: Integration into Dashboards (2 hours)

**Modifications:**

**DoctorDashboard.jsx:**
- [ ] Import `DoctorSlotManager`
- [ ] Import `DoctorAppointmentQueue`
- [ ] Add tabs: "Availability" | "Today's Patients" | "History"

**PatientDashboard.jsx:**
- [ ] Import `AppointmentBooking`
- [ ] Replace static "View Slots Today" with component
- [ ] Add "My Appointments" section

---

### Step 8: Testing (2 hours)

**Manual Tests:**

**Doctor Flow:**
1. [ ] Doctor creates 3 slots for tomorrow
2. [ ] Verify in MongoDB: 3 documents created
3. [ ] Verify `isBooked = false`
4. [ ] Doctor deletes 1 slot
5. [ ] Verify in MongoDB: slot deleted

**Patient Flow:**
1. [ ] Patient views available slots
2. [ ] [ ] Should see 2 remaining slots
3. [ ] Patient books 1 slot
4. [ ] Verify in MongoDB: `isBooked = true`, `patientId` set
5. [ ] Patient tries to book same slot again
6. [ ] Should get "Slot already booked" error
7. [ ] Patient views their appointments
8. [ ] Should see booked appointment

**Doctor Dashboard:**
1. [ ] Doctor views "Today's Patients"
2. [ ] Should see patient who booked
3. [ ] Patient details visible
4. [ ] "Join Consultation" button ready

---

## 🔧 Development Commands

```bash
# Backend - Start with hot reload
cd backend
npm run dev

# Frontend - Start dev server
cd ayurit-client
npm run dev

# MongoDB - Query appointments
# Use MongoDB Compass to inspect documents
```

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Slot times overlap | Add validation in backend before save |
| Doctor creates past slots | Validate date/time not in past |
| Patient can't see slots | Check API response, verify auth token |
| MongoDB connection error | Verify MONGODB_URI in .env |
| CORS errors | Check ALLOWED_ORIGIN in backend |

---

## ✅ Definition of Done

✅ Doctor can create slots via UI  
✅ Slots persist in MongoDB  
✅ Patient can view available slots  
✅ Patient can book appointment  
✅ Booked slot shows in doctor dashboard  
✅ All API endpoints tested  
✅ Error messages clear  
✅ No console errors  

---

## 📊 Estimated Breakdown

| Task | Hours | Days |
|------|-------|------|
| Model + Schema | 2 | 0.5 |
| Backend Controller | 3 | 1 |
| Backend Routes | 1 | 0.25 |
| Doctor Slot Manager | 3 | 1 |
| Patient Booking | 3 | 1 |
| Doctor Queue | 2 | 0.5 |
| Dashboard Integration | 2 | 0.5 |
| Testing | 2 | 0.5 |
| **Total** | **18** | **4.75 days** |

---

## 🎯 Success Criteria

When complete:
- Doctor can manage all slots
- Patient can book appointments
- Doctor sees upcoming consultations
- All data persists in MongoDB
- No bugs or errors
- Code is clean and documented

Ready to start Phase 1? 🚀
