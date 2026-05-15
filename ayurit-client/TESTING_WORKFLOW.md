# Phase 1 Appointment Workflow - Testing Guide

## System Status ✅
- **Backend**: Running on http://localhost:4001
- **Frontend**: Running on http://localhost:5174
- **Database**: MongoDB Atlas connected
- **Test Data**: Created with seed script

---

## Test Accounts

### Admin Account
- Email: `admin@ayurit.com`
- Password: `Admin@123`
- Role: Admin

### Doctor Account
- Email: `doctor@ayurit.com`
- Password: `Doctor@123`
- Role: Doctor
- Profile: Dr. Sharma, Ayurvedic Medicine Specialist

### Patient Account
- Email: `patient@ayurit.com`
- Password: `Patient@123`
- Role: Patient
- Profile: Rajesh Kumar, Age 35, Male

---

## Test Data Already Created

### Appointment Slots
- **16 available slots** created for tomorrow
- **Time Range**: 9:00 AM - 5:00 PM (30-minute slots)
- **Doctor**: Dr. Sharma (doctor@ayurit.com)

### Sample Booked Appointment
- **Time**: Tomorrow at 10:00 AM
- **Patient**: Rajesh Kumar (patient@ayurit.com)
- **Doctor**: Dr. Sharma (doctor@ayurit.com)
- **Status**: Booked
- **Reason**: General consultation - Digestion

---

## Complete Workflow Test (5-10 minutes)

### Step 1: Doctor Creates Slots
**Goal**: Verify doctor can create new appointment slots

1. Open http://localhost:5174
2. Login as `doctor@ayurit.com` / `Doctor@123`
3. Navigate to Doctor Dashboard
4. Go to "Manage Availability" or slot manager
5. **Create Slot**:
   - Date: Pick tomorrow or future date
   - Start Time: 02:00 PM
   - End Time: 02:30 PM
   - Click "Create Slot"
6. **Expected**: 
   - Success toast message
   - Slot appears in list
   - Backend receives request at POST /api/appointments/doctor/slots

---

### Step 2: Patient Sees Available Slots
**Goal**: Verify patient can see doctor's available slots

1. Open http://localhost:5174 in **new incognito/private window**
2. Login as `patient@ayurit.com` / `Patient@123`
3. Navigate to Patient Dashboard
4. Go to "Book an Appointment" section
5. **Select Doctor & Date**:
   - Doctor: Dr. Sharma or select from dropdown
   - Date: Tomorrow
6. **Expected**:
   - List of available slots appears (16 + the new one you created)
   - Shows times like "9:00 AM", "9:30 AM", etc.
   - Times are clickable buttons

---

### Step 3: Patient Books an Appointment
**Goal**: Verify patient can successfully book a slot

1. **From Step 2**, select a time slot (e.g., 11:30 AM)
2. **Optional**: Enter reason for visit
   - Example: "Digestive consultation follow-up"
3. Click "Confirm Appointment"
4. **Expected**:
   - Loading spinner appears
   - Success toast: "Appointment booked successfully!"
   - Slot disappears from available list
   - Appointment details appear in "My Bookings"

---

### Step 4: Doctor Sees Updated Queue
**Goal**: Verify doctor can see new booking in appointment queue

1. Switch back to **doctor window** (from Step 1)
2. Refresh or go to "Consultation Queue"
3. **Expected**:
   - Newly booked appointment appears
   - Shows patient name, time, and "Booked" status
   - Original 10:00 AM appointment still shows as "Booked"

---

### Step 5: MongoDB Verification
**Goal**: Verify data persistence in MongoDB Atlas

1. Go to MongoDB Atlas: https://cloud.mongodb.com
2. Navigate to your cluster
3. Go to Collections → ayurit_dev → appointments
4. **Verify**:
   - Doctor-created slots exist with `status: "available"` and `patientId: null`
   - Patient's booked appointment has:
     - `status: "booked"`
     - `patientId: patient_id`
     - Correct `startAt` and `endAt` times
   - Timestamps are correct (UTC)

---

## Critical Test: Double Booking Protection

### Scenario: Two Patients Book Same Slot

This tests the **409 Conflict** protection mechanism.

#### Setup
- Use the existing 10:00 AM booked appointment slot
- We'll create another slot and try to double-book it

#### Test Steps

1. **Doctor Creates Test Slot** (as doctor@ayurit.com):
   - Date: Tomorrow
   - Time: 3:00 PM - 3:30 PM
   - Create it

2. **Patient 1 Books the Slot**:
   - Browser 1: patient@ayurit.com
   - Select tomorrow, 3:00 PM slot
   - Click "Confirm"
   - Should succeed ✅

3. **Patient 2 Attempts Same Slot** (immediate):
   - Browser 2: Also patient@ayurit.com (same patient, different session)
     OR create another test patient account
   - Select tomorrow, 3:00 PM slot
   - Click "Confirm" at nearly the same time
   - **Expected Result**: 
     - Error: "This slot is no longer available"
     - Status 409 Conflict returned
     - Frontend automatically refreshes available slots
     - Slot disappears from list

#### Expected Backend Behavior
- First request: Creates appointment, marks slot as booked ✅
- Second request: Detects overlap, returns 409 Conflict ✅
- Patient sees friendly error message ✅

---

## Status Update Test

### Doctor Transitions Appointment Status

1. Doctor Dashboard → Consultation Queue
2. Find a "Booked" appointment (e.g., 10:00 AM)
3. Click "Start" button (or Start Consultation)
4. **Expected**:
   - Status changes to "In Progress"
   - Toast: "Consultation started"
   - Color badge changes to blue

5. Click "Complete" button
6. **Expected**:
   - Status changes to "Completed"
   - Toast: "Consultation completed"
   - Appointment appears in "Completed" filter

