import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { logger } from '../utils/logger';
import '../styles/AppointmentBooking.css';

export default function AppointmentBooking({ doctorId = null, onBookingSuccess = null }) {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch available slots
  useEffect(() => {
    if (date && doctorId) {
      fetchAvailableSlots();
    }
  }, [date, doctorId]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiRequest('/api/appointments/slots', {
        method: 'GET',
        params: {
          doctorId: doctorId,
          date: date,
          duration: 30
        }
      });
      
      if (response.slots) {
        setAvailableSlots(response.slots);
        logger.debug('[AppointmentBooking]', 'Available slots loaded', { count: response.slots.length });
      }
    } catch (err) {
      logger.warn('[AppointmentBooking]', 'Failed to fetch slots', { error: err.message });
      setError('Failed to load available slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      setError('Please select a slot');
      return;
    }

    try {
      setBooking(true);
      setError('');

      const response = await apiRequest('/api/appointments', {
        method: 'POST',
        body: {
          providerId: doctorId,
          doctorId: doctorId,
          dateTime: selectedSlot,
          reason: reason || 'General consultation',
          durationMinutes: 30
        }
      });

      if (response) {
        logger.info('[AppointmentBooking]', 'Appointment booked successfully', { appointmentId: response.id });
        setSuccess(true);
        setReason('');
        setSelectedSlot(null);
        
        // Refresh slots
        setTimeout(() => {
          fetchAvailableSlots();
          setSuccess(false);
          if (onBookingSuccess) onBookingSuccess(response);
        }, 2000);
      }
    } catch (err) {
      logger.error('[AppointmentBooking]', 'Failed to book appointment', { error: err.message });
      setError(err.message || 'Failed to book appointment');
    } finally {
      setBooking(false);
    }
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!doctorId) {
    return (
      <div className="appointment-booking">
        <p className="error-message">Doctor not selected</p>
      </div>
    );
  }

  return (
    <div className="appointment-booking">
      <h2>Book an Appointment</h2>

      {success && (
        <div className="success-message">
          ✓ Appointment booked successfully! Refreshing available slots...
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleBookAppointment} className="booking-form">
        <div className="form-group">
          <label>Select Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSelectedSlot(null);
            }}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-group">
          <label>Select Time</label>
          {loading ? (
            <p className="loading">Loading available slots...</p>
          ) : availableSlots.length === 0 ? (
            <p className="empty">No available slots for this date</p>
          ) : (
            <div className="slots-list">
              {availableSlots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`slot-option ${selectedSlot === slot ? 'selected' : ''}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <span className="slot-time">{formatTime(slot)}</span>
                  <span className="slot-duration">30 min</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Reason for Visit (Optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Digestive issues, Energy levels..."
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={booking || !selectedSlot || loading}
          className="btn btn-primary"
        >
          {booking ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </form>
    </div>
  );
}
