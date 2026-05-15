import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertCircle, CheckCircle2, User } from 'lucide-react';

// --- Internalized Utilities for Canvas Environment ---
// To make this run smoothly as a standalone file, I've internalized the 
// external utility functions (api, logger, formatters) so they don't break the build.

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
  return isoString;
};

const getLocalDateInputValue = () => {
  return new Date().toISOString().split('T')[0];
};

const getLocalDateKey = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.split('T')[0];
  return dateStr;
};

const normalizeAvailableSlots = (slots) => {
  if (!Array.isArray(slots)) return [];
  return slots.map(slot => typeof slot === 'string' ? slot : slot?.time || slot?.startAt || JSON.stringify(slot));
};

// Mocking the API Request to simulate a working backend for the appointments
const apiRequest = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes('/appointments/patient/available')) {
        // Return simulated time slots
        resolve({ availableSlots: ['09:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '03:30 PM', '04:15 PM'] });
      } else if (url.includes('/appointments/patient/book')) {
        // Simulate successful booking
        resolve({ success: true, message: 'Appointment booked successfully' });
      } else {
        reject({ status: 404, message: 'Not found' });
      }
    }, 800);
  });
};

// Mocking Realtime Socket to prevent undefined socket crashes
const getRealtimeSocket = async () => {
  return {
    on: () => {},
    off: () => {}
  };
};
// ---------------------------------------------------