---

## API Endpoint Verification

### Doctor Endpoints

Test using curl or Postman (with Bearer token):

```bash
# Get doctor's available slots
GET /api/appointments/doctor/slots?status=available

# Get doctor's appointment queue
GET /api/appointments/doctor/queue

# Create a new slot
POST /api/appointments/doctor/slots
Body: {
  "date": "2026-05-15",
  "startTime": "14:00",
  "endTime": "14:30",
  "durationMinutes": 30
}
```

### Patient Endpoints

```bash
# Get available slots for a doctor
GET /api/appointments/patient/available?doctorId=<doctor_id>&date=2026-05-15

# Book an appointment
POST /api/appointments/patient/book
Body: {
  "doctorId": "<doctor_id>",
  "dateTime": "2026-05-15T14:00:00.000Z",
  "reason": "General consultation",
  "durationMinutes": 30
}

# Get patient's bookings
GET /api/appointments/patient/bookings
```

### Shared Endpoints

```bash
# Update appointment status
PATCH /api/appointments/<appointment_id>/status
Body: {
  "status": "in-progress"
}

# Get specific appointment
GET /api/appointments/<appointment_id>
```

---

## Real-Time Readiness Verification

### Frontend State Structure
✅ Components are structured to support real-time updates:

1. **DoctorSlotManager**:
   - Local state: `[slots, setSlots]`
   - Ready for: `socket.on("slot:created")`

2. **AppointmentBooking**:
   - Local state: `[availableSlots, setAvailableSlots]`
   - Ready for: `socket.on("appointment:booked")`

3. **DoctorAppointmentQueue**:
   - Local state: `[appointments, setAppointments]`
   - Ready for: `socket.on("appointment:updated")`

### Future Socket Integration (Phase 2)
Will add real-time updates without architectural changes:
```javascript
// Example (not yet implemented):
useEffect(() => {
  const socket = io('http://localhost:4001');
  socket.on('appointment:booked', (appointment) => {
    setAvailableSlots(prev => prev.filter(s => s !== appointment.dateTime));
  });
  return () => socket.disconnect();
}, []);
```

---

## Success Criteria Checklist

✅ **Workflow Complete** if ALL pass:

- [ ] Doctor can login
- [ ] Doctor can create slots (POST /api/appointments/doctor/slots)
- [ ] Patient can see available slots (GET /api/appointments/patient/available)
- [ ] Patient can book appointment (POST /api/appointments/patient/book)
- [ ] Doctor sees booking in queue (GET /api/appointments/doctor/queue)
- [ ] MongoDB has correct data (appointments collection)
- [ ] Double booking protection works (409 conflict)
- [ ] Status updates work (PATCH /api/appointments/:id/status)
- [ ] Error states display correctly (409, 400, network errors)
- [ ] Loading states work (spinning indicators)
- [ ] Toast notifications appear

---

## Debugging Tips

### If Frontend Components Don't Load
1. Check browser console for errors (F12)
2. Verify JWT token is in localStorage: `localStorage.getItem('accessToken')`
3. Check network tab - API calls should go to http://localhost:4001/api

### If API Returns 401 Unauthorized
1. Verify you're logged in
2. Check that Bearer token is being sent in Authorization header
3. Token might be expired - logout and login again

### If Double Booking Fails
1. Check backend logs for error message
2. Verify `createBooking()` in appointmentService.js is detecting overlaps
3. Ensure both requests hit backend within same time window

### If MongoDB Has No Data
1. Run seed again: `npm run seed` (from backend directory)
2. Check MongoDB connection string in .env
3. Verify network access in MongoDB Atlas whitelist

---

## Next Phase After Workflow Validation

Once **ALL success criteria** pass:

1. **Jitsi Video Integration** (Phase 2)
   - Add video meeting room on status="in-progress"
   - Generate Jitsi JWT token
   - Embed Jitsi iframe

2. **Consultation History** (Phase 3)
   - Store consultation notes after completion
   - Let patient view history

3. **Notifications** (Phase 4)
   - Email/SMS on booking
   - Reminder 30 min before

---

## Current Implementation Notes

### Components Structure
- `src/components/DoctorSlotManager.jsx` - Doctor slots UI
- `src/components/AppointmentBooking.jsx` - Patient booking UI
- `src/components/DoctorAppointmentQueue.jsx` - Doctor queue UI

### Backend Routes
- `POST /api/appointments/doctor/slots` - Create slot
- `GET /api/appointments/doctor/slots` - List doctor slots
- `GET /api/appointments/doctor/queue` - Doctor's queue
- `GET /api/appointments/patient/available` - Available for patient
- `POST /api/appointments/patient/book` - Book appointment
- `PATCH /api/appointments/:id/status` - Update status

### Error Handling
- 409 Conflict: Slot already booked (double-booking protection)
- 400 Bad Request: Invalid input
- 401 Unauthorized: Not authenticated
- 403 Forbidden: Not authorized to access
- 500 Server Error: Backend issue

### Notifications
- On booking: Both patient and doctor notified
- On status change: Appropriate notifications sent
- On cancellation: Both parties notified

---

## Time Estimation
- **Setup & Login**: 2 minutes
- **Doctor Slot Creation**: 2 minutes
- **Patient Booking**: 2 minutes
- **Verification**: 3 minutes
- **Double Booking Test**: 2 minutes

**Total**: ~10 minutes for full validation

---

## Questions During Testing?

If something doesn't work as expected:

1. Check this guide for similar scenarios
2. Look at browser console errors (F12 → Console tab)
3. Check backend logs in terminal
4. Verify JWT token in localStorage
5. Re-run seed: `npm run seed` to reset data

---

Generated: May 14, 2026
Version: Phase 1 Complete
Status: Ready for Testing ✅
