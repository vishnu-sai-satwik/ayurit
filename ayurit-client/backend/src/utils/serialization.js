const isObjectLike = (value) => value !== null && typeof value === "object";

const isMongoObjectId = (value) =>
  isObjectLike(value) && typeof value.toHexString === "function" && String(value._bsontype || "") === "ObjectId";

const normalizeValue = (value) => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (!isObjectLike(value)) {
    return value;
  }

  if (isMongoObjectId(value)) {
    return value.toHexString();
  }

  const plain = typeof value.toObject === "function" ? value.toObject({ virtuals: false }) : { ...value };
  const normalized = {};

  for (const [key, item] of Object.entries(plain)) {
    if (key === "__v") {
      continue;
    }

    if (key === "_id") {
      normalized.id = String(normalizeValue(item));
      continue;
    }

    normalized[key] = normalizeValue(item);
  }

  if (normalized.id === undefined && plain.id !== undefined) {
    normalized.id = String(normalizeValue(plain.id));
  }

  return normalized;
};

export const serializeEntity = (value) => {
  const normalized = normalizeValue(value);

  if (normalized && typeof normalized === "object" && !Array.isArray(normalized) && normalized._id !== undefined) {
    delete normalized._id;
  }

  return normalized;
};

export const serializeList = (items = []) => items.map((item) => serializeEntity(item));

export const serializeUser = (value) => serializeEntity(value);
export const serializePatient = (value) => serializeEntity(value);
export const serializeAppointment = (value) => serializeEntity(value);
export const serializeDietPlan = (value) => serializeEntity(value);
export const serializeFood = (value) => serializeEntity(value);
export const serializeChart = (value) => serializeEntity(value);
export const serializeConsultation = (value) => serializeEntity(value);
export const serializePrescription = (value) => serializeEntity(value);
export const serializeAdherence = (value) => serializeEntity(value);
export const serializeReport = (value) => serializeEntity(value);