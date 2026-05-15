import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { logger } from '../utils/logger';
import '../styles/DoctorSlotManager.css';

export default function DoctorSlotManager() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:30');
  const [submitting, setSubmitting] = useState(false);

  // Fetch slots for selected date
  useEffect(() => {
    fetchSlots();
  }, [date]);

  const fetchSlots = async () => {
    if (!date) return;
    
    try {
      setLoading(true);
      const response = await apiRequest('/api/appointments/slots', {
        method: 'GET',
        params: {
          date: date,
          duration: 30
        }
      });
      
      if (response.slots) {
        setSlots(response.slots);
        logger.debug('[DoctorSlotManager]', 'Slots fetched', { count: response.slots.length });
      }
    } catch (err) {
      logger.warn('[DoctorSlotManager]', 'Failed to fetch slots', { error: err.message });
      setError('Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    
    if (!date || !startTime || !endTime) {
      setError('Please fill all fields');
      return;
    }

    // Validate time
    if (startTime >= endTime) {
      setError('Start time must be before end time');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const startAt = new Date(`${date}T${startTime}:00Z`).toISOString();
      const endAt = new Date(`${date}T${endTime}:00Z`).toISOString();
      
      const response = await apiRequest('/api/appointments', {
        method: 'POST',
        body: {
          patientId: '',  // Empty for available slot
          doctorId: '',   // Backend will use auth user
          dateTime: startAt,
          startAt: startAt,
          endAt: endAt,
          status: 'available',
          durationMinutes: 30,
          reason: 'Doctor availability slot'
        }
      });

      if (response) {
        logger.info('[DoctorSlotManager]', 'Slot created successfully');
        setSlots([...slots, response]);
        // Reset form
        setStartTime(new Date(endAt).toTimeString().slice(0, 5));
        setEndTime(new Date(new Date(endAt).getTime() + 30*60000).toTimeString().slice(0, 5));
      }
    } catch (err) {
      logger.error('[DoctorSlotManager]', 'Failed to create slot', { error: err.message });
      setError(err.message || 'Failed to create slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this slot?')) return;

    try {
      await apiRequest(`/api/appointments/${slotId}`, {
        method: 'DELETE'
      });
      
      setSlots(slots.filter(s => s.id !== slotId));
      logger.info('[DoctorSlotManager]', 'Slot deleted');
    } catch (err) {
      logger.error('[DoctorSlotManager]', 'Failed to delete slot', { error: err.message });
      setError('Failed to delete slot');
    }
  };

  return (
    <div className="slot-manager">
      <h2>Manage Your Availability</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleCreateSlot} className="slot-form">
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || loading}
          className="btn btn-primary"
        >
          {submitting ? 'Creating...' : 'Create Slot'}
        </button>
      </form>

      <div className="slots-list">
        <h3>Available Slots for {date}</h3>
        {loading ? (
          <p className="loading">Loading slots...</p>
        ) : slots.length === 0 ? (
          <p className="empty">No slots created for this date</p>
        ) : (
          <div className="slots-grid">
            {slots.map((slot) => (
              <div key={slot.id || slot._id} className="slot-card">
                <div className="slot-time">
                  {new Date(slot.startAt || slot.dateTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} - {new Date(slot.endAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div className="slot-status">
                  <span className={`badge badge-${slot.status}`}>
                    {slot.status === 'available' ? 'Open' : slot.status}
                  </span>
                </div>
                {slot.status === 'available' && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteSlot(slot.id || slot._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
