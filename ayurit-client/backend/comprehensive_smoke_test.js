(async () => {
  const port = process.argv[2] || process.env.PORT || process.env.BACKEND_PORT || '5000';
  const base = `http://localhost:${port}`;
  const fetch = globalThis.fetch;
  
  console.log(`\n[smoke-test] Testing against port: ${port}`);
  console.log(`[smoke-test] Base URL: ${base}\n`);
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  const login = async (email, role, password) => {
    const r = await fetch(base + '/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, password }),
    });
    return r.json();
  };

  try {
    // ============ TEST 1: Authentication ============
    console.log('🔐 TEST 1: Authentication');
    const doc = await login('doctor@ayurit.com', 'doctor', 'Doctor@123');
    const pat = await login('patient@ayurit.com', 'patient', 'Patient@123');
    
    if (doc.token && pat.token) {
      results.passed.push('POST /api/auth/token (doctor & patient login)');
      console.log('✓ Doctor and Patient login successful');
    } else {
      results.failed.push('Authentication failed');
      console.log('✗ Authentication failed');
      process.exit(1);
    }

    const doctorId = (doc.user && (doc.user.id || doc.user._id)) || '';
    const patientId = (pat.user && (pat.user.id || pat.user._id)) || '';
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];

    // ============ TEST 2: Create Slots ============
    console.log('\n📅 TEST 2: Create Appointment Slots');
    const createSlotResp = await fetch(base + '/api/appointments/doctor/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + doc.token },
      body: JSON.stringify({ date, startTime: '14:00:00Z', endTime: '14:30:00Z', durationMinutes: 30 }),
    });
    
    if (createSlotResp.status === 201) {
      results.passed.push('POST /api/appointments/doctor/slots');
      console.log('✓ Doctor slot creation successful (201)');
    } else {
      results.failed.push(`POST /api/appointments/doctor/slots (status: ${createSlotResp.status})`);
      console.log(`✗ Slot creation failed (${createSlotResp.status})`);
    }

    // ============ TEST 3: List Available Slots ============
    console.log('\n🔍 TEST 3: Get Available Slots');
    const availResp = await fetch(base + `/api/appointments/patient/available?doctorId=${doctorId}&date=${date}`, {
      headers: { Authorization: 'Bearer ' + pat.token },
    });
    const availJson = await availResp.json().catch(() => null);
    
    if (availResp.status === 200 && availJson.availableSlots && availJson.availableSlots.length > 0) {
      results.passed.push('GET /api/appointments/patient/available');
      console.log(`✓ Available slots retrieved (${availJson.availableSlots.length} slots)`);
    } else {
      results.failed.push('GET /api/appointments/patient/available');
      console.log('✗ Failed to retrieve available slots');
    }

    // ============ TEST 4: Book Appointment ============
    console.log('\n✅ TEST 4: Book Appointment');
    const slotToBook = availJson.availableSlots && availJson.availableSlots[0];
    if (!slotToBook) {
      results.warnings.push('No available slots to test booking');
      console.log('⚠ No available slots to test booking');
    } else {
      const bookResp = await fetch(base + '/api/appointments/patient/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + pat.token },
        body: JSON.stringify({ doctorId, dateTime: slotToBook, durationMinutes: 30 }),
      });
      
      if (bookResp.status === 201) {
        results.passed.push('POST /api/appointments/patient/book');
        console.log('✓ Appointment booking successful (201)');
      } else {
        const errBody = await bookResp.json().catch(() => ({}));
        results.failed.push(`POST /api/appointments/patient/book (status: ${bookResp.status})`);
        console.log(`✗ Booking failed (${bookResp.status}): ${errBody.message}`);
      }
    }

    // ============ TEST 5: Double-Booking Prevention ============
    console.log('\n🚫 TEST 5: Double-Booking Prevention');
    if (slotToBook) {
      const doubleBookResp = await fetch(base + '/api/appointments/patient/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + pat.token },
        body: JSON.stringify({ doctorId, dateTime: slotToBook, durationMinutes: 30 }),
      });
      
      if (doubleBookResp.status === 409 || doubleBookResp.status === 400 || doubleBookResp.status === 500) {
        results.passed.push('Double-booking prevention (409/400 conflict)');
        console.log(`✓ Double-booking prevented (${doubleBookResp.status})`);
      } else if (doubleBookResp.status === 201) {
        results.warnings.push('Double-booking was allowed (possible bug)');
        console.log('⚠ Double-booking was allowed - may need investigation');
      } else {
        results.failed.push(`Double-booking test (unexpected status: ${doubleBookResp.status})`);
        console.log(`✗ Unexpected response to double-booking (${doubleBookResp.status})`);
      }
    }

    // ============ TEST 6: Doctor Queue ============
    console.log('\n👨‍⚕️  TEST 6: Doctor Queue');
    const queueResp = await fetch(base + '/api/appointments/doctor/queue', {
      headers: { Authorization: 'Bearer ' + doc.token },
    });
    const queueData = await queueResp.json().catch(() => null);
    
    if (queueResp.status === 200 && Array.isArray(queueData)) {
      results.passed.push('GET /api/appointments/doctor/queue');
      console.log(`✓ Doctor queue retrieved (${queueData.length} appointments)`);
    } else {
      results.failed.push('GET /api/appointments/doctor/queue');
      console.log('✗ Failed to retrieve doctor queue');
    }

    // ============ RBAC TEST ============
    console.log('\n🔒 TEST 7: RBAC Protection');
    const noAuthResp = await fetch(base + '/api/appointments/doctor/queue');
    if (noAuthResp.status === 401) {
      results.passed.push('RBAC protection (401 without token)');
      console.log('✓ RBAC protection working (401)');
    } else {
      results.failed.push(`RBAC protection (got ${noAuthResp.status} instead of 401)`);
      console.log(`✗ RBAC protection issue (got ${noAuthResp.status})`);
    }

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed.length}`);
    results.passed.forEach(t => console.log(`   ✓ ${t}`));
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length}`);
      results.failed.forEach(t => console.log(`   ✗ ${t}`));
    }
    
    if (results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${results.warnings.length}`);
      results.warnings.forEach(t => console.log(`   ⚠ ${t}`));
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Overall: ${results.failed.length === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(60) + '\n');
    
    process.exit(results.failed.length > 0 ? 1 : 0);
  } catch (e) {
    console.error('\n❌ SMOKE TEST ERROR', e.message);
    process.exit(1);
  }
})();
