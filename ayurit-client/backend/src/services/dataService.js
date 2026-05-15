import mongoose from "mongoose";
import { getActiveProvider, getPgPool } from "../config/db.js";
import { DietPlanModel } from "../models/dietPlan.js";
import { PrescriptionModel } from "../models/prescription.js";
import { AppointmentModel } from "../models/appointment.js";
import { AdherenceModel } from "../models/adherence.js";
import { ReportModel } from "../models/report.js";
import { NotificationModel } from "../models/notification.js";
import {
  serializeChart,
  serializeDietPlan,
  serializeFood,
  serializeList,
  serializePatient,
  serializeUser,
  serializeEntity
} from "../utils/serialization.js";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "patient" },
    encryptedNotes: { type: String, default: "" }
  },
  { timestamps: true }
);

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fats: { type: Number, required: true }
  },
  { timestamps: true }
);

const chartSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    metric: { type: String, required: true },
    value: { type: Number, required: true },
    loggedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, default: "patient" },
    passwordHash: { type: String, required: true },
    twoFactorEnabled: { type: Boolean, default: false },
    status: { type: String, default: "active", index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date, default: null },
    lastActiveAt: { type: Date, default: null },
    profile: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, collection: "users" }
);

const PatientModel = mongoose.models.Patient || mongoose.model("Patient", patientSchema);
const FoodModel = mongoose.models.Food || mongoose.model("Food", foodSchema);
const ChartModel = mongoose.models.Chart || mongoose.model("Chart", chartSchema);
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

const normalizePatient = (row) => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  role: row.role,
  encryptedNotes: row.encrypted_notes || ""
});

const normalizeFood = (row) => ({
  id: String(row.id),
  name: row.name,
  calories: Number(row.calories),
  protein: Number(row.protein),
  carbs: Number(row.carbs),
  fats: Number(row.fats)
});

const normalizeChart = (row) => ({
  id: String(row.id),
  patientId: String(row.patient_id),
  metric: row.metric,
  value: Number(row.value),
  loggedAt: row.logged_at
});

const normalizeUser = (row) => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  role: row.role,
  passwordHash: row.password_hash,
  twoFactorEnabled: Boolean(row.two_factor_enabled),
  status: row.status || "active",
  isActive: row.is_active !== undefined ? Boolean(row.is_active) : true,
  lastLoginAt: row.last_login_at || null,
  lastActiveAt: row.last_active_at || null,
  profile: row.profile_json ? JSON.parse(row.profile_json) : {}
});

const memory = {
  patients: [],
  foods: [],
  charts: [],
  dietPlans: [],
  users: [],
  consultations: [],
  prescriptions: [],
  appointments: [],
  adherences: [],
  reports: [],
  notifications: [],
  providerAvailability: {},
  ids: {
    patient: 1,
    food: 1,
    chart: 1,
    user: 1,
    dietPlan: 1,
    notification: 1
  }
};

