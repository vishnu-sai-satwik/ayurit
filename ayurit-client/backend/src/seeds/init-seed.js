/**
 * Seed Data Script for AyurIT Healthcare Platform
 * 
 * Creates test accounts and initial data for development/testing:
 * - Admin account
 * - Doctor account
 * - Patient account
 * - Sample appointments and slots
 * 
 * Usage: npm run seed (after adding to package.json)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ayurit');
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  }
};

// Define schemas inline for seed script
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'patient'], required: true },
  twoFactorEnabled: { type: Boolean, default: false },
  profile: {
    age: Number,
    gender: String,
    prakriti: String,
    chronicConds: String,
    digestion: String
  },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, default: null },  // Optional for available slots
  doctorId: { type: String, required: true, index: true },
  dateTime: { type: Date, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  status: {
    type: String,
    enum: ["available", "booked", "in-progress", "completed", "cancelled"],
    default: "available",
    index: true
  },
  reason: { type: String, default: "" },
  notes: { type: String, default: "" },
  meetingRoomId: { type: String, default: "" },
  durationMinutes: { type: Number, default: 30 },
  requestedBy: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'appointments' });

const Appointment = mongoose.model('Appointment', appointmentSchema);

// Seed function
const seedDatabase = async () => {
  try {
    console.log('\n🌱 Starting seed data initialization...\n');

    // Clear existing test data
    console.log('🗑️  Clearing existing test data...');
    await User.deleteMany({ email: { $in: ['admin@ayurit.com', 'doctor@ayurit.com', 'patient@ayurit.com'] } });
    console.log('✓ Cleaned up test users');

    // Hash passwords
    const hashedAdminPwd = await bcrypt.hash('Admin@123', 10);
    const hashedDoctorPwd = await bcrypt.hash('Doctor@123', 10);
    const hashedPatientPwd = await bcrypt.hash('Patient@123', 10);

    // Create admin account
    console.log('\n👨‍💼 Creating admin account...');
    const admin = await User.create({
      email: 'admin@ayurit.com',
      passwordHash: hashedAdminPwd,
      name: 'Admin User',
      role: 'admin',
      twoFactorEnabled: false,
      profile: {}
    });
    console.log(`✓ Admin created: ${admin.email} (Password: Admin@123)`);

    // Create doctor account
    console.log('\n👨‍⚕️  Creating doctor account...');
    const doctor = await User.create({
      email: 'doctor@ayurit.com',
      passwordHash: hashedDoctorPwd,
      name: 'Dr. Sharma',
      role: 'doctor',
      twoFactorEnabled: false,
      profile: {
        specialization: 'Ayurvedic Medicine',
        experience: '10 years'
      }
    });
    console.log(`✓ Doctor created: ${doctor.email} (Password: Doctor@123)`);

    // Create patient account
    console.log('\n👨‍🔬 Creating patient account...');
    const patient = await User.create({
      email: 'patient@ayurit.com',
      passwordHash: hashedPatientPwd,
      name: 'Rajesh Kumar',
      role: 'patient',
      twoFactorEnabled: false,
      profile: {
        age: 35,
        gender: 'Male',
        prakriti: 'Pitta-Vata',
        chronicConds: 'Digestive sensitivity',
        digestion: 'Moderate'
      }
    });
    console.log(`✓ Patient created: ${patient.email} (Password: Patient@123)`);

    // Create sample appointment slots for tomorrow
    console.log('\n📅 Creating sample appointment slots...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const slots = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let mins = 0; mins < 60; mins += 30) {
        const startTime = new Date(`${tomorrowStr}T${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00Z`);
        const endTime = new Date(startTime.getTime() + 30 * 60000);

        slots.push({
          patientId: null,  // Null means it's available
          doctorId: doctor._id.toString(),
          dateTime: startTime,
          startAt: startTime,
          endAt: endTime,
          status: 'available',
          reason: 'Available slot',
          durationMinutes: 30,
          requestedBy: doctor._id.toString()
        });
      }
    }

    await Appointment.insertMany(slots);
    console.log(`✓ Created ${slots.length} available appointment slots for tomorrow (9 AM - 5 PM)`);

    // Create a booked appointment (for testing)
    console.log('\n✓ Creating a booked appointment sample...');
    const bookedTime = new Date(`${tomorrowStr}T10:00:00Z`);
    const bookedEndTime = new Date(bookedTime.getTime() + 30 * 60000);

    const bookedAppointment = await Appointment.create({
      patientId: patient._id.toString(),
      doctorId: doctor._id.toString(),
      dateTime: bookedTime,
      startAt: bookedTime,
      endAt: bookedEndTime,
      status: 'booked',
      reason: 'General consultation - Digestion',
      notes: 'Patient concerned about digestive issues',
      durationMinutes: 30,
      requestedBy: patient._id.toString()
    });
    console.log(`✓ Sample booked appointment created (Tomorrow at 10:00 AM)`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ SEED DATA INITIALIZATION COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📝 Test Accounts:\n');
    console.log('Admin:');
    console.log('  Email: admin@ayurit.com');
    console.log('  Password: Admin@123\n');
    console.log('Doctor:');
    console.log('  Email: doctor@ayurit.com');
    console.log('  Password: Doctor@123\n');
    console.log('Patient:');
    console.log('  Email: patient@ayurit.com');
    console.log('  Password: Patient@123\n');
    console.log('📅 Appointments:');
    console.log(`  ${slots.length} available slots created for tomorrow`);
    console.log('  1 booked appointment at 10:00 AM\n');
    console.log('🧪 Testing Instructions:');
    console.log('  1. Login as doctor@ayurit.com to create/manage slots');
    console.log('  2. Login as patient@ayurit.com to book appointments');
    console.log('  3. Check "Appointments" tab in respective dashboards\n');

  } catch (err) {
    console.error('\n✗ Seed operation failed:', err.message);
    console.error(err);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
};

// Run seed
connectDB().then(() => seedDatabase());
