import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- Internalized Utilities for Canvas Environment ---
const logger = {
  debug: console.log,
  info: console.log,
  error: console.error,
};

const formatAppointmentTime = (isoString) => {
  if (!isoString) return '';
  if (isoString.includes('T')) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // Handle raw time strings like "09:00"
  if (typeof isoString === 'string' && isoString.includes(':') && !isoString.includes('T')) {
      const [hours, minutes] = isoString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return isoString;
};

const getLocalDateInputValue = () => {
  return new Date().toISOString().split('T')[0];
};

const getLocalDateKey = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.split('T')[0];
  if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
  return dateStr;
};

const normalizeDoctorSlots = (slots) => {
  if (!Array.isArray(slots)) return [];
  return slots;
};

const getAppointmentId = (slot) => slot.id || slot._id || Math.random().toString();

// Simulated database for the mock API
let mockDatabaseSlots = [
  { id: 'slot-1', startAt: '09:00', endTime: '09:30', date: getLocalDateInputValue() },
  { id: 'slot-2', startAt: '09:30', endTime: '10:00', date: getLocalDateInputValue() },
  { id: 'slot-3', startAt: '11:00', endTime: '11:30', date: getLocalDateInputValue() },
];

const apiRequest = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (options.method === 'POST') {
        const newSlot = JSON.parse(options.body);
        const slotEntry = { id: `slot-${Date.now()}`, startAt: newSlot.startTime, endTime: newSlot.endTime, date: newSlot.date };
        mockDatabaseSlots.push(slotEntry);
        resolve({ success: true, slot: slotEntry });
      } else if (options.method === 'DELETE') {
        const slotId = url.split('/').pop();
        mockDatabaseSlots = mockDatabaseSlots.filter(s => s.id !== slotId);
        resolve({ success: true });
      } else {
        // Extract date param manually
        let targetDate = '';
        try {
           targetDate = new URLSearchParams(url.split('?')[1]).get('date');
        } catch(e) {
           targetDate = getLocalDateInputValue();
        }
        
        const filtered = mockDatabaseSlots.filter(s => s.date === targetDate);
        resolve(filtered);
      }
    }, 600);
  });
};

const getRealtimeSocket = async () => ({ on: () => {}, off: () => {} });
// ---------------------------------------------------

