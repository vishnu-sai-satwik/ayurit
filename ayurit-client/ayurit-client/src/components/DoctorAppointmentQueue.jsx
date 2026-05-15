import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, AlertCircle, CheckCircle, X, PlayCircle, CheckCircle2 } from 'lucide-react';

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
  return isoString;
};

const getLocalDateKey = (dateStr) => {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && dateStr.includes('T')) return dateStr.split('T')[0];
  if (dateStr instanceof Date) return dateStr.toISOString().split('T')[0];
  return dateStr;
};

const getAppointmentId = (apt) => apt.id || apt._id;

// Mocking the API Request to simulate a working backend for the doctor queue
const apiRequest = async (url, options = {}) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url.includes('/appointments/doctor/queue')) {
        resolve([
          { id: 'apt-1', startAt: new Date().setHours(9, 0, 0), status: 'completed', patientName: 'Rahul Verma', reason: 'Routine Checkup' },
          { id: 'apt-2', startAt: new Date().setHours(10, 30, 0), status: 'in-progress', patientName: 'Sneha Patel', reason: 'Dietary Consultation' },
          { id: 'apt-3', startAt: new Date().setHours(11, 0, 0), status: 'booked', patientName: 'Amit Singh', reason: 'Follow-up' },
          { id: 'apt-4', startAt: new Date().setHours(14, 0, 0), status: 'booked', patientName: 'Priya Sharma', reason: 'Initial Assessment' }
        ]);
      } else if (url.includes('/status')) {
         resolve({ success: true });
      } else {
        reject({ status: 404, message: 'Not found' });
      }
    }, 800);
  });
};

// Mocking Realtime Socket
const getRealtimeSocket = async () => {
  return {
    on: () => {},
    off: () => {}
  };
};
// ---------------------------------------------------

