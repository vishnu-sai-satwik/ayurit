import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { logger } from '../utils/logger';
import '../styles/DoctorAppointmentQueue.css';

export default function DoctorAppointmentQueue() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, upcoming, completed

  useEffect(() => {
    fetchAppointments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/appointments', {
        method: 'GET',
        params: {
          status: filter === 'all' ? undefined : filter
        }
      });

      if (response.list) {
        // Filter for today and upcoming
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filtered = response.list.filter(apt => {
          const aptDate = new Date(apt.dateTime || apt.startAt);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate >= today;
        });

        setAppointments(filtered.sort((a, b) => 
          new Date(a.startAt || a.dateTime) - new Date(b.startAt || b.dateTime)
        ));

        logger.debug('[DoctorAppointmentQueue]', 'Appointments fetched', { count: filtered.length });
      }
    } catch (err) {
      logger.warn('[DoctorAppointmentQueue]', 'Failed to fetch appointments', { error: err.message });
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await apiRequest(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        body: { status: newStatus }
      });

      logger.info('[DoctorAppointmentQueue]', 'Appointment status updated', { appointmentId, newStatus });
      fetchAppointments();
    } catch (err) {
      logger.error('[DoctorAppointmentQueue]', 'Failed to update appointment', { error: err.message });
      setError('Failed to update appointment');
    }
  };

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#4CAF50',
      booked: '#FF9800',
      'in-progress': '#2196F3',
      completed: '#8BC34A',
      cancelled: '#F44336'
    };
    return colors[status] || '#999';
  };

  if (loading) {
    return <div className="appointment-queue"><p className="loading">Loading appointments...</p></div>;
  }

  return (
    <div className="appointment-queue">
      <div className="queue-header">
        <h2>Consultation Queue</h2>
        <button onClick={fetchAppointments} className="btn-refresh">
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'booked' ? 'active' : ''}`}
          onClick={() => setFilter('booked')}
        >
          Booked
        </button>
        <button
          className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="empty-queue">
          <p>No appointments scheduled</p>
        </div>
      ) : (
        <div className="appointments-list">
          {appointments.map((apt) => (
            <div key={apt.id || apt._id} className="appointment-card">
              <div className="appointment-time">
                <span className="time-badge">
                  {formatDateTime(apt.dateTime || apt.startAt)}
                </span>
                {isToday(apt.dateTime || apt.startAt) && (
                  <span className="today-badge">Today</span>
                )}
              </div>

              <div className="appointment-details">
                <div className="detail-row">
                  <span className="label">Patient ID:</span>
                  <span className="value">{apt.patientId}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Reason:</span>
                  <span className="value">{apt.reason || apt.notes || 'General consultation'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span
                    className="status-badge"
                    style={{ background: getStatusColor(apt.status) }}
                  >
                    {apt.status || 'booked'}
                  </span>
                </div>
              </div>

              <div className="appointment-actions">
                {apt.status === 'booked' && (
                  <>
                    <button
                      className="btn-action btn-start"
                      onClick={() => handleStatusChange(apt.id || apt._id, 'in-progress')}
                    >
                      Start Consultation
                    </button>
                  </>
                )}

                {apt.status === 'in-progress' && (
                  <>
                    <button
                      className="btn-action btn-complete"
                      onClick={() => handleStatusChange(apt.id || apt._id, 'completed')}
                    >
                      Complete
                    </button>
                    <button
                      className="btn-action btn-cancel"
                      onClick={() => {
                        if (window.confirm('Cancel this consultation?')) {
                          handleStatusChange(apt.id || apt._id, 'cancelled');
                        }
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}

                {(apt.status === 'completed' || apt.status === 'cancelled') && (
                  <span className="status-final">{apt.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