const AppointmentBooking = ({ doctorId = null, providers = [], onBookingSuccess = null }) => {
  // Initialize date to today instead of an empty string so slots fetch immediately
  const getInitialDate = () => {
    try {
      return getLocalDateInputValue() || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(getInitialDate());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(doctorId || '');
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedDetails, setBookedDetails] = useState(null);

  const activeDateRef = useRef(date);
  const activeDoctorRef = useRef(selectedDoctor);

  // Auto-select the first provider if none is selected
  useEffect(() => {
    if (!selectedDoctor && providers.length > 0) {
      setSelectedDoctor(providers[0].id || providers[0]._id);
    }
  }, [providers, selectedDoctor]);

  useEffect(() => {
    activeDateRef.current = date;
    activeDoctorRef.current = selectedDoctor;
  }, [date, selectedDoctor]);

  useEffect(() => {
    if (doctorId) {
      setSelectedDoctor(doctorId);
    }
  }, [doctorId]);

  const refreshAvailableSlots = useCallback(async (targetDate, targetDoctorId) => {
    if (!targetDate) return;

    setLoading(true);
    setError('');
    setSelectedSlot(null);

    if (!targetDoctorId) {
      setAvailableSlots([]);
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({ date: targetDate, doctorId: targetDoctorId });
      const response = await apiRequest(`/appointments/patient/available?${params}`);
      
      const slotsData = Array.isArray(response?.availableSlots) 
        ? response.availableSlots 
        : Array.isArray(response?.slots) ? response.slots : [];
        
      const slots = normalizeAvailableSlots(slotsData);

      setAvailableSlots(slots);
      logger.debug('Loaded appointment slots', { date: targetDate, doctorId: targetDoctorId, count: slots.length });
    } catch (err) {
      logger.error('Error fetching slots:', err);
      setError('Failed to load available slots. Please try again.');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const targetDoc = doctorId || selectedDoctor;
    if (!date || !targetDoc) return;

    const timer = setTimeout(() => {
      refreshAvailableSlots(date, targetDoc);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [date, doctorId, selectedDoctor, refreshAvailableSlots]);

  useEffect(() => {
    let active = true;
    let socket = null;
    let handleSlotUpdate = null;

    const initSocket = async () => {
      try {
        socket = await getRealtimeSocket();
        if (!active || !socket) return;

        handleSlotUpdate = (payload) => {
          const currentDate = activeDateRef.current;
          const currentDoctor = activeDoctorRef.current || doctorId;
          
          if (!currentDate) return;

          const slotDate = getLocalDateKey(payload?.startAt || payload?.dateTime || payload?.date || payload);

          if (slotDate && slotDate !== currentDate) return;
          if (payload?.doctorId && currentDoctor && String(payload.doctorId) !== String(currentDoctor)) return;

          refreshAvailableSlots(currentDate, currentDoctor);
        };

        socket.on('slot:created', handleSlotUpdate);
        socket.on('appointment:booked', handleSlotUpdate);
        socket.on('appointment:updated', handleSlotUpdate);
        socket.on('appointment:deleted', handleSlotUpdate);
      } catch (err) {
        logger.debug('Realtime socket unavailable for appointment booking', err?.message || err);
      }
    };

    initSocket();

    return () => {
      active = false;
      if (socket && handleSlotUpdate) {
        socket.off('slot:created', handleSlotUpdate);
        socket.off('appointment:booked', handleSlotUpdate);
        socket.off('appointment:updated', handleSlotUpdate);
        socket.off('appointment:deleted', handleSlotUpdate);
      }
    };
  }, [doctorId, refreshAvailableSlots]);

  const handleBookAppointment = async (e) => {
    e.preventDefault();

    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setBooking(true);
    setError('');

    try {
      const selectedDoctorId = doctorId || selectedDoctor;
      if (!selectedDoctorId) {
        setError('Please select a provider before booking.');
        setBooking(false);
        return;
      }

      const bookingData = {
        dateTime: selectedSlot,
        doctorId: selectedDoctorId,
        reason: reason || '',
        durationMinutes: 30
      };

      const response = await apiRequest('/appointments/patient/book', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      logger.info('Appointment booked successfully:', response);

      // Save details for success screen
      setBookedDetails({
        date: date,
        time: selectedSlot,
        doctorName: providers.find(p => String(p.id || p._id) === String(selectedDoctorId))?.name || 'Your Provider'
      });

      setSuccess(true);
      
      // Clear form states
      setReason('');
      setSelectedSlot(null);
      setAvailableSlots((prev) => prev.filter((slot) => slot !== selectedSlot));

      if (onBookingSuccess) {
        onBookingSuccess(response);
      }

    } catch (err) {
      logger.error('Error booking appointment:', err);
      
      if (err?.status === 409) {
        setError('This slot is no longer available. Someone else may have booked it.');
        const selectedDoctorId = doctorId || selectedDoctor;
        try {
          await refreshAvailableSlots(date, selectedDoctorId);
        } catch (e) {
          logger.error('Error refreshing slots:', e);
        }
      } else {
        setError(err.message || 'Failed to book appointment. Please try again.');
      }
    } finally {
      setBooking(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setBookedDetails(null);
    refreshAvailableSlots(date, selectedDoctor);
  };

  const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', color: '#0f172a', maxWidth: '600px', width: '100%', margin: '0 auto' },
    input: { width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#0f172a', fontSize: '15px', outline: 'none', colorScheme: 'light' },
    label: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px', marginTop: '20px' },
    button: { width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: '#4b7c6d', color: '#ffffff', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', marginTop: '32px', transition: 'background-color 0.2s ease' },
    buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
    slotGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' },
    successContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' },
  };

  return (
    <motion.div
      className="appointment-booking-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="appointment-booking-card" style={styles.card}>
        
        <AnimatePresence mode="wait">
          {success && bookedDetails ? (
            <motion.div 
              key="success-view"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0 }}
              style={styles.successContainer}
            >
              <CheckCircle2 size={64} color="#10b981" style={{ marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', color: '#064e3b', marginBottom: '8px', margin: 0 }}>Appointment Confirmed!</h2>
              <p style={{ color: '#475569', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
                You are scheduled to see <strong>{bookedDetails.doctorName}</strong><br/>
                on <strong>{bookedDetails.date}</strong> at <strong>{formatAppointmentTime(bookedDetails.time)}</strong>.
              </p>
              
              <button 
                type="button" 
                style={{...styles.button, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', marginTop: '0'}} 
                onClick={handleReset}
              >
                Book Another Appointment
              </button>
            </motion.div>
          ) : (
            <motion.div key="form-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                <Calendar size={24} color="#4b7c6d" />
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Book an Appointment</h2>
              </div>

              {error && (
                <motion.div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleBookAppointment}>
                {!doctorId && providers.length > 0 && (
                  <div>
                    <label style={styles.label}><User size={16} /> Select Provider</label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      style={styles.input}
                    >
                      <option value="">Choose a doctor</option>
                      {providers.map((provider) => (
                        <option key={provider.id || provider._id} value={provider.id || provider._id}>
                          {provider.name || provider.email || 'Doctor'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label style={styles.label}><Calendar size={16} /> Select Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={getInitialDate()}
                    required
                    style={styles.input}
                  />
                </div>

                {date && selectedDoctor && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label style={styles.label}><Clock size={16} /> Available Times</label>

                    {loading && <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic' }}>Loading available slots...</div>}

                    {!loading && availableSlots.length === 0 && (
                      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1' }}>
                        No available slots for this date. Please try another day.
                      </div>
                    )}

                    {!loading && availableSlots.length > 0 && (
                      <div style={styles.slotGrid}>
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlot === slot;
                          return (
                            <motion.button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              style={{
                                padding: '12px 8px',
                                borderRadius: '8px',
                                backgroundColor: isSelected ? '#4b7c6d' : '#f8fafc',
                                color: isSelected ? '#ffffff' : '#334155',
                                border: isSelected ? '1px solid #4b7c6d' : '1px solid #cbd5e1',
                                fontWeight: isSelected ? '600' : '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Clock size={14} />
                              {formatAppointmentTime(slot)}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {selectedSlot && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label htmlFor="reason" style={styles.label}>Reason for Visit (Optional)</label>
                    <textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Brief description of your health concern..."
                      rows="3"
                      style={{...styles.input, resize: 'vertical'}}
                    />
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={!selectedSlot || booking}
                  style={{...styles.button, ...(!selectedSlot || booking ? styles.buttonDisabled : {})}}
                  whileHover={{ scale: selectedSlot && !booking ? 1.01 : 1 }}
                  whileTap={{ scale: selectedSlot && !booking ? 0.99 : 1 }}
                >
                  {booking ? 'Booking...' : `Confirm Appointment${selectedSlot ? ' at ' + formatAppointmentTime(selectedSlot) : ''}`}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Main App wrapper to provide mock data to the component and ensure it runs natively here
export default function App() {
  const mockProviders = [
    { id: 'provider-1', name: 'Dr. Aarav Sharma (Ayurveda)' },
    { id: 'provider-2', name: 'Dr. Priya Patel (Dietitian)' }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09211c', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <AppointmentBooking providers={mockProviders} />
    </div>
  );
}