const DoctorSlotManager = () => {
  const [date, setDate] = useState(getLocalDateInputValue() || new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('09:30');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const activeDateRef = useRef(date);

  useEffect(() => {
    activeDateRef.current = date;
  }, [date]);

  const refreshSlots = useCallback(async (targetDate) => {
    if (!targetDate) return;

    setLoading(true);
    setError('');

    try {
      const response = await apiRequest(`/appointments/doctor/slots?status=available&date=${targetDate}`);
      const normalizedSlots = normalizeDoctorSlots(Array.isArray(response) ? response : []);
      
      normalizedSlots.sort((a, b) => {
          const timeA = a.startAt || a.startTime || '';
          const timeB = b.startAt || b.startTime || '';
          return timeA.localeCompare(timeB);
      });

      setSlots(normalizedSlots);
      logger.debug('Loaded doctor slots', { date: targetDate, count: normalizedSlots.length });
    } catch (err) {
      logger.error('Error fetching slots:', err);
      setError('Failed to load slots. Please try again.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartTimeChange = (newStartTime) => {
    setStartTime(newStartTime);
    if (newStartTime) {
      const [hours, minutes] = newStartTime.split(':');
      const timeObj = new Date();
      timeObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      timeObj.setMinutes(timeObj.getMinutes() + 30);
      const newEndTime = `${String(timeObj.getHours()).padStart(2, '0')}:${String(timeObj.getMinutes()).padStart(2, '0')}`;
      setEndTime(newEndTime);
    }
  };

  useEffect(() => {
    if (!date) return;
    const timer = setTimeout(() => refreshSlots(date), 300);
    return () => clearTimeout(timer);
  }, [date, refreshSlots]);

  useEffect(() => {
    let active = true;
    let socket = null;
    let handleSlotChange = null;

    const initSocket = async () => {
      try {
        socket = await getRealtimeSocket();
        if (!active || !socket) return;

        handleSlotChange = (payload) => {
          const currentDate = activeDateRef.current;
          if (!currentDate) return;

          const slotDate = getLocalDateKey(payload?.startAt || payload?.dateTime || payload?.date || payload);
          if (slotDate && slotDate !== currentDate) return;
          refreshSlots(currentDate);
        };

        socket.on('slot:created', handleSlotChange);
        socket.on('appointment:booked', handleSlotChange);
        socket.on('appointment:updated', handleSlotChange);
        socket.on('appointment:deleted', handleSlotChange);
      } catch (err) {
        logger.debug('Realtime socket unavailable for slot manager', err?.message || err);
      }
    };

    initSocket();

    return () => {
      active = false;
      if (socket && handleSlotChange) {
        socket.off('slot:created', handleSlotChange);
        socket.off('appointment:booked', handleSlotChange);
        socket.off('appointment:updated', handleSlotChange);
        socket.off('appointment:deleted', handleSlotChange);
      }
    };
  }, [refreshSlots]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setError('');

    if (!date || !startTime || !endTime) {
      setError('Please fill in all fields');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    const slotExists = slots.some(s => (s.startAt || s.startTime) === startTime);
    if (slotExists) {
        setError('A slot with this start time already exists.');
        return;
    }

    setSubmitting(true);

    try {
      const slotData = {
        date: date,
        startTime: startTime,
        endTime: endTime,
        durationMinutes: 30
      };

      const response = await apiRequest('/appointments/doctor/slots', {
        method: 'POST',
        body: JSON.stringify(slotData)
      });

      logger.info('Slot created successfully:', response);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);

      handleStartTimeChange(endTime);

      window.dispatchEvent(
        new CustomEvent('ayurit:toast', {
          detail: { type: 'success', message: 'Slot created successfully!' }
        })
      );

      await refreshSlots(date);
    } catch (err) {
      logger.error('Error creating slot:', err);
      setError(err.message || 'Failed to create slot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    setDeleting(slotId);

    try {
      await apiRequest(`/appointments/${slotId}`, {
        method: 'DELETE'
      });

      logger.info('Slot deleted successfully');

      setSlots((prev) => prev.filter((slot) => String(getAppointmentId(slot)) !== String(slotId)));

      window.dispatchEvent(
        new CustomEvent('ayurit:toast', {
          detail: { type: 'success', message: 'Slot deleted successfully!' }
        })
      );
    } catch (err) {
      logger.error('Error deleting slot:', err);
      setError(err.message || 'Failed to delete slot');
    } finally {
      setDeleting(null);
    }
  };

  const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', color: '#0f172a', maxWidth: '600px', width: '100%', margin: '0 auto' },
    input: { width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '15px', outline: 'none', colorScheme: 'light' },
    label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' },
    button: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#4b7c6d', color: '#ffffff', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', marginTop: '24px', transition: 'background-color 0.2s ease' },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    timeGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
    slotItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
    badge: { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', border: '1px solid #bbf7d0' },
    deleteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fff5f5', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s' },
    deleteBtnDisabled: { opacity: 0.5, cursor: 'wait' }
  };

  return (
    <motion.div
      className="doctor-slot-manager-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <Calendar size={24} color="#4b7c6d" />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Manage Availability</h2>
        </div>

        {error && (
          <motion.div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            style={{ backgroundColor: '#f0fdf4', color: '#15803d', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Slot created successfully!</span>
          </motion.div>
        )}

        <form onSubmit={handleCreateSlot} style={{ marginBottom: '32px' }}>
          <div>
            <label style={styles.label}><Calendar size={16} /> Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getLocalDateInputValue() || new Date().toISOString().split('T')[0]}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.timeGroup}>
            <div>
              <label style={styles.label}><Clock size={16} /> Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <div>
              <label style={styles.label}><Clock size={16} /> End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={submitting || !date}
            style={{ ...styles.button, ...(submitting || !date ? styles.buttonDisabled : {}) }}
            whileHover={{ scale: !submitting && date ? 1.02 : 1 }}
            whileTap={{ scale: !submitting && date ? 0.98 : 1 }}
          >
            <Plus size={18} />
            {submitting ? 'Creating...' : 'Create Slot'}
          </motion.button>
        </form>

        {date && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#334155', marginBottom: '16px' }}>
              Slots for {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>

            {loading && <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Loading slots...</div>}

            {!loading && slots.length === 0 && (
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                No slots created for this date.
              </div>
            )}

            <AnimatePresence>
              {!loading && slots.length > 0 && slots.map((slot) => (
                <motion.div
                  key={getAppointmentId(slot)}
                  style={styles.slotItem}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      <Clock size={16} color="#64748b" />
                      {formatAppointmentTime(slot.startAt || slot.startTime)}
                    </div>
                    <span style={styles.badge}>Open</span>
                  </div>
                  
                  <motion.button
                    type="button"
                    onClick={() => handleDeleteSlot(getAppointmentId(slot))}
                    disabled={deleting === getAppointmentId(slot)}
                    style={{ ...styles.deleteBtn, ...(deleting === getAppointmentId(slot) ? styles.deleteBtnDisabled : {}) }}
                    whileHover={{ scale: 1.05, backgroundColor: '#fee2e2' }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete slot"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09211c', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <DoctorSlotManager />
    </div>
  );
}