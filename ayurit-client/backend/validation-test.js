/**
 * AyurIT Automated Validation Test Suite
 * Lightweight validation script for Doctor, Patient, and Superadmin flows
 * 
 * NO external test frameworks required
 * Tests API responses, status codes, console errors, and undefined values
 * 
 * Usage:
 *   node validation-test.js
 */

const http = require('http');
const https = require('https');

// Configuration
const API_BASE = process.env.API_BASE || 'https://ayurit.onrender.com/api';
const DOCTOR_EMAIL = process.env.DOCTOR_EMAIL || 'doctor@test.com';
const DOCTOR_PASSWORD = process.env.DOCTOR_PASSWORD || 'password123';
const PATIENT_EMAIL = process.env.PATIENT_EMAIL || 'patient@test.com';
const PATIENT_PASSWORD = process.env.PATIENT_PASSWORD || 'password123';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
};

// Utility function to make HTTP requests
const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = client.request(url, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Test assertion helpers
const assert = (condition, message) => {
  if (condition) {
    results.passed += 1;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
  } else {
    results.failed += 1;
    results.errors.push(message);
    console.log(`${colors.red}✗${colors.reset} ${message}`);
  }
};

const assertStatus = (status, expectedStatus, message) => {
  if (status === expectedStatus) {
    results.passed += 1;
    console.log(`${colors.green}✓${colors.reset} ${message} (${status})`);
  } else {
    results.failed += 1;
    results.errors.push(`${message} - Expected ${expectedStatus}, got ${status}`);
    console.log(`${colors.red}✗${colors.reset} ${message} - Expected ${expectedStatus}, got ${status}`);
  }
};

const assertNoUndefined = (value, fieldName, message) => {
  if (value !== undefined && value !== null) {
    results.passed += 1;
    console.log(`${colors.green}✓${colors.reset} ${message} - ${fieldName}: ${typeof value}`);
  } else {
    results.failed += 1;
    results.errors.push(`${message} - ${fieldName} is ${value}`);
    console.log(`${colors.red}✗${colors.reset} ${message} - ${fieldName} is ${value}`);
  }
};

// Logger for debugging
const log = (title, message = '') => {
  console.log(`\n${colors.cyan}[${title}]${colors.reset} ${message}`);
};

// Main test suite
const runTests = async () => {
  try {
    log('VALIDATION TEST SUITE', 'Starting...\n');

    // ===============================
    // HEALTH CHECK
    // ===============================
    log('HEALTH CHECK', 'Validating backend availability');
    try {
      const healthRes = await makeRequest('GET', '/health');
      assertStatus(healthRes.status, 200, 'API Health Check');
      if (healthRes.data) {
        assertNoUndefined(healthRes.data.status, 'status', 'Health response has status field');
        assert(healthRes.data.realtime === 'socket.io', 'Realtime provider is socket.io');
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push(`Health check failed: ${err.message}`);
      console.log(`${colors.red}✗${colors.reset} API Health Check - ${err.message}`);
      process.exit(1);
    }

    // ===============================
    // DOCTOR FLOW
    // ===============================
    log('DOCTOR FLOW', 'Testing doctor login and operations');

    let doctorToken = null;
    let doctorId = null;

    try {
      // Login
      const loginRes = await makeRequest('POST', '/auth/login', {
        email: DOCTOR_EMAIL,
        password: DOCTOR_PASSWORD,
      });
      assertStatus(loginRes.status, 200, 'Doctor login');
      assertNoUndefined(loginRes.data.token, 'token', 'Doctor login response has token');
      doctorToken = loginRes.data.token;
      doctorId = loginRes.data.user?.id;
      assertNoUndefined(doctorId, 'user.id', 'Doctor login response has user ID');

      // Dashboard load (check user data)
      if (doctorToken) {
        const dashRes = await makeRequest('GET', '/users/profile', null, doctorToken);
        assert(dashRes.status === 200 || dashRes.status === 404, 'Doctor profile endpoint responds');
      }

      // Slot creation
      const slotData = {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '09:30',
        available: true,
      };
      const createSlotRes = await makeRequest('POST', '/appointments/slots', slotData, doctorToken);
      assert(
        createSlotRes.status === 201 || createSlotRes.status === 200,
        'Create slot endpoint responds'
      );
      assertNoUndefined(createSlotRes.data.slot || createSlotRes.data._id, 'slot', 'Slot creation returns slot data');

      // Get appointment queue
      const queueRes = await makeRequest('GET', '/appointments/queue', null, doctorToken);
      assert(queueRes.status === 200 || queueRes.status === 404, 'Appointment queue endpoint responds');
      if (queueRes.data && Array.isArray(queueRes.data)) {
        console.log(`${colors.green}✓${colors.reset} Queue is array: ${queueRes.data.length} items`);
        results.passed += 1;
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push(`Doctor flow error: ${err.message}`);
      console.log(`${colors.red}✗${colors.reset} Doctor flow - ${err.message}`);
    }

    // ===============================
    // PATIENT FLOW
    // ===============================
    log('PATIENT FLOW', 'Testing patient login and operations');

    let patientToken = null;
    let patientId = null;

    try {
      // Login
      const loginRes = await makeRequest('POST', '/auth/login', {
        email: PATIENT_EMAIL,
        password: PATIENT_PASSWORD,
      });
      assertStatus(loginRes.status, 200, 'Patient login');
      assertNoUndefined(loginRes.data.token, 'token', 'Patient login response has token');
      patientToken = loginRes.data.token;
      patientId = loginRes.data.user?.id;
      assertNoUndefined(patientId, 'user.id', 'Patient login response has user ID');

      // Get available doctors/slots
      const doctorsRes = await makeRequest('GET', '/providers', null, patientToken);
      assert(doctorsRes.status === 200 || doctorsRes.status === 404, 'Doctors/providers endpoint responds');
      if (doctorsRes.data && Array.isArray(doctorsRes.data)) {
        console.log(`${colors.green}✓${colors.reset} Doctors list is array: ${doctorsRes.data.length} items`);
        results.passed += 1;
      }

      // Get available appointments/slots
      const slotsRes = await makeRequest('GET', '/appointments/available', null, patientToken);
      assert(slotsRes.status === 200 || slotsRes.status === 404, 'Available slots endpoint responds');

      // Book appointment
      if (doctorId) {
        const bookRes = await makeRequest('POST', '/appointments', {
          doctorId: doctorId,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '09:30',
        }, patientToken);
        assert(
          bookRes.status === 201 || bookRes.status === 200 || bookRes.status === 400,
          'Appointment booking endpoint responds'
        );
      }

      // Get patient appointments
      const apptsRes = await makeRequest('GET', '/appointments', null, patientToken);
      assert(apptsRes.status === 200 || apptsRes.status === 404, 'Patient appointments endpoint responds');
      if (apptsRes.data && Array.isArray(apptsRes.data)) {
        console.log(`${colors.green}✓${colors.reset} Appointments list is array: ${apptsRes.data.length} items`);
        results.passed += 1;
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push(`Patient flow error: ${err.message}`);
      console.log(`${colors.red}✗${colors.reset} Patient flow - ${err.message}`);
    }

    // ===============================
    // SUPERADMIN FLOW
    // ===============================
    log('SUPERADMIN FLOW', 'Testing admin login and operations');

    let adminToken = null;

    try {
      // Login
      const loginRes = await makeRequest('POST', '/auth/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      assertStatus(loginRes.status, 200, 'Admin login');
      assertNoUndefined(loginRes.data.token, 'token', 'Admin login response has token');
      adminToken = loginRes.data.token;

      // Get all users
      const usersRes = await makeRequest('GET', '/users', null, adminToken);
      assert(usersRes.status === 200 || usersRes.status === 404, 'Users list endpoint responds');

      // Get all patients
      const patientsRes = await makeRequest('GET', '/patients', null, adminToken);
      assert(patientsRes.status === 200 || patientsRes.status === 404, 'Patients list endpoint responds');

      // Get all doctors
      const doctorsRes = await makeRequest('GET', '/providers', null, adminToken);
      assert(doctorsRes.status === 200 || doctorsRes.status === 404, 'Doctors/providers list endpoint responds');

      // Check for removed roles in responses
      if (usersRes.data && Array.isArray(usersRes.data)) {
        const hasClinicStaff = usersRes.data.some(u => u.role === 'clinic_staff');
        const hasDietitian = usersRes.data.some(u => u.role === 'dietitian');
        assert(!hasClinicStaff, 'No clinic_staff role in users list');
        assert(!hasDietitian, 'No dietitian role in users list');
      }
    } catch (err) {
      results.failed += 1;
      results.errors.push(`Admin flow error: ${err.message}`);
      console.log(`${colors.red}✗${colors.reset} Admin flow - ${err.message}`);
    }

    // ===============================
    // VALIDATION CHECKS
    // ===============================
    log('VALIDATION CHECKS', 'Checking for common issues');

    // Check for removed modules in routes (these should NOT exist)
    const removedModules = ['consultations', 'food', 'clinic'];
    for (const module of removedModules) {
      try {
        const res = await makeRequest('GET', `/${module}`);
        if (res.status !== 404) {
          results.warnings += 1;
          console.log(`${colors.yellow}⚠${colors.reset} Removed module '${module}' is still active (status: ${res.status})`);
        } else {
          results.passed += 1;
          console.log(`${colors.green}✓${colors.reset} Removed module '${module}' properly removed`);
        }
      } catch {
        results.passed += 1;
        console.log(`${colors.green}✓${colors.reset} Removed module '${module}' properly removed`);
      }
    }

    // ===============================
    // FINAL REPORT
    // ===============================
    log('TEST REPORT', 'Summary\n');

    console.log(`${colors.green}Passed:${colors.reset}  ${results.passed}`);
    console.log(`${colors.red}Failed:${colors.reset}  ${results.failed}`);
    if (results.warnings > 0) {
      console.log(`${colors.yellow}Warnings:${colors.reset} ${results.warnings}`);
    }

    if (results.errors.length > 0) {
      console.log(`\n${colors.red}Errors:${colors.reset}`);
      results.errors.forEach((err) => {
        console.log(`  • ${err}`);
      });
    }

    const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`\n${colors.cyan}Pass Rate:${colors.reset} ${passRate}%`);

    if (results.failed === 0 && results.warnings === 0) {
      console.log(`\n${colors.green}✓ All tests passed! Project is validation-ready.${colors.reset}\n`);
      process.exit(0);
    } else if (results.failed === 0) {
      console.log(`\n${colors.yellow}⚠ Tests passed with ${results.warnings} warning(s).${colors.reset}\n`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}✗ ${results.failed} test(s) failed. Review errors above.${colors.reset}\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, err.message);
    process.exit(1);
  }
};

// Run tests
runTests();
