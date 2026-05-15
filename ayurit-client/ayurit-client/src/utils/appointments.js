const toDate = (value) => {
  if (value instanceof Date) {
    return value;
  }

  return new Date(value);
};

export const getLocalDateInputValue = (value = new Date()) => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getLocalDateKey = (value) => getLocalDateInputValue(value);

export const buildLocalDateTimeIso = (dateKey, timeKey) => {
  if (!dateKey || !timeKey) return "";

  const date = new Date(`${dateKey}T${timeKey}`);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString();
};

export const getAppointmentId = (value) => String(value?.id || value?._id || value?.appointmentId || value || "");

export const getAppointmentStartIso = (value) => {
  if (typeof value === "string") return value;
  return value?.startAt || value?.dateTime || value?.date || "";
};

export const formatAppointmentTime = (value) => {
  const iso = getAppointmentStartIso(value);
  if (!iso) return "--:--";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

export const normalizeDoctorSlots = (value) => {
  const items = Array.isArray(value) ? value : [];

  return items
    .filter(Boolean)
    .map((slot) => {
      if (typeof slot === "string") {
        return {
          id: slot,
          startAt: slot,
          endAt: "",
          status: "available"
        };
      }

      const startAt = slot.startAt || slot.dateTime || slot.slotTime || "";
      const endAt = slot.endAt || "";
      return {
        ...slot,
        id: getAppointmentId(slot),
        startAt,
        endAt,
        status: slot.status || "available"
      };
    })
    .filter((slot) => Boolean(slot.id || slot.startAt))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
};

export const normalizeAvailableSlots = (value) => {
  const items = Array.isArray(value) ? value : [];

  return [...new Set(
    items
      .map((slot) => (typeof slot === "string" ? slot : slot?.startAt || slot?.dateTime || slot?.slotTime || ""))
      .filter(Boolean)
  )].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};