const DoctorAppointmentQueue = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState(null);

  // Status colors for badges
  const getStatusColor = (status) => {
    const colors = {
      available: '#4CAF50',
      booked: '#f59e0b', // Amber instead of deep orange for better look
      'in-progress': '#3b82f6', // Blue
      completed: '#10b981', // Emerald green
      cancelled: '#ef4444' // Red
    };
    return colors[status] || '#94a3b8';
  };

  // Fetch appointments on mount and set up polling
  useEffect(() => {
    let active = true;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiRequest('/appointments/doctor/queue');

        if (Array.isArray(response)) {
          // Sort by startAt ascending (earliest first)
          const sorted = response.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
          if (active) {
            setAppointments(sorted);
          }
          logger.debug(`Loaded ${sorted.length} appointments`);
        } else {
          if (active) {
            setAppointments([]);
          }
        }
      } catch (err) {
        logger.error('Error fetching appointments:', err);
        if (active) {
          setError('Failed to load appointments');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    const interval = setInterval(fetchAppointments, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let socket = null;
    let handleSlotUpdate = null; // Use a proper reference for cleanup

    const initSocket = async () => {
      try {
        socket = await getRealtimeSocket();
        if (!active || !socket) return;

        handleSlotUpdate = () => {
          apiRequest('/appointments/doctor/queue')
            .then((response) => {
              if (Array.isArray(response)) {
                setAppointments(response.sort((a, b) => new Date(a.startAt) - new Date(b.startAt)));
              }
            })
            .catch((err) => logger.debug('Queue refresh failed', err?.message || err));
        };

        socket.on('appointment:booked', handleSlotUpdate);
        socket.on('appointment:statusUpdated', handleSlotUpdate);
        socket.on('appointment:updated', handleSlotUpdate);
        socket.on('appointment:deleted', handleSlotUpdate);

      } catch (err) {
        logger.debug('Realtime socket unavailable for queue', err?.message || err);
      }
    };

    initSocket();

    return () => {
      active = false;
      if (socket && handleSlotUpdate) {
        socket.off('appointment:booked', handleSlotUpdate);
        socket.off('appointment:statusUpdated', handleSlotUpdate);
        socket.off('appointment:updated', handleSlotUpdate);
        socket.off('appointment:deleted', handleSlotUpdate);
      }
    };
  }, []);

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'all') return apt.status !== 'available';
    return apt.status === filter;
  });

  // Handle status updates
  const handleStatusChange = async (appointmentId, newStatus) => {
    setUpdating(appointmentId);

    try {
      const response = await apiRequest(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      logger.info(`Appointment status updated to ${newStatus}:`, response);

      // Update local state optimistically
      setAppointments((prev) => prev.map((apt) => (
        String(getAppointmentId(apt)) === String(appointmentId)
          ? { ...apt, status: newStatus }
          : apt
      )));

      const statusMessages = {
        'in-progress': 'Consultation started',
        completed: 'Consultation completed',
        cancelled: 'Appointment cancelled'
      };

      window.dispatchEvent(
        new CustomEvent('ayurit:toast', {
          detail: { type: 'success', message: statusMessages[newStatus] || 'Status updated' }
        })
      );
    } catch (err) {
      logger.error('Error updating appointment status:', err);

      window.dispatchEvent(
        new CustomEvent('ayurit:toast', {
          detail: { type: 'error', message: 'Failed to update appointment' }
        })
      );
    } finally {
      setUpdating(null);
    }
  };

  const isToday = (dateInput) => {
    const today = new Date();
    const targetDate = new Date(dateInput);
    return targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear();
  };

  // Modern inline styles to override inherited CSS and fix contrast
  const styles = {
    card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', color: '#0f172a', maxWidth: '800px', width: '100%', margin: '0 auto' },
    filterContainer: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s' },
    filterBtnActive: { backgroundColor: '#4b7c6d', color: '#ffffff', border: '1px solid #4b7c6d' },
    appointmentCard: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', color: '#fff' },
    todayBadge: { backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginLeft: '8px' },
    actionBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', color: '#fff' },
    startBtn: { backgroundColor: '#3b82f6' },
    completeBtn: { backgroundColor: '#10b981' },
    cancelBtn: { backgroundColor: '#ef4444' },
    disabledBtn: { opacity: 0.5, cursor: 'not-allowed' }
  };

  return (
    <motion.div
      className="doctor-appointment-queue-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <Clock size={24} color="#4b7c6d" />
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Consultation Queue</h2>
        </div>

        {error && (
          <motion.div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
          </motion.div>
        )}

        {/* Filter Buttons */}
        <div style={styles.filterContainer}>
          {['all', 'booked', 'in-progress', 'completed'].map((status) => (
            <motion.button
              key={status}
              onClick={() => setFilter(status)}
              style={{ ...styles.filterBtn, ...(filter === status ? styles.filterBtnActive : {}) }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </motion.button>
          ))}
        </div>

        {/* Appointments List */}
        <div>
          {loading && (
            <div style={{ color: '#64748b', fontSize: '14px', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
              Loading appointments...
            </div>
          )}

          {!loading && filteredAppointments.length === 0 && (
            <div style={{ backgroundColor: '#f8fafc', padding: '32px', borderRadius: '8px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={32} color="#94a3b8" />
              No appointments in this category
            </div>
          )}

          <AnimatePresence>
            {!loading &&
              filteredAppointments.map((apt) => (
                <motion.div
                  key={getAppointmentId(apt)}
                  style={styles.appointmentCard}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  layout
                >
                  {/* Header Row (Time & Badges) */}
                  <div style={styles.headerRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        <Clock size={16} color="#64748b" />
                        {formatAppointmentTime(apt.startAt || apt.dateTime)}
                      </span>
                      <span style={{ ...styles.badge, backgroundColor: getStatusColor(apt.status) }}>
                        {apt.status === 'in-progress' ? 'Active' : String(apt.status || '').charAt(0).toUpperCase() + String(apt.status || '').slice(1)}
                      </span>
                      {isToday(apt.startAt || apt.dateTime) && <span style={styles.todayBadge}>Today</span>}
                    </div>
                  </div>

                  {/* Body Row (Patient Info) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontWeight: '500' }}>
                      <User size={16} />
                      <span>{apt.patientName || apt.patientEmail || apt.patientId || 'No patient'}</span>
                    </div>

                    {apt.reason && (
                      <div style={{ fontSize: '14px', color: '#475569', paddingLeft: '24px' }}>
                        <span style={{ fontWeight: '600' }}>Reason:</span> {apt.reason}
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    {apt.status === 'booked' && (
                      <motion.button
                        onClick={() => handleStatusChange(getAppointmentId(apt), 'in-progress')}
                        disabled={updating === getAppointmentId(apt)}
                        style={{ ...styles.actionBtn, ...styles.startBtn, ...(updating === getAppointmentId(apt) ? styles.disabledBtn : {}) }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <PlayCircle size={14} /> Start Consultation
                      </motion.button>
                    )}

                    {apt.status === 'in-progress' && (
                      <>
                        <motion.button
                          onClick={() => handleStatusChange(getAppointmentId(apt), 'completed')}
                          disabled={updating === getAppointmentId(apt)}
                          style={{ ...styles.actionBtn, ...styles.completeBtn, ...(updating === getAppointmentId(apt) ? styles.disabledBtn : {}) }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <CheckCircle2 size={14} /> Complete
                        </motion.button>

                        <motion.button
                          onClick={() => handleStatusChange(getAppointmentId(apt), 'cancelled')}
                          disabled={updating === getAppointmentId(apt)}
                          style={{ ...styles.actionBtn, ...styles.cancelBtn, ...(updating === getAppointmentId(apt) ? styles.disabledBtn : {}) }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <X size={14} /> Cancel
                        </motion.button>
                      </>
                    )}

                    {(apt.status === 'completed' || apt.status === 'cancelled') && (
                      <div style={{ fontSize: '14px', fontWeight: '600', color: apt.status === 'completed' ? '#10b981' : '#ef4444' }}>
                        {apt.status === 'completed' ? '✓ Consultation Completed' : '✗ Appointment Cancelled'}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09211c', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <DoctorAppointmentQueue />
    </div>
  );
}