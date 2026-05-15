(async () => {
  const port = process.argv[2] || process.env.PORT || process.env.BACKEND_PORT || '5000';
  const base = `http://localhost:${port}`;
  const fetch = globalThis.fetch;
  
  console.log(`[smoke-test] Testing against port: ${port}`);
  console.log(`[smoke-test] Base URL: ${base}`);

  const login = async (email, role, password) => {
    const r = await fetch(base + '/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, password }),
    });
    return r.json();
  };

  try {
    const doc = await login('doctor@ayurit.com', 'doctor', 'Doctor@123');
    console.log('DOCTOR LOGIN', doc);
    const pat = await login('patient@ayurit.com', 'patient', 'Patient@123');
    console.log('PATIENT LOGIN', pat);

    const doctorId = (doc.user && (doc.user.id || doc.user._id || doc.user._id)) || '';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];

    // Create slot as doctor
    const createSlotResp = await fetch(base + '/api/appointments/doctor/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + doc.token },
      body: JSON.stringify({ date, startTime: '14:00:00Z', endTime: '14:30:00Z', durationMinutes: 30 }),
    });
    console.log('CREATE_SLOT_STATUS', createSlotResp.status, await createSlotResp.json().catch(() => null));

    // List available slots as patient
    const availResp = await fetch(base + `/api/appointments/patient/available?doctorId=${doctorId}&date=${date}`, {
      headers: { Authorization: 'Bearer ' + pat.token },
    });
    const availJson = await availResp.json().catch(() => null);
    console.log('AVAILABLE', JSON.stringify(availJson));

    const slot = (availJson && (availJson.availableSlots && availJson.availableSlots[0])) || (availJson && (availJson.slots && availJson.slots[0]));
    if (!slot) {
      console.log('No slot to book');
      return;
    }

    // Book as patient
    const bookResp = await fetch(base + '/api/appointments/patient/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + pat.token },
      body: JSON.stringify({ doctorId, dateTime: slot, durationMinutes: 30 }),
    });
    console.log('BOOK_STATUS', bookResp.status, await bookResp.json().catch(() => null));

    // Check doctor queue
    const queueResp = await fetch(base + '/api/appointments/doctor/queue', {
      headers: { Authorization: 'Bearer ' + doc.token },
    });
    console.log('DOCTOR_QUEUE', JSON.stringify(await queueResp.json().catch(() => null)));
  } catch (e) {
    console.error('SMOKE TEST ERROR', e);
  }
})();