// Seed in-memory store with sample data to ensure dashboards are not blank in development
const ensureSeeded = () => {
  if (memory.patients.length || memory.foods.length || memory.charts.length) return;

  const samplePatients = [
    { id: '1', name: 'Ravi Kumar', email: 'ravi@example.com', role: 'patient', encryptedNotes: '', profile: { age: 32, gender: 'male', prakriti: 'vata', chronicConds: 'None', digestion: 'Good' }, createdAt: new Date().toISOString() },
    { id: '2', name: 'Sneha Patel', email: 'sneha@example.com', role: 'patient', encryptedNotes: '', profile: { age: 28, gender: 'female', prakriti: 'pitta', chronicConds: 'Acidity', digestion: 'Moderate' }, createdAt: new Date().toISOString() }
  ];

  const sampleFoods = [
    { id: '1', name: 'Cooked Rice', calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    { id: '2', name: 'Moong Dal', calories: 105, protein: 7, carbs: 14, fats: 0.5 }
  ];

  const sampleCharts = [
    { id: '1', patientId: '1', metric: 'weight', value: 70, loggedAt: new Date().toISOString() },
    { id: '2', patientId: '2', metric: 'weight', value: 58, loggedAt: new Date().toISOString() }
  ];

  memory.patients = samplePatients;
  memory.foods = sampleFoods;
  memory.charts = sampleCharts;
  memory.ids.patient = 3;
  memory.ids.food = 3;
  memory.ids.chart = 3;
};

export const DataService = {
  async createPatient(payload) {
    const provider = getActiveProvider();

    console.log("[data.patients.create] Requested", {
      provider,
      email: payload?.email,
      name: payload?.name
    });

    if (provider === "mongodb") {
      try {
        const created = await PatientModel.create(payload);
        const serialized = serializePatient(created);
        console.log("[data.patients.create] MongoDB save succeeded", {
          id: serialized?.id,
          email: serialized?.email,
          collection: PatientModel.collection?.name
        });
        return serialized;
      } catch (error) {
        console.error("[data.patients.create] MongoDB save failed", {
          email: payload?.email,
          code: error?.code,
          name: error?.name,
          message: error?.message
        });
        throw error;
      }
    }

    if (provider === "memory") {
      const patient = {
        id: String(memory.ids.patient++),
        name: payload.name,
        email: payload.email,
        role: payload.role || "patient",
        encryptedNotes: payload.encryptedNotes || ""
      };
      memory.patients.unshift(patient);
      console.log("[data.patients.create] Memory save succeeded", {
        id: patient.id,
        email: patient.email
      });
      return patient;
    }

    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO patients(name, email, role, encrypted_notes)
       VALUES($1, $2, $3, $4)
       RETURNING *`,
      [payload.name, payload.email, payload.role || "patient", payload.encryptedNotes || ""]
    );
    const normalized = normalizePatient(result.rows[0]);
    console.log("[data.patients.create] PostgreSQL save succeeded", {
      id: normalized?.id,
      email: normalized?.email
    });
    return normalized;
  },

  async listPatients() {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      return serializeList(await PatientModel.find().lean());
    }

    if (provider === "memory") {
        ensureSeeded();
        return [...memory.patients];
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM patients ORDER BY id DESC");
    return result.rows.map(normalizePatient);
  },

  async createFood(payload) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      return serializeFood(await FoodModel.create(payload));
    }

    if (provider === "memory") {
      const food = {
        id: String(memory.ids.food++),
        name: payload.name,
        calories: Number(payload.calories),
        protein: Number(payload.protein),
        carbs: Number(payload.carbs),
        fats: Number(payload.fats)
      };
      memory.foods.unshift(food);
      return food;
    }

    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO foods(name, calories, protein, carbs, fats)
       VALUES($1, $2, $3, $4, $5)
       RETURNING *`,
      [payload.name, payload.calories, payload.protein, payload.carbs, payload.fats]
    );
    return normalizeFood(result.rows[0]);
  },

  async listFoods() {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      return serializeList(await FoodModel.find().lean());
    }

    if (provider === "memory") {
        ensureSeeded();
        return [...memory.foods];
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM foods ORDER BY id DESC");
    return result.rows.map(normalizeFood);
  },

  async createChart(payload) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      return serializeChart(await ChartModel.create(payload));
    }

    if (provider === "memory") {
      const chart = {
        id: String(memory.ids.chart++),
        patientId: String(payload.patientId),
        metric: payload.metric,
        value: Number(payload.value),
        loggedAt: new Date().toISOString()
      };
      memory.charts.unshift(chart);
      return chart;
    }

    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO charts(patient_id, metric, value, logged_at)
       VALUES($1, $2, $3, NOW())
       RETURNING *`,
      [payload.patientId, payload.metric, payload.value]
    );
    return normalizeChart(result.rows[0]);
  },

  async getChartById(chartId) {
    const provider = getActiveProvider();
    const id = String(chartId || "");

    if (!id) return null;

    if (provider === "mongodb") {
      return serializeEntity(await ChartModel.findById(id).lean());
    }

    if (provider === "memory") {
      ensureSeeded();
      return memory.charts.find((item) => String(item.id) === id) || null;
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM charts WHERE id = $1 LIMIT 1", [id]);
    return result.rows[0] ? normalizeChart(result.rows[0]) : null;
  },

  async updateChart(chartId, patch) {
    const provider = getActiveProvider();
    const id = String(chartId || "");

    if (!id) return null;

    if (provider === "mongodb") {
      const updated = await ChartModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
      return serializeEntity(updated);
    }

    if (provider === "memory") {
      const idx = memory.charts.findIndex((item) => String(item.id) === id);
      if (idx === -1) return null;

      memory.charts[idx] = {
        ...memory.charts[idx],
        ...patch,
        value: patch.value !== undefined ? Number(patch.value) : Number(memory.charts[idx].value),
        loggedAt: new Date().toISOString()
      };

      return memory.charts[idx];
    }

    const pool = getPgPool();
    const existing = await pool.query("SELECT * FROM charts WHERE id = $1 LIMIT 1", [id]);
    if (!existing.rows[0]) return null;

    const nextMetric = patch.metric ?? existing.rows[0].metric;
    const nextValue = patch.value ?? existing.rows[0].value;

    const result = await pool.query(
      `UPDATE charts
       SET metric = $1, value = $2, logged_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [nextMetric, nextValue, id]
    );

    return result.rows[0] ? normalizeChart(result.rows[0]) : null;
  },

  async listCharts(patientId) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      const query = patientId ? { patientId } : {};
      return serializeList(await ChartModel.find(query).sort({ loggedAt: -1 }).lean());
    }

    if (provider === "memory") {
        ensureSeeded();
        const data = patientId
          ? memory.charts.filter((item) => item.patientId === String(patientId))
          : memory.charts;
        return [...data];
    }

    const pool = getPgPool();
    if (patientId) {
      const result = await pool.query(
        "SELECT * FROM charts WHERE patient_id = $1 ORDER BY logged_at DESC",
        [patientId]
      );
      return result.rows.map(normalizeChart);
    }

    const result = await pool.query("SELECT * FROM charts ORDER BY logged_at DESC");
    return result.rows.map(normalizeChart);
  },

  async createUser(payload) {
    const provider = getActiveProvider();

    console.log("[data.users.create] Requested", {
      provider,
      email: payload?.email,
      role: payload?.role
    });

    if (provider === "mongodb") {
      try {
        const created = await UserModel.create({
          status: "active",
          isActive: true,
          lastLoginAt: null,
          lastActiveAt: null,
          ...payload
        });
        const serialized = serializeUser(created);
        console.log("[data.users.create] MongoDB save succeeded", {
          id: serialized?.id,
          email: serialized?.email,
          collection: UserModel.collection?.name
        });
        return serialized;
      } catch (error) {
        console.error("[data.users.create] MongoDB save failed", {
          email: payload?.email,
          role: payload?.role,
          code: error?.code,
          name: error?.name,
          message: error?.message
        });
        throw error;
      }
    }

    if (provider === "memory") {
      const user = {
        id: String(memory.ids.user++),
        name: payload.name,
        email: payload.email,
        role: payload.role || "patient",
        passwordHash: payload.passwordHash,
        twoFactorEnabled: Boolean(payload.twoFactorEnabled),
        status: payload.status || "active",
        isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
        lastLoginAt: payload.lastLoginAt || null,
        lastActiveAt: payload.lastActiveAt || null,
        profile: payload.profile || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memory.users.unshift(user);
      return user;
    }

    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO users(name, email, role, password_hash, two_factor_enabled, profile_json)
       VALUES($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        payload.name,
        payload.email,
        payload.role || "patient",
        payload.passwordHash,
        Boolean(payload.twoFactorEnabled),
        JSON.stringify(payload.profile || {})
      ]
    );
    return normalizeUser(result.rows[0]);
  },

  async listUsers(query = {}) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      const filter = {};
      if (query.role) {
        const normalizedRole = String(query.role).trim();
        if (normalizedRole) {
          filter.role = normalizedRole;
        }
      }
      if (query.status) {
        filter.status = String(query.status);
      }
      if (query.search) {
        const search = String(query.search).trim();
        if (search) {
          filter.$or = [
            { name: new RegExp(search, "i") },
            { email: new RegExp(search, "i") }
          ];
        }
      }

      const page = Math.max(1, Number(query.page || 1));
      const limit = Math.max(1, Math.min(100, Number(query.limit || 50)));

      if (query.page || query.limit || query.search || query.role || query.status) {
        const [items, total] = await Promise.all([
          UserModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
          UserModel.countDocuments(filter)
        ]);

        return {
          items: serializeList(items),
          total,
          page,
          limit
        };
      }

      return serializeList(await UserModel.find().sort({ createdAt: -1 }).lean());
    }

    if (provider === "memory") {
      let items = [...memory.users];
      if (query.role) {
        items = items.filter((user) => String(user.role) === String(query.role));
      }
      if (query.status) {
        items = items.filter((user) => String(user.status || "active") === String(query.status));
      }
      if (query.search) {
        const search = String(query.search).toLowerCase();
        items = items.filter((user) => [user.name, user.email].some((value) => String(value || "").toLowerCase().includes(search)));
      }
      if (query.page || query.limit || query.search || query.role || query.status) {
        const page = Math.max(1, Number(query.page || 1));
        const limit = Math.max(1, Math.min(100, Number(query.limit || 50)));
        const startIndex = (page - 1) * limit;
        return {
          items: items.slice(startIndex, startIndex + limit),
          total: items.length,
          page,
          limit
        };
      }
      return items;
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM users ORDER BY id DESC");
    return result.rows.map(normalizeUser);
  },

  async findUserByEmail(email) {
    const provider = getActiveProvider();
    const safeEmail = String(email || "").toLowerCase();

    if (provider === "mongodb") {
      return serializeUser(await UserModel.findOne({ email: safeEmail }).lean());
    }

    if (provider === "memory") {
      return memory.users.find((item) => item.email.toLowerCase() === safeEmail) || null;
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1", [safeEmail]);
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  },

  async findUserById(userId) {
    const provider = getActiveProvider();
    const id = String(userId || "");

    if (provider === "mongodb") {
      return serializeUser(await UserModel.findById(id).lean());
    }

    if (provider === "memory") {
      return memory.users.find((item) => item.id === id) || null;
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM users WHERE id::text = $1 LIMIT 1", [id]);
    return result.rows[0] ? normalizeUser(result.rows[0]) : null;
  },

  async updateUser(idOrEmail, payload) {
    const identifier = String(idOrEmail || "");
    const existing = identifier.includes("@")
      ? await this.findUserByEmail(identifier)
      : await this.findUserById(identifier);

    if (!existing) {
      throw new Error("User not found");
    }

    const provider = getActiveProvider();
    const next = {
      ...existing,
      ...payload,
      profile: {
        ...(existing.profile || {}),
        ...(payload.profile || {})
      }
    };
    if (payload.status) {
      next.status = String(payload.status);
      next.isActive = String(payload.status).toLowerCase() !== "inactive";
    }
    if (payload.isActive !== undefined) {
      next.isActive = Boolean(payload.isActive);
      next.status = next.isActive ? "active" : "inactive";
    }
    if (payload.lastLoginAt) next.lastLoginAt = payload.lastLoginAt;
    if (payload.lastActiveAt) next.lastActiveAt = payload.lastActiveAt;

    if (provider === "mongodb") {
      const updated = await UserModel.findByIdAndUpdate(existing._id || existing.id, next, {
        new: true,
        runValidators: true
      }).lean();
      return serializeUser(updated);
    }

    if (provider === "memory") {
      const index = memory.users.findIndex((item) => item.id === String(existing.id));
      memory.users[index] = {
        ...memory.users[index],
        ...payload,
        profile: next.profile,
        status: next.status || memory.users[index].status || "active",
        isActive: next.isActive !== undefined ? next.isActive : true,
        updatedAt: new Date().toISOString()
      };
      return memory.users[index];
    }

    const pool = getPgPool();
    const result = await pool.query(
      `UPDATE users
       SET name = $1,
           role = $2,
           password_hash = $3,
           two_factor_enabled = $4,
           status = $5,
           is_active = $6,
           last_login_at = $7,
           last_active_at = $8,
           profile_json = $9
       WHERE id::text = $10
       RETURNING *`,
      [
        next.name,
        next.role,
        next.passwordHash,
        Boolean(next.twoFactorEnabled),
        next.status || "active",
        Boolean(next.isActive !== undefined ? next.isActive : true),
        next.lastLoginAt || null,
        next.lastActiveAt || null,
        JSON.stringify(next.profile || {}),
        String(existing.id)
      ]
    );
    return normalizeUser(result.rows[0]);
  },

  async deleteUser(userId) {
    const existing = await this.findUserById(userId);
    if (!existing) {
      throw new Error("User not found");
    }

    const provider = getActiveProvider();
    if (provider === "mongodb") {
      await UserModel.findByIdAndDelete(existing._id || existing.id);
      return existing;
    }

    if (provider === "memory") {
      memory.users = memory.users.filter((item) => item.id !== String(existing.id));
      return existing;
    }

    const pool = getPgPool();
    await pool.query("DELETE FROM users WHERE id::text = $1", [String(existing.id)]);
    return existing;
  },

  async createDietPlan(payload) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      const created = await DietPlanModel.create(payload);
      return serializeDietPlan(created);
    }

    if (provider === "memory") {
      const dietPlan = {
        id: String(memory.ids.dietPlan++),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memory.dietPlans.unshift(dietPlan);
      return dietPlan;
    }

    const pool = getPgPool();
    const result = await pool.query(
      `INSERT INTO diet_plans(patient_id, patient_name, patient_email, generated_by, version, parent_plan_id, input_json, generated_diet_json, recommendations_json, foods_to_avoid_json, hydration_guidance, lifestyle_recommendations_json, meal_timings_json, status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        payload.patientId,
        payload.patientName || "",
        payload.patientEmail || "",
        payload.generatedBy || "gemini",
        payload.version || 1,
        payload.parentPlanId || null,
        JSON.stringify(payload.input || {}),
        JSON.stringify(payload.generatedDiet || {}),
        JSON.stringify(payload.recommendations || {}),
        JSON.stringify(payload.foodsToAvoid || []),
        payload.hydrationGuidance || "",
        JSON.stringify(payload.lifestyleRecommendations || []),
        JSON.stringify(payload.mealTimings || {}),
        payload.status || "active"
      ]
    );
    return serializeDietPlan(result.rows[0]);
  },

  async listDietPlans(patientId) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      const query = patientId ? { patientId: String(patientId) } : {};
      return serializeList(await DietPlanModel.find(query).sort({ createdAt: -1 }).lean());
    }

    if (provider === "memory") {
      const data = patientId
        ? memory.dietPlans.filter((item) => String(item.patientId) === String(patientId))
        : memory.dietPlans;
      return [...data];
    }

    const pool = getPgPool();
    const result = patientId
      ? await pool.query("SELECT * FROM diet_plans WHERE patient_id = $1 ORDER BY created_at DESC", [patientId])
      : await pool.query("SELECT * FROM diet_plans ORDER BY created_at DESC");
    return result.rows.map((row) => serializeDietPlan(row));
  },

  async findDietPlanById(planId) {
    const provider = getActiveProvider();
    const id = String(planId || "");

    if (provider === "mongodb") {
      return serializeDietPlan(await DietPlanModel.findById(id).lean());
    }

    if (provider === "memory") {
      return memory.dietPlans.find((item) => item.id === id) || null;
    }

    const pool = getPgPool();
    const result = await pool.query("SELECT * FROM diet_plans WHERE id::text = $1 LIMIT 1", [id]);
    return result.rows[0] ? serializeDietPlan(result.rows[0]) : null;
  },

  // ---------- Prescriptions / Appointments / Adherence / Reports ----------
  async createPrescription(payload) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      return serializeList([await PrescriptionModel.create(payload)])[0];
    }
    if (provider === "memory") {
      const p = { id: String(memory.ids.prescription = (memory.ids.prescription || 1)), ...payload, issuedAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      memory.prescriptions.unshift(p);
      memory.ids.prescription = memory.ids.prescription + 1;
      return p;
    }
    throw new Error('Prescription creation not implemented for this DB provider');
  },

  async listPrescriptions(patientId) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const q = patientId ? { patientId: String(patientId) } : {};
      return serializeList(await PrescriptionModel.find(q).sort({ createdAt: -1 }).lean());
    }
    if (provider === "memory") {
      return patientId ? memory.prescriptions.filter((p) => String(p.patientId) === String(patientId)) : [...memory.prescriptions];
    }
    throw new Error('Listing prescriptions not implemented for this DB provider');
  },

  async createAppointment(payload) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      return serializeList([await AppointmentModel.create(payload)])[0];
    }
    if (provider === "memory") {
      const a = { id: String(memory.ids.appointment = (memory.ids.appointment || 1)), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      memory.appointments.unshift(a);
      memory.ids.appointment = memory.ids.appointment + 1;
      return a;
    }
    throw new Error('Appointment creation not implemented for this DB provider');
  },

  async listAppointments(filter = {}) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const q = {};
      if (filter.patientId) q.patientId = String(filter.patientId);
      if (filter.doctorId) q.doctorId = String(filter.doctorId);
      if (filter.status) q.status = String(filter.status);
      return serializeList(await AppointmentModel.find(q).sort({ startAt: 1 }).lean());
    }
    if (provider === "memory") {
      return memory.appointments.filter((item) => {
        if (filter.patientId && String(item.patientId) !== String(filter.patientId)) return false;
        if (filter.doctorId) {
          const appointmentDoctorId = String(item.doctorId || item.providerId || "");
          if (appointmentDoctorId !== String(filter.doctorId)) return false;
        }
        if (filter.status && String(item.status) !== String(filter.status)) return false;
        return true;
      });
    }
    throw new Error('Listing appointments not implemented for this DB provider');
  },

  async updateAppointment(appointmentId, patch) {
    const provider = getActiveProvider();
    const id = String(appointmentId || "");
    if (provider === "mongodb") {
      const updated = await AppointmentModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true }).lean();
      return serializeEntity(updated);
    }
    if (provider === "memory") {
      const idx = memory.appointments.findIndex((a) => String(a.id) === id);
      if (idx === -1) throw new Error('Appointment not found');
      memory.appointments[idx] = { ...memory.appointments[idx], ...patch, updatedAt: new Date().toISOString() };
      return memory.appointments[idx];
    }
    throw new Error('Updating appointment not implemented for this DB provider');
  },

  async deleteAppointment(appointmentId) {
    const provider = getActiveProvider();
    const id = String(appointmentId || "");

    if (!id) {
      throw new Error('Appointment id is required');
    }

    if (provider === "mongodb") {
      const deleted = await AppointmentModel.findByIdAndDelete(id).lean();
      return serializeEntity(deleted);
    }

    if (provider === "memory") {
      const idx = memory.appointments.findIndex((item) => String(item.id) === id);
      if (idx === -1) return null;
      const [deleted] = memory.appointments.splice(idx, 1);
      return deleted || null;
    }

    throw new Error('Deleting appointment not implemented for this DB provider');
  },

  async createAdherence(payload) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      return serializeList([await AdherenceModel.create(payload)])[0];
    }
    if (provider === "memory") {
      const r = { id: String(memory.ids.adherence = (memory.ids.adherence || 1)), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      memory.adherences.unshift(r);
      memory.ids.adherence = memory.ids.adherence + 1;
      return r;
    }
    throw new Error('Adherence creation not implemented for this DB provider');
  },

  async listAdherence(filter = {}) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const q = {};
      if (filter.patientId) q.patientId = String(filter.patientId);
      if (filter.dietPlanId) q.dietPlanId = String(filter.dietPlanId);
      return serializeList(await AdherenceModel.find(q).sort({ date: -1 }).lean());
    }
    if (provider === "memory") {
      return memory.adherences.filter((a) => !filter.patientId || String(a.patientId) === String(filter.patientId));
    }
    throw new Error('Listing adherence not implemented for this DB provider');
  },

  async createReport(payload) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      return serializeList([await ReportModel.create(payload)])[0];
    }
    if (provider === "memory") {
      const r = { id: String(memory.ids.report = (memory.ids.report || 1)), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      memory.reports.unshift(r);
      memory.ids.report = memory.ids.report + 1;
      return r;
    }
    throw new Error('Report creation not implemented for this DB provider');
  },

  async listReports(patientId) {
    const provider = getActiveProvider();
    if (provider === "mongodb") {
      const q = patientId ? { patientId: String(patientId) } : {};
      return serializeList(await ReportModel.find(q).sort({ createdAt: -1 }).lean());
    }
    if (provider === "memory") {
      return patientId ? memory.reports.filter((r) => String(r.patientId) === String(patientId)) : [...memory.reports];
    }
    throw new Error('Listing reports not implemented for this DB provider');
  },

  async createNotification(payload) {
    const provider = getActiveProvider();

    if (provider === "mongodb") {
      const created = await NotificationModel.create({
        recipientId: payload.recipientId || "",
        recipientRole: payload.recipientRole || "",
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata || {},
        isRead: Boolean(payload.isRead),
        readAt: payload.readAt || null,
        createdBy: payload.createdBy || ""
      });
      return serializeEntity(created);
    }

    if (provider === "memory") {
      const notification = {
        id: String(memory.ids.notification++),
        recipientId: payload.recipientId || "",
        recipientRole: payload.recipientRole || "",
        type: payload.type,
        title: payload.title,
        message: payload.message,
        metadata: payload.metadata || {},
        isRead: Boolean(payload.isRead),
        readAt: payload.readAt || null,
        createdBy: payload.createdBy || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      memory.notifications.unshift(notification);
      return notification;
    }

    throw new Error('Notification creation not implemented for this DB provider');
  },

  async listNotifications(filter = {}) {
    const provider = getActiveProvider();
    const recipientId = String(filter.recipientId || "");
    const recipientRole = String(filter.recipientRole || "");

    if (provider === "mongodb") {
      const query = {
        $or: [
          recipientId ? { recipientId } : null,
          recipientRole ? { recipientRole } : null
        ].filter(Boolean)
      };
      if (!query.$or.length) {
        return serializeList(await NotificationModel.find().sort({ createdAt: -1 }).lean());
      }
      if (filter.unreadOnly) {
        query.isRead = false;
      }
      return serializeList(await NotificationModel.find(query).sort({ createdAt: -1 }).lean());
    }

    if (provider === "memory") {
      return memory.notifications.filter((item) => {
        const ownsById = recipientId && String(item.recipientId) === recipientId;
        const ownsByRole = recipientRole && String(item.recipientRole) === recipientRole;
        if (!recipientId && !recipientRole) return true;
        if (filter.unreadOnly && item.isRead) return false;
        return ownsById || ownsByRole;
      });
    }

    throw new Error('Listing notifications not implemented for this DB provider');
  },

  async findNotificationById(notificationId) {
    const provider = getActiveProvider();
    const id = String(notificationId || "");
    if (!id) return null;

    if (provider === "mongodb") {
      return serializeEntity(await NotificationModel.findById(id).lean());
    }

    if (provider === "memory") {
      return memory.notifications.find((item) => String(item.id) === id) || null;
    }

    throw new Error('findNotificationById not implemented for this DB provider');
  },

  async markNotificationRead(notificationId, recipientId, recipientRole) {
    const provider = getActiveProvider();
    const id = String(notificationId || "");
    if (!id) return null;

    if (provider === "mongodb") {
      const existing = await NotificationModel.findById(id).lean();
      if (!existing) return null;
      if (String(existing.recipientId || "") !== String(recipientId || "") && String(existing.recipientRole || "") !== String(recipientRole || "")) {
        return null;
      }
      const updated = await NotificationModel.findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true }).lean();
      return serializeEntity(updated);
    }

    if (provider === "memory") {
      const idx = memory.notifications.findIndex((item) => String(item.id) === id);
      if (idx === -1) return null;
      const existing = memory.notifications[idx];
      if (String(existing.recipientId || "") !== String(recipientId || "") && String(existing.recipientRole || "") !== String(recipientRole || "")) {
        return null;
      }
      memory.notifications[idx] = { ...existing, isRead: true, readAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      return memory.notifications[idx];
    }

    throw new Error('markNotificationRead not implemented for this DB provider');
  },

  async markAllNotificationsRead(recipientId, recipientRole) {
    const provider = getActiveProvider();
    const targetId = String(recipientId || "");
    const targetRole = String(recipientRole || "");

    if (provider === "mongodb") {
      const query = {
        $or: [
          targetId ? { recipientId: targetId } : null,
          targetRole ? { recipientRole: targetRole } : null
        ].filter(Boolean),
        isRead: false
      };
      const result = await NotificationModel.updateMany(query, { $set: { isRead: true, readAt: new Date() } });
      return result.modifiedCount || 0;
    }

    if (provider === "memory") {
      let count = 0;
      memory.notifications = memory.notifications.map((item) => {
        const matches = (targetId && String(item.recipientId) === targetId) || (targetRole && String(item.recipientRole) === targetRole);
        if (matches && !item.isRead) {
          count += 1;
          return { ...item, isRead: true, readAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        }
        return item;
      });
      return count;
    }

    throw new Error('markAllNotificationsRead not implemented for this DB provider');
  },

  async deleteNotification(notificationId, recipientId, recipientRole) {
    const provider = getActiveProvider();
    const id = String(notificationId || "");
    if (!id) return null;

    if (provider === "mongodb") {
      const existing = await NotificationModel.findById(id).lean();
      if (!existing) return null;
      if (String(existing.recipientId || "") !== String(recipientId || "") && String(existing.recipientRole || "") !== String(recipientRole || "")) {
        return null;
      }
      await NotificationModel.findByIdAndDelete(id);
      return existing;
    }

    if (provider === "memory") {
      const existing = memory.notifications.find((item) => String(item.id) === id);
      if (!existing) return null;
      if (String(existing.recipientId || "") !== String(recipientId || "") && String(existing.recipientRole || "") !== String(recipientRole || "")) {
        return null;
      }
      memory.notifications = memory.notifications.filter((item) => String(item.id) !== id);
      return existing;
    }

    throw new Error('deleteNotification not implemented for this DB provider');
  },

  // Provider availability (per-doctor/provider schedule stored in user.profile.availability for mongodb)
  async setProviderAvailability(providerId, availability) {
    const provider = getActiveProvider();
    if (!providerId) throw new Error('providerId is required');

    if (provider === "mongodb") {
      // store availability under user.profile.availability
      const existing = await UserModel.findById(providerId).lean();
      if (!existing) throw new Error('Provider user not found');
      const nextProfile = Object.assign({}, existing.profile || {}, { availability });
      const updated = await UserModel.findByIdAndUpdate(providerId, { profile: nextProfile }, { new: true }).lean();
      return serializeUser(updated);
    }

    if (provider === "memory") {
      memory.providerAvailability[String(providerId)] = {
        providerId: String(providerId),
        availability,
        updatedAt: new Date().toISOString()
      };
      return memory.providerAvailability[String(providerId)];
    }

    throw new Error('setProviderAvailability not implemented for this DB provider');
  },

  async getProviderAvailability(providerId) {
    const provider = getActiveProvider();
    if (!providerId) return null;

    if (provider === "mongodb") {
      const existing = await UserModel.findById(providerId).lean();
      if (!existing) return null;
      return existing.profile ? existing.profile.availability || null : null;
    }

    if (provider === "memory") {
      return memory.providerAvailability[String(providerId)] || null;
    }

    throw new Error('getProviderAvailability not implemented for this DB provider');
  }
};
