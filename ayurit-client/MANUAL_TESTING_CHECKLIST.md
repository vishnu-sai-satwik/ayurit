# AyurIT Manual Testing Checklist

## Overview
This checklist covers all critical user flows after the major cleanup: Doctor, Patient, and Superadmin. Use this to validate that core appointment functionality works correctly across all roles.

**Date Tested:** _______________  
**Tester Name:** _______________  
**Environment:** [ ] Dev [ ] Staging [ ] Production

---

## 1. DOCTOR FLOW

### 1.1 Doctor Authentication
- [ ] Can access login page (http://localhost:5173/login or relevant URL)
- [ ] Can login with doctor credentials
- [ ] After login, redirected to doctor dashboard
- [ ] Doctor dashboard loads without errors
- [ ] Dashboard displays doctor's name and role correctly
- [ ] Logout button works and redirects to login

### 1.2 Dashboard Initial Load
- [ ] Dashboard page loads in < 3 seconds
- [ ] All main sections are visible (appointments, slots, queue)
- [ ] No 404 errors in console
- [ ] No undefined variable errors
- [ ] Page responsive on different screen sizes

### 1.3 Slot Management
- [ ] "Create New Slot" button is visible
- [ ] Can open slot creation form
- [ ] Form has date, start time, and end time fields
- [ ] Can fill in all required fields
- [ ] Can submit slot creation
- [ ] New slot appears in the slot list after creation
- [ ] Can view all created slots
- [ ] Can delete a slot
- [ ] Slot deletion is confirmed before removal
- [ ] Date formatting is correct (not showing wrong dates or times)

### 1.4 Appointment Queue
- [ ] Appointment queue section is visible
- [ ] Queue displays all appointments for the doctor
- [ ] Each appointment shows: patient name, date, time, status
- [ ] Can mark appointment as "Started"
- [ ] Can mark appointment as "Completed"
- [ ] Can view appointment details
- [ ] Queue updates after status change (no refresh needed)

### 1.5 Dashboard Refresh
- [ ] Can refresh the page (F5)
- [ ] After refresh, data is still there (not lost)
- [ ] No duplicate data after refresh
- [ ] No increased memory usage after refresh
- [ ] No repeated API calls in network tab

### 1.6 Doctor Cleanup Verification
- [ ] No "Consultations" menu or section visible
- [ ] No "Video Call" buttons or options
- [ ] No "Consultation Queue" section
- [ ] No diet or food-related options
- [ ] Dashboard is focused only on appointments and slots

---

## 2. PATIENT FLOW

### 2.1 Patient Authentication
- [ ] Can access login page
- [ ] Can login with patient credentials
- [ ] After login, redirected to patient dashboard
- [ ] Patient dashboard loads without errors
- [ ] Dashboard displays patient's name correctly
- [ ] Logout button works

### 2.2 Dashboard Initial Load
- [ ] Dashboard page loads in < 3 seconds
- [ ] All sections visible (doctors list, booked appointments)
- [ ] No 404 errors in console
- [ ] No undefined variable errors
- [ ] Page responsive on different screen sizes

### 2.3 View Available Doctors
- [ ] "Available Doctors" or "Find Doctor" section visible
- [ ] Doctor list displays correctly
- [ ] Each doctor shows: name, specialization, rating (if available)
- [ ] Can click on a doctor to see details
- [ ] Doctor details page loads
- [ ] Doctor details show available time slots

### 2.4 Book Appointment
- [ ] Can select a doctor
- [ ] Can select a date (date picker works)
- [ ] Date picker doesn't allow past dates
- [ ] Can select available time slot
- [ ] Can click "Book Appointment" button
- [ ] Booking confirms successfully
- [ ] Booked appointment appears in "My Appointments"
- [ ] Appointment shows: doctor name, date, time, status

### 2.5 Prevent Double Booking
- [ ] After booking a time slot, that slot is not available for re-booking
- [ ] System shows error if trying to book same slot again
- [ ] Can book different time slots with same doctor
- [ ] Can book different doctors on same date

### 2.6 View Appointments
- [ ] Can view all booked appointments
- [ ] Each appointment shows complete details
- [ ] Upcoming appointments sorted correctly by date
- [ ] Past appointments remain visible
- [ ] Can cancel appointment (if feature exists)
- [ ] Cancellation is confirmed before removal

### 2.7 Dashboard Refresh
- [ ] Can refresh the page (F5)
- [ ] After refresh, appointments are still visible
- [ ] No duplicate appointments after refresh
- [ ] No increased memory usage after refresh

### 2.8 Patient Cleanup Verification
- [ ] No "Consultation" menu or section
- [ ] No "Video Meeting" buttons
- [ ] No "Book Video Call" options
- [ ] No diet, food, or nutrition sections
- [ ] Dashboard is focused only on appointment booking and management

---

## 3. SUPERADMIN FLOW

### 3.1 Admin Authentication
- [ ] Can access login page
- [ ] Can login with admin/superadmin credentials
- [ ] After login, redirected to admin dashboard
- [ ] Admin dashboard loads without errors
- [ ] Dashboard title shows "Admin" or "SuperAdmin"
- [ ] Logout button works

### 3.2 Dashboard Initial Load
- [ ] Dashboard page loads in < 3 seconds
- [ ] All admin sections visible (users, doctors, patients management)
- [ ] No 404 errors in console
- [ ] No undefined variable errors
- [ ] Page responsive on different screen sizes

### 3.3 User Management
- [ ] Can view list of all users
- [ ] User list shows: ID, name, email, role, status
- [ ] Can search/filter users
- [ ] Can view user details
- [ ] Can edit user (if allowed)
- [ ] Can deactivate/activate user (if allowed)
- [ ] User list updates after changes

### 3.4 Doctor Management
- [ ] Can view list of all doctors
- [ ] Each doctor shows: name, email, specialization, status
- [ ] Can view doctor details
- [ ] Can deactivate/activate doctors
- [ ] Can view doctor's appointments
- [ ] Doctor changes reflect in patient's doctor list

### 3.5 Patient Management
- [ ] Can view list of all patients
- [ ] Each patient shows: name, email, registration date, status
- [ ] Can view patient details
- [ ] Can view patient's appointments
- [ ] Can deactivate/activate patients
- [ ] Patient list is accurate

### 3.6 Role Verification (Removed Roles)
- [ ] No "clinic_staff" role in user role dropdown
- [ ] No "dietitian" role in user role dropdown
- [ ] No "nutritionist" role in user role dropdown
- [ ] Existing users with removed roles should not appear or are marked as legacy
- [ ] Cannot create new users with removed roles

### 3.7 System Monitoring
- [ ] Can view system health/status
- [ ] Can see appointment statistics
- [ ] Can view recent activities or audit logs
- [ ] System status shows normal operation

### 3.8 Admin Cleanup Verification
- [ ] No "Clinic Management" section
- [ ] No "Diet Management" section
- [ ] No "Consultation Management" section
- [ ] No "Food Database" section
- [ ] Dashboard focused on user and appointment management

---

## 4. APPOINTMENT WORKFLOW (End-to-End)

### 4.1 Complete Appointment Lifecycle
- [ ] **Step 1:** Patient books appointment with doctor
- [ ] **Step 2:** Doctor sees appointment in queue
- [ ] **Step 3:** Doctor marks appointment as "Started"
- [ ] **Step 4:** Doctor marks appointment as "Completed"
- [ ] **Step 5:** Patient sees appointment status as "Completed"
- [ ] **Step 6:** Appointment history preserved for both

### 4.2 Multiple Appointments
- [ ] Can book multiple appointments
- [ ] Each appointment is independent
- [ ] No mixing of appointment data
- [ ] Can manage multiple doctors simultaneously
- [ ] Can manage multiple patients simultaneously

### 4.3 Appointment Cancellation (if supported)
- [ ] Can cancel upcoming appointment
- [ ] Cancellation removes it from doctor's queue
- [ ] Slot becomes available again for other patients
- [ ] Confirmation required before cancellation

---

## 5. ERROR HANDLING & CONSOLE TESTING

### 5.1 Browser Console Check (F12 → Console Tab)
During all testing above, verify:
- [ ] **No 404 errors** - check for "404 Not Found"
- [ ] **No socket errors** - check for "socket" errors or connection failures
- [ ] **No undefined errors** - no "Cannot read property of undefined"
- [ ] **No React warnings** - no "Warning: useEffect has missing dependencies"
- [ ] **No infinite renders** - no repeated render warnings
- [ ] **No authentication errors** - no 401 or 403 errors
- [ ] **No API timeout errors** - no fetch timeout messages
- [ ] **No CORS errors** - no "Access-Control-Allow" errors
- [ ] **No memory leak indicators** - no "retainedObjects" or leak warnings

### 5.2 Network Tab Check (F12 → Network Tab)
- [ ] All API calls return 2xx or 3xx status codes (no 4xx/5xx)
- [ ] No failed requests (red text)
- [ ] API response times reasonable (< 2 seconds typically)
- [ ] No repeated/duplicate requests
- [ ] No unnecessary polling requests
- [ ] Socket.IO connection shows "101 WebSocket Upgrade"

### 5.3 Performance Checks
- [ ] Page loads in < 3 seconds
- [ ] No lag when clicking buttons
- [ ] No freezing when data loads
- [ ] Smooth transitions and animations
- [ ] CPU usage normal (not spiking)
- [ ] Memory usage stable (not continuously increasing)

### 5.4 Date & Time Validation
- [ ] All dates display in consistent format
- [ ] No "Invalid Date" messages
- [ ] Time zones handled correctly
- [ ] 24-hour time format consistent
- [ ] No date conversion errors

---

## 6. MOBILE RESPONSIVENESS

### 6.1 Mobile Layout (Test on small screen or mobile device)
- [ ] Doctor dashboard responsive on mobile
- [ ] Patient dashboard responsive on mobile
- [ ] Admin dashboard responsive on mobile
- [ ] All buttons clickable (not too small)
- [ ] Forms usable on mobile
- [ ] No horizontal scroll needed

### 6.2 Tablet Layout
- [ ] All features work on tablet screen size
- [ ] Layout properly adjusted for tablet
- [ ] Touch interactions work smoothly

---

## 7. FINAL VALIDATION CHECKLIST

### Before Committing to Production:
- [ ] All Doctor Flow tests passed
- [ ] All Patient Flow tests passed
- [ ] All SuperAdmin Flow tests passed
- [ ] Appointment Workflow end-to-end works
- [ ] No console errors detected
- [ ] No network errors detected
- [ ] Mobile responsive tests passed
- [ ] Date/time formatting correct
- [ ] No removed modules showing up
- [ ] System performs well (no memory leaks)
- [ ] Logout and session handling works
- [ ] Documentation updated (if needed)

---

## TEST SUMMARY

| Category | Status | Notes |
|----------|--------|-------|
| Doctor Flow | [ ] Pass [ ] Fail | ________________ |
| Patient Flow | [ ] Pass [ ] Fail | ________________ |
| Admin Flow | [ ] Pass [ ] Fail | ________________ |
| Error Handling | [ ] Pass [ ] Fail | ________________ |
| Performance | [ ] Pass [ ] Fail | ________________ |
| Mobile | [ ] Pass [ ] Fail | ________________ |

**Overall Status:** [ ] READY FOR PRODUCTION [ ] NEEDS FIXES

**Issues Found:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Fixes Applied:**
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

**Signed Off By:** ___________________  
**Date:** ___________________
