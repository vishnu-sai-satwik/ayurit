# Phase 1: Appointment System - Testing Guide

**Status:** Implementation Complete ✅  
**Last Updated:** May 13, 2026  
**Focus:** Full end-to-end appointment workflow testing

---

## 🎯 Workflow: Patient Consultation Journey

```
Registration
    ↓
Doctor Creates Slots
    ↓
Patient Books Appointment
    ↓
Doctor Sees Appointment in Queue
    ↓
Consultation Begins (Jitsi Ready for Phase 2)
    ↓
Doctor Completes Appointment
    ↓
Notifications Sent
    ↓
History Recorded
```

---

## 📋 Pre-Test Setup

### 1. Start Backend & Frontend

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd ayurit-client
npm run dev

# Access:
# Frontend: http://localhost:5174
# Backend: http://localhost:4000
```

### 2. Seed Test Data

```bash
# In backend directory
npm run seed

# This creates:
# - admin@ayurit.com (Admin@123)
# - doctor@ayurit.com (Doctor@123)
# - patient@ayurit.com (Patient@123)
# - 16 available slots for tomorrow (9 AM - 5 PM)
# - 1 booked appointment at 10:00 AM
```

---

## 🧪 Test Scenario 1: Doctor Creates Slots

### Step 1: Login as Doctor

1. Go to http://localhost:5174/login
2. Select Role: **Practitioner**
3. Email: `doctor@ayurit.com`
4. Password: `Doctor@123`
5. Click **Log In**

### Step 2: Navigate to Appointments

1. Sidebar → **Appointments**
2. See two sections:
   - Left: "Manage Your Availability" (Slot Manager)
   - Right: "Consultation Queue" (Appointment Queue)

### Step 3: Create a Slot

**Slot Manager Form (Left Panel):**

1. **Date:** Select a future date (e.g., May 15, 2026)
2. **Start Time:** 2:00 PM
3. **End Time:** 2:30 PM
4. Click **Create Slot**

**Expected Result:**
- ✓ New slot appears in the slots list
- ✓ Status shows "Open"
- ✓ Delete button appears

### Step 4: Create Multiple Slots

Repeat Step 3 for:
- 2:30 PM - 3:00 PM
- 3:00 PM - 3:30 PM
- 3:30 PM - 4:00 PM

**Expected Result:**
- ✓ At least 4 "Open" slots visible for the selected date

---

## 🧪 Test Scenario 2: Patient Books Appointment

### Step 1: Logout & Login as Patient

1. Click **Sign Out**
2. Go to http://localhost:5174/login
3. Select Role: **Patient**
4. Email: `patient@ayurit.com`
5. Password: `Patient@123`
6. Click **Log In**

### Step 2: Navigate to Appointments

1. Sidebar (or Mobile Nav) → **Appointments** (or **Book**)
2. See "Book an Appointment" form

### Step 3: Book an Appointment

**Booking Form:**

1. **Select Date:** Choose the same date as doctor's slots (May 15)
2. **Select Time:** Click on one of the available time slots (e.g., 2:00 PM)
   - Slot should highlight in green
3. **Reason (Optional):** Enter "Digestive issues"
4. Click **Confirm Appointment**

**Expected Result:**
- ✓ Success toast: "Appointment booked successfully!"
- ✓ Time slots refresh
- ✓ Booked slot no longer available

### Step 4: Verify Patient Appointments

Patient should see:
- Appointment appears in "Appointment History" section
- Status: "booked"
- Date/time correct
- Cannot book same slot again

---

## 🧪 Test Scenario 3: Doctor Views Appointment Queue

### Step 1: Logout & Login as Doctor

1. Sign Out
2. Login as `doctor@ayurit.com` / `Doctor@123`
3. Select Role: **Practitioner**

### Step 2: Navigate to Appointments

1. Sidebar → **Appointments**
2. Look at Right Panel: "Consultation Queue"

### Step 3: Verify Booked Appointment

**Queue Should Show:**
- Date/Time: Tomorrow 2:00 PM
- Patient ID: The patient's ID
- Status Badge: **Booked** (orange)
- "Start Consultation" button available

### Step 4: Test Status Workflow

1. **Change to In-Progress:**
   - Click **Start Consultation**
   - Status changes to **In Progress** (blue)
   - Button changes to "Complete" and "Cancel"

2. **Complete Consultation:**
   - Click **Complete**
   - Status changes to **Completed** (green)
   - Buttons disappear (appointment finalized)

3. **Cancel (Create new slot first to test):**
   - Create another slot
   - Patient books it
   - Doctor clicks **Cancel** when in-progress
   - Status: **Cancelled** (red)
   - Notification sent

---

## 🧪 Test Scenario 4: Notifications

### Step 1: Patient Receives Notification

After booking:
1. Logout & login as patient
2. Look for **Bell Icon** (top right) or check **Notifications** section
3. Unread notification count should show "1" or similar

**Expected Notification:**
- "Your consultation with Dr. Sharma has been booked"
- Or similar appointment confirmation

### Step 2: Doctor Receives Notification

After appointment is booked:
1. Doctor refreshes dashboard
2. Check notifications for:
   - "New appointment booked"
   - Patient name and appointment time

### Step 3: Mark Notifications as Read

- Click notification
- Click "Mark as Read"
- Or click "Mark All Read"

---

## ✅ Validation Checklist

### Doctor Slot Management
- [ ] Can create slots with date/time inputs
- [ ] Slots display in list format
- [ ] Can delete available slots
- [ ] Cannot book same time slot twice
- [ ] Past dates not selectable
- [ ] End time must be after start time

### Patient Booking
- [ ] Can view available slots
- [ ] Slots filter by date
- [ ] Can select slot (highlight changes)
- [ ] Reason field optional
- [ ] Booking confirmation shows
- [ ] Booked slot immediately unavailable

### Doctor Queue
- [ ] Displays today's & upcoming appointments
- [ ] Shows patient ID and reason
- [ ] Status badges color-coded
- [ ] "Start Consultation" button visible for booked
- [ ] Status transitions work (booked → in-progress → completed)
- [ ] Can cancel from in-progress
- [ ] Filter buttons work

### Notifications
- [ ] Appointment booked → notification sent
- [ ] Appointment cancelled → notification sent
- [ ] Status change → notification sent
- [ ] Can mark as read
- [ ] Unread count displays
- [ ] "Mark All Read" works

### Data Persistence
- [ ] Refresh page → data persists
- [ ] Logout/login → data accessible
- [ ] MongoDB shows new appointments
- [ ] Status changes persist

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "No available slots" showing | Ensure date selected matches doctor's slot date |
| Booked slot still showing | Refresh page or check if status is "available" |
| Notifications not showing | Check if NotificationService is working, see logs |
| Doctor can't see appointments | Verify doctorId matches in database |
| Slot creation fails | Check start/end time format (HH:MM) |

---

## 📊 MongoDB Queries for Verification

### View All Appointments

```javascript
db.appointments.find({}).pretty()
```

### View Doctor's Slots

```javascript
db.appointments.find({ 
  doctorId: "DOCTOR_ID", 
  status: "available" 
}).pretty()
```

### View Patient's Bookings

```javascript
db.appointments.find({ 
  patientId: "PATIENT_ID", 
  status: "booked" 
}).pretty()
```

### View Today's Consultations

```javascript
db.appointments.find({ 
  startAt: { 
    $gte: ISODate("2026-05-14T00:00:00Z"),
    $lt: ISODate("2026-05-15T00:00:00Z")
  }
}).pretty()
```

---

## 🚀 Advanced Testing

### Test Double Booking Prevention

1. Doctor creates 1 slot: 2:00 PM - 2:30 PM
2. Patient A books it
3. Patient B tries to book same slot
   - Expected: "Slot not available" error

### Test Status Flow Integrity

1. Doctor changes status: available → booked → in-progress → completed
   - Should work smoothly
2. Try invalid transitions
   - Available → Completed (should fail or not be available)

### Test Real-Time Updates

1. Doctor creates slot
2. Patient (in another browser tab) immediately tries to book
   - Should see slot within seconds
3. Doctor deletes slot while patient viewing
   - Slot should disappear from patient list

### Test Mobile Responsiveness

1. Open app on mobile (iPhone 12 viewport: 390×844)
2. Test all buttons/forms on small screen
3. Bottom navigation should work
4. Appointment cards should stack vertically

---

## 📝 Logging for Debugging

**Backend Logs (Terminal Running Backend):**

When booking appointment:
```
[API] POST /api/appointments
[Appointment] Status changed: available → booked
[Notification] Appointment booked notification sent
```

**Frontend Console Logs:**

Press F12 in browser:
```
[AppointmentBooking] Available slots loaded { count: 4 }
[AppointmentBooking] Appointment booked successfully { appointmentId: "..." }
[DoctorAppointmentQueue] Appointments fetched { count: 3 }
```

---

## ✨ Next Steps (Phase 2+)

- [ ] Add Jitsi Meet integration for video consultations
- [ ] Implement real-time socket updates
- [ ] Add appointment reminders (30 min before)
- [ ] Create consultation history with notes
- [ ] Add doctor notes & prescriptions
- [ ] Implement real adherence calculations
- [ ] Add appointment cancellation notifications

---

## 📞 Support & Troubleshooting

**If tests fail:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Restart backend server
3. Check MongoDB connection
4. Verify all imports/components created correctly
5. Check console for errors (F12)

**Success Indicator:**
When you can complete the full flow:
Doctor creates slots → Patient books → Doctor sees queue → Doctor completes consultation
**= Phase 1 Ready for Production** ✅

---

**Ready to test? Start with Scenario 1!** 🎬
