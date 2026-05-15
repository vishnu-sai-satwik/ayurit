import { DataService } from "./dataService.js";

const minutesBetween = (a, b) => Math.abs((new Date(a)).getTime() - (new Date(b)).getTime()) / 60000;

const toLocalDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const overlaps = (startA, endA, startB, endB) => {
  const a0 = new Date(startA).getTime();
  const a1 = new Date(endA).getTime();
  const b0 = new Date(startB).getTime();
  const b1 = new Date(endB).getTime();
  return Math.max(a0, b0) < Math.min(a1, b1);
};

const addMinutes = (iso, mins) => new Date(new Date(iso).getTime() + mins * 60000).toISOString();

export const getAvailableSlots = async (providerId, dateIso, options = {}) => {
  const duration = options.durationMinutes || 30;
  // respect provider availability if configured
  let dayStartHour = options.startHour ?? 9;
  let dayEndHour = options.endHour ?? 17;
  let slotDuration = duration;

  try {
    const avail = await DataService.getProviderAvailability(providerId);
    if (avail && avail.availability) {
      const a = avail.availability;
      if (typeof a.startHour === 'number') dayStartHour = a.startHour;
      if (typeof a.endHour === 'number') dayEndHour = a.endHour;
      if (typeof a.slotMinutes === 'number') slotDuration = a.slotMinutes;
    }
  } catch (e) {
    // ignore and fall back to provided options
  }

  if (!providerId) throw new Error('providerId is required');
  if (!dateIso) throw new Error('date is required (YYYY-MM-DD)');

  // Build base date in local time so frontend date/time inputs stay aligned.
  const base = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    throw new Error('Invalid date');
  }

  const slots = [];
  for (let h = dayStartHour; h < dayEndHour; h++) {
    for (let m = 0; m < 60; m += slotDuration) {
      const slot = new Date(base);
      slot.setHours(h, m, 0, 0);
      slots.push(slot.toISOString());
    }
  }

  // fetch provider appointments once
  const appointments = await DataService.listAppointments({ doctorId: providerId, providerId });
  // normalize appointment intervals (assume each appointment duration = duration unless appointment has end)
  // Only count booked/in-progress appointments as occupied, not available slots
  const occupied = appointments
    .filter((apt) => apt.status && apt.status !== "available")
    .map((apt) => {
      const start = apt.dateTime || apt.startAt || apt.date || null;
      const end = apt.endAt || (start ? addMinutes(start, slotDuration) : null);
      return { start, end };
    }).filter((x) => x.start && x.end);

  const available = slots.filter((slotIso) => {
    const slotEnd = addMinutes(slotIso, duration);
    for (const occ of occupied) {
      if (overlaps(slotIso, slotEnd, occ.start, occ.end)) return false;
    }
    return true;
  });

  return available;
};

export const createBooking = async (payload) => {
  const providerId = payload.providerId || payload.doctorId;
  const { dateTime } = payload;
  if (!providerId || !dateTime) throw new Error('providerId/doctorId and dateTime are required');

  const dateKey = toLocalDateKey(dateTime);
  const normalizedDateTime = new Date(dateTime).toISOString();
  const available = await getAvailableSlots(providerId, dateKey, { durationMinutes: payload.durationMinutes || 30 });
  const exists = available.includes(normalizedDateTime);
  if (!exists) {
    throw new Error('Slot not available');
  }

  return DataService.createAppointment(payload);
};
