import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Utensils, Database, FileText, 
  Settings, LogOut, Search, Plus, Bell, Activity, 
  Flame, Wind, Droplets, ArrowRight, CheckCircle2, ChevronDown,
  Calendar
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { clearSession, getSession } from '../utils/session';
import { logger } from '../utils/logger';
import DoctorSlotManager from '../components/DoctorSlotManager';
import DoctorAppointmentQueue from '../components/DoctorAppointmentQueue';
import { disconnectRealtimeSocket, getRealtimeSocket } from '../utils/realtime';

const emitToast = (type, message) => {
  window.dispatchEvent(new CustomEvent('ayurit:toast', { detail: { type, message } }));
};

// ─── Scoped Dashboard Styles ─────────────────────────────────────────────
const DashboardStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&display=swap');

    /* Force baseline layout and avoid forced viewport overflow jumps */
    body, html, #root {
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      min-width: 100% !important;
      min-height: 100% !important;
      overflow-x: hidden;
    }

    .dashboard-root {
      font-family: 'Poppins', sans-serif;
      background: #F7F3EE;
      position: relative;
      width: 100%;
      min-height: 100vh;
      display: flex;
      color: #1A1714;
      overflow: hidden;
      z-index: 1;
      text-align: left;
    }

    .sidebar {
      background: linear-gradient(180deg, #04120E 0%, #0D4A4A 100%);
      width: 260px;
      color: white;
      display: flex;
      flex-direction: column;
      height: 100vh;
      flex-shrink: 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      margin: 4px 16px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      font-weight: 500;
    }
    
    .nav-item:hover {
      background: rgba(62, 207, 178, 0.1);
      color: #3ECFB2;
    }

    .nav-item.active {
      background: rgba(62, 207, 178, 0.15);
      color: #3ECFB2;
      border: 1px solid rgba(62, 207, 178, 0.3);
    }

    .content-area {
      flex: 1;
      padding: 32px 40px;
      overflow-y: auto;
      height: 100vh;
      position: relative;
    }

    .btn-mint {
      background: linear-gradient(135deg, #3ECFB2, #2BB89D);
      color: #051C15;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }
    .btn-mint:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(62,207,178,0.4);
    }

    .white-card {
      background: #FFFFFF;
      border-radius: 20px;
      border: 1px solid #EDE8DF;
      box-shadow: 0 10px 30px rgba(13, 74, 74, 0.03);
    }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #DDD6CA; border-radius: 8px; }

    /* Dosha Bars */
    .dosha-bar-container {
      height: 8px;
      background: #F0EBE3;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      width: 100%;
    }
    .dosha-fill {
      height: 100%;
      transition: width 0.5s ease-out;
    }
  `}</style>
);

export default function DoctorDashboard() {
  const [activeView, setActiveView] = useState('overview'); 
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getSession()?.user || null);
  const [patients, setPatients] = useState([]);
  const [foods, setFoods] = useState([]);
  const [charts, setCharts] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [apptLoading, setApptLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showLoadingHint, setShowLoadingHint] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Diet Chart Builder State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [mealPlan, setMealPlan] = useState({ morning: [], afternoon: [], evening: [] });
  const [foodSearch, setFoodSearch] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoadingData(true);
      setShowLoadingHint(false);
      setErrorMsg('');

      const loadingHintTimer = window.setTimeout(() => {
        if (!currentUser) {
          setShowLoadingHint(true);
        }
      }, 500);

      try {
        // Fetch current user data
        const userData = await apiRequest('/auth/me');
        setCurrentUser(userData?.user || userData);
        // load appointments for doctor
        try {
          setApptLoading(true);
          const doctorId = (userData?.user || userData)?.id;
          if (doctorId) {
            const [allAppts, pending] = await Promise.all([
              apiRequest(`/appointments/doctor/queue`),
              apiRequest(`/appointments?doctorId=${doctorId}&status=requested`)
            ]).catch(() => [[], []]);
            setAppointments(Array.isArray(allAppts) ? allAppts : []);
            setPendingApprovals(Array.isArray(pending) ? pending : []);
          }
        } catch (e) {
          setAppointments([]);
          setPendingApprovals([]);
        } finally {
          setApptLoading(false);
        }

        const [patientData, foodData, chartData, dietPlansRes] = await Promise.all([
          apiRequest('/patients'),
          apiRequest('/foods'),
          apiRequest('/charts'),
          apiRequest('/ai/diet-plans', { suppressToast: true })
        ]);

        const normalizedPatients = patientData.map((p) => ({
          id: String(p.id || p._id || ''),
          name: p.name,
          age: p.profile?.age || 0,
          gender: p.profile?.gender || 'Unknown',
          prakriti: (p.profile?.prakriti || 'unknown').replace('_', '-'),
          condition: p.profile?.chronicConds || 'No active condition',
          digestion: p.profile?.digestion || 'N/A',
          createdAt: p.createdAt || null,
        }));

        const normalizedFoods = foodData.map((f) => ({
          id: String(f.id || f._id || Math.floor(Math.random() * 100000)),
          name: f.name,
          rasa: f.rasa || 'Unknown',
          virya: f.virya || 'Unknown',
          vipaka: f.vipaka || 'Unknown',
          kcal: Number(f.calories || f.kcal || 0),
          protein: Number(f.protein || 0),
          carbs: Number(f.carbs || 0),
          fat: Number(f.fats || f.fat || 0),
          impact: f.impact || { vata: 0, pitta: 0, kapha: 0 },
        }));

        setPatients(normalizedPatients.length ? normalizedPatients : []);
        setFoods(normalizedFoods.length ? normalizedFoods : []);
        setCharts(Array.isArray(chartData) ? chartData : []);
        setDietPlans(Array.isArray(dietPlansRes) ? dietPlansRes : []);
      } catch (err) {
        setErrorMsg(`Failed to load dashboard data: ${err?.data?.message || err?.message || 'Network error'}`);
        setPatients([]);
        setFoods([]);
        setCharts([]);
      } finally {
        window.clearTimeout(loadingHintTimer);
        setLoadingData(false);
        setShowLoadingHint(false);
      }
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!currentUser?.id) return;
      setNotificationsLoading(true);
      setNotificationsError('');
      try {
        const items = await apiRequest('/notifications');
        setNotifications(Array.isArray(items) ? items : []);
      } catch (err) {
        setNotifications([]);
        setNotificationsError(err?.data?.message || err?.message || 'Unable to load notifications');
      } finally {
        setNotificationsLoading(false);
      }
    };

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    let isActive = true;
    let socket = null;

    const handleAppointmentEvent = () => {
      refreshAppointments();
    };

    const initializeSocket = async () => {
      socket = await getRealtimeSocket();
      if (!isActive || !socket) return;

      socket.emit('join:user', String(currentUser.id));
      socket.emit('join:role', String(currentUser.role || 'doctor'));

      socket.on('appointment:booked', handleAppointmentEvent);
      socket.on('appointment:statusUpdated', handleAppointmentEvent);
    };

    initializeSocket();

    return () => {
      isActive = false;
      if (socket) {
        socket.off('appointment:booked', handleAppointmentEvent);
        socket.off('appointment:statusUpdated', handleAppointmentEvent);
      }
      disconnectRealtimeSocket();
    };
  }, [currentUser?.id, currentUser?.role]);

  const unreadNotificationCount = notifications.filter((item) => !item.isRead).length;

  const refreshNotifications = async () => {
    if (!currentUser?.id) return;
    setNotificationsLoading(true);
    try {
      const items = await apiRequest('/notifications');
      setNotifications(Array.isArray(items) ? items : []);
    } catch (err) {
      setNotificationsError(err?.data?.message || err?.message || 'Unable to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await apiRequest(`/notifications/${notificationId}/read`, { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => String(item.id) === String(notificationId) ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to mark notification as read');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: "PATCH" });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })));
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to mark all notifications as read');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // ─── Helper Functions ──────────────────────────────────────────────────
  const getSelectedPatient = () => patients.find((p) => String(p.id) === String(selectedPatientId));

  const addFoodToMeal = (mealSlot, food) => {
    setMealPlan(prev => ({
      ...prev,
      [mealSlot]: [...prev[mealSlot], food]
    }));
  };

  const removeFoodFromMeal = (mealSlot, index) => {
    setMealPlan(prev => {
      const newMeal = [...prev[mealSlot]];
      newMeal.splice(index, 1);
      return { ...prev, [mealSlot]: newMeal };
    });
  };

  const calculateTotals = () => {
    const allFoods = [...mealPlan.morning, ...mealPlan.afternoon, ...mealPlan.evening];
    return allFoods.reduce((acc, food) => {
      acc.kcal += food.kcal;
      acc.protein += food.protein;
      acc.carbs += food.carbs;
      acc.fat += food.fat;
      acc.vata += food.impact.vata;
      acc.pitta += food.impact.pitta;
      acc.kapha += food.impact.kapha;
      return acc;
    }, { kcal: 0, protein: 0, carbs: 0, fat: 0, vata: 50, pitta: 50, kapha: 50 });
  };

  const totals = calculateTotals();

  const avgAdherence = charts.length
    ? Math.round(charts.reduce((sum, item) => sum + Number(item.value || 0), 0) / charts.length)
    : 0;

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const now = new Date();
  const monthlyGrowth = monthLabels.map((label, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (monthLabels.length - 1 - i), 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const count = patients.filter((p) => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length;
    return { month: label, val: count };
  });

  const doshaDistribution = [
    { label: 'Vata Dominant', key: 'vata', color: '#0C447C' },
    { label: 'Pitta Dominant', key: 'pitta', color: '#C9A84C' },
    { label: 'Kapha Dominant', key: 'kapha', color: '#0D4A4A' }
  ].map((entry) => {
    const count = patients.filter((p) => String(p.prakriti || '').toLowerCase().includes(entry.key)).length;
    const pct = patients.length ? Math.round((count / patients.length) * 100) : 0;
    return { ...entry, pct };
  });

  const downloadCsv = (filename, rows) => {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExportReportCsv = () => {
    const rows = [
      ['metric', 'value'],
      ['active_patients', patients.length],
      ['average_adherence', avgAdherence],
      ['charts_generated', charts.length]
    ];
    downloadCsv('clinic-analytics.csv', rows);
  };

  const handleExportChartCsv = () => {
    if (!selectedPatientId) return;
    const rows = [
      ['meal_slot', 'food_name', 'kcal', 'protein', 'carbs', 'fat']
    ];
    ['morning', 'afternoon', 'evening'].forEach((slot) => {
      mealPlan[slot].forEach((food) => {
        rows.push([slot, food.name, food.kcal, food.protein, food.carbs, food.fat]);
      });
    });
    downloadCsv('diet-chart.csv', rows);
  };

  const handleSaveDietChart = async () => {
    if (!selectedPatientId) {
      setErrorMsg('Select a patient before saving a diet chart.');
      return;
    }
    // Diet charts / clinical endpoints removed in this build.
    // Avoid calling the removed API and show a helpful message instead.
    setErrorMsg('Diet chart saving is disabled in this build.');
  };

  const refreshAppointments = async () => {
    if (!currentUser?.id) return;
    setApptLoading(true);
    try {
      const [allAppts, pending] = await Promise.all([
        apiRequest(`/appointments/doctor/queue`),
        apiRequest(`/appointments?doctorId=${currentUser.id}&status=requested`)
      ]).catch(() => [[], []]);
      setAppointments(Array.isArray(allAppts) ? allAppts : []);
      setPendingApprovals(Array.isArray(pending) ? pending : []);
    } catch (err) {
      // ignore
    } finally {
      setApptLoading(false);
    }
  };

  const refreshDietPlans = async () => {
    try {
      const plans = await apiRequest('/ai/diet-plans', { suppressToast: true });
      setDietPlans(Array.isArray(plans) ? plans : []);
    } catch (err) {
      logger.error('Error refreshing diet plans:', err);
    }
  };

  const handleApproveDiet = async (id) => {
    if (!currentUser || String(currentUser.role).toLowerCase() !== 'doctor') {
      emitToast('info', 'Only doctors can approve diet plans.');
      return;
    }

    try {
      await apiRequest(`/ai/diet-plans/${id}/approve`, { method: "PUT", suppressToast: true });
      emitToast('success', 'Diet approved');
      await refreshDietPlans();
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to approve diet');
    }
  };

  const handleRejectDiet = async (id) => {
    if (!currentUser || String(currentUser.role).toLowerCase() !== 'doctor') {
      emitToast('info', 'Only doctors can reject diet plans.');
      return;
    }

    const reason = window.prompt('Reason for rejection (optional):');
    try {
      await apiRequest(`/ai/diet-plans/${id}/reject`, { method: "PUT", body: JSON.stringify({ reason }), suppressToast: true });
      emitToast('success', 'Diet rejected');
      await refreshDietPlans();
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to reject diet');
    }
  };

  const handleUpdateAppointmentStatus = async (id, status) => {
    try {
      await apiRequest(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      emitToast('success', `Appointment ${status}`);
      await refreshAppointments();
    } catch (err) {
      emitToast('error', err?.data?.message || err?.message || 'Unable to update appointment');
    }
  };







  const handleAddCustomFood = async () => {
    const name = window.prompt('Food name');
    if (!name) return;
    const calories = Number(window.prompt('Calories', '100') || 0);
    const protein = Number(window.prompt('Protein (g)', '5') || 0);
    const carbs = Number(window.prompt('Carbs (g)', '10') || 0);
    const fats = Number(window.prompt('Fats (g)', '3') || 0);

    try {
      const created = await apiRequest('/foods', {
        method: 'POST',
        body: JSON.stringify({ name, calories, protein, carbs, fats })
      });
      setFoods((prev) => ([
        {
          id: Number(created.id || Date.now()),
          name: created.name,
          rasa: created.rasa || 'Unknown',
          virya: created.virya || 'Unknown',
          vipaka: created.vipaka || 'Unknown',
          kcal: Number(created.calories || 0),
          protein: Number(created.protein || 0),
          carbs: Number(created.carbs || 0),
          fat: Number(created.fats || 0),
          impact: created.impact || { vata: 0, pitta: 0, kapha: 0 }
        },
        ...prev
      ]));
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to add custom food.');
    }
  };

  // ─── Sub-Components (Views) ────────────────────────────────────────────

  const OverviewView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#1A1714]">Welcome, {currentUser?.name || 'Doctor'}</h1>
          <p className="text-[#8B857D] text-sm mt-1">Here is what's happening in your clinic today.</p>
        </div>
        <button onClick={() => setActiveView('builder')} className="btn-mint px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Create Diet Chart
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Active Patients', value: String(patients.length), icon: Users, color: '#3ECFB2' },
          { label: 'Pending Reviews', value: String(Math.max(0, patients.length - charts.length)), icon: Activity, color: '#C9A84C' },
          { label: 'Charts Generated', value: String(charts.length), icon: FileText, color: '#0F6B6B' }
        ].map((stat, i) => (
          <div key={i} className="white-card p-6 flex items-center gap-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('reports')}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
              <stat.icon className="w-7 h-7" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-3xl font-bold text-[#1A1714]">{stat.value}</div>
              <div className="text-sm text-[#8B857D] font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="white-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-xs text-[#8B857D] uppercase tracking-wider font-semibold mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#3ECFB2]" /> Notifications
            </div>
            <h3 className="text-lg font-semibold text-[#1A1714]">Inbox {unreadNotificationCount ? `(${unreadNotificationCount} unread)` : ''}</h3>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={refreshNotifications} className="px-4 py-2 rounded-xl bg-white/5 text-[#0F6B6B] border border-[#EDE8DF] text-sm font-semibold hover:bg-[#F7FCFA] transition-all">
              {notificationsLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={handleMarkAllNotificationsRead} className="btn-mint px-4 py-2 rounded-xl text-sm">
              Mark All Read
            </button>
          </div>
        </div>

        {notificationsError ? <div className="mb-4 text-sm text-[#B45309]">{notificationsError}</div> : null}

        {notificationsLoading ? (
          <div className="text-sm text-[#8B857D]">Loading notifications…</div>
        ) : notifications.length ? (
          <div className="space-y-3">
            {notifications.slice(0, 8).map((item) => (
              <div key={item.id} className={`p-4 rounded-xl border ${item.isRead ? 'border-[#EDE8DF] bg-white' : 'border-[#3ECFB2]/30 bg-[#E1F5EE]'}`}>
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#1A1714] text-sm flex items-center gap-2">
                      {!item.isRead ? <span className="w-2 h-2 rounded-full bg-[#3ECFB2]" /> : null}
                      {item.title || 'Notification'}
                    </div>
                    <div className="text-xs text-[#8B857D] mt-1">{item.message || ''}</div>
                    <div className="text-[11px] text-[#8B857D] mt-2 uppercase tracking-wider">{item.type || 'update'} • {new Date(item.createdAt || Date.now()).toLocaleString()}</div>
                  </div>
                  {!item.isRead ? (
                    <button onClick={() => handleMarkNotificationRead(item.id)} className="px-3 py-1.5 rounded-lg bg-[#3ECFB2] text-black text-xs font-semibold">Read</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#8B857D]">No notifications yet.</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 white-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Today's Appointments</h3>
            <button onClick={() => setActiveView('patients')} className="text-sm text-[#0F6B6B] font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {apptLoading ? (
              <div className="text-sm text-[#8B857D]">Loading appointments…</div>
            ) : (
              <>
                {pendingApprovals.length > 0 && (
                  <div className="mb-3">
                    <div className="text-sm text-[#8B857D] mb-2">Pending Approvals</div>
                    {pendingApprovals.map((apt) => (
                      <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl border border-[#EDE8DF] hover:bg-[#F7FCFA] transition-colors mb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] text-white flex items-center justify-center font-semibold">{(apt.patientName||apt.patientId||'P').charAt(0)}</div>
                          <div>
                            <div className="font-semibold text-[#1A1714]">{apt.patientName || apt.patientId}</div>
                            <div className="text-xs text-[#8B857D]">{new Date(apt.dateTime).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'booked')} className="px-3 py-1.5 rounded-lg bg-[#3ECFB2] text-black text-xs font-semibold">Approve</button>
                          <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'cancelled')} className="px-3 py-1.5 rounded-lg bg-white/5 text-[#1A1714] text-xs font-semibold border border-[#EDE8DF]">Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-[#8B857D] mb-2">Upcoming</div>
                {appointments.length ? appointments.map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl border border-[#EDE8DF] hover:bg-[#F7FCFA] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] text-white flex items-center justify-center font-semibold">{(apt.patientName||apt.patientId||'P').charAt(0)}</div>
                      <div>
                        <div className="font-semibold text-[#1A1714]">{apt.patientName || apt.patientId}</div>
                        <div className="text-xs text-[#8B857D]">{new Date(apt.dateTime).toLocaleString()} • {apt.status}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {apt.status !== 'completed' && (
                        <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'completed')} className="px-4 py-1.5 rounded-lg bg-[#E1F5EE] text-[#0F6B6B] text-xs font-semibold hover:bg-[#3ECFB2] hover:text-white transition-colors">Mark Complete</button>
                      )}
                      <button onClick={() => { setSelectedPatientId(apt.patientId); setActiveView('builder'); }} className="px-4 py-1.5 rounded-lg bg-[#E1F5EE] text-[#0F6B6B] text-xs font-semibold hover:bg-[#3ECFB2] hover:text-white transition-colors">Open Chart</button>
                    </div>
                  </div>
                )) : (
                  <div className="text-xs text-[#8B857D]">No upcoming appointments.</div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="white-card p-6">
          <h3 className="text-lg font-semibold mb-6">AI Insights</h3>
          <div className="space-y-4">
            {patients.length === 0 ? (
              <p className="text-xs text-[#8B857D]">No patient data available. Add patients to see AI-generated insights.</p>
            ) : (
              <p className="text-xs text-[#8B857D]">AI insights will appear here as patient data is collected.</p>
            )}
          </div>
        </div>
        <div className="white-card p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Diet Approvals</h3>
          {dietPlans && dietPlans.length ? (
            dietPlans.filter(dp => dp.status !== 'approved').slice(0,5).map(dp => (
              <div key={dp.id} className="p-3 mb-3 rounded-lg border border-[#EDE8DF] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{dp.patientName || dp.patientId} • v{dp.version || 1}</div>
                  <div className="text-xs text-[#8B857D]">Status: {dp.status || 'active'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleApproveDiet(dp.id)} className="px-3 py-1.5 rounded-lg bg-[#3ECFB2] text-black text-xs font-semibold">Approve</button>
                  <button onClick={() => handleRejectDiet(dp.id)} className="px-3 py-1.5 rounded-lg bg-white/5 text-[#1A1714] text-xs font-semibold border border-[#EDE8DF]">Reject</button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-[#8B857D]">No pending diet approvals.</div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const PatientsView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1714]">Patient Records</h1>
          <p className="text-[#8B857D] text-sm mt-1">Manage your clinic's patients and their Dosha profiles.</p>
        </div>
        <button onClick={() => setErrorMsg('Patient onboarding is handled in Front Desk > Patient Intake.')} className="btn-mint px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Patient
        </button>
      </div>
      
      <div className="white-card flex-1 overflow-hidden flex flex-col pb-6">
         <div className="p-5 border-b border-[#EDE8DF] flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B857D]" />
              <input type="text" placeholder="Search patients by name or condition..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8DF] bg-[#F7F3EE] outline-none focus:border-[#3ECFB2] text-sm" />
            </div>
            <select className="px-4 py-2.5 rounded-xl border border-[#EDE8DF] bg-[#F7F3EE] text-sm outline-none focus:border-[#3ECFB2]">
              <option>All Prakritis</option>
              <option>Vata</option>
              <option>Pitta</option>
              <option>Kapha</option>
            </select>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar">
           <table className="w-full text-sm text-left">
             <thead className="bg-[#F7FCFA] sticky top-0 z-10 shadow-sm">
               <tr className="text-[#8B857D]">
                 <th className="py-4 px-6 font-medium">Patient Name</th>
                 <th className="py-4 px-6 font-medium">Age/Gender</th>
                 <th className="py-4 px-6 font-medium">Prakriti</th>
                 <th className="py-4 px-6 font-medium">Primary Condition</th>
                 <th className="py-4 px-6 font-medium text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               {patients.map(p => (
                 <tr key={p.id} className="border-b border-[#EDE8DF] hover:bg-[#F7FCFA] transition-colors">
                   <td className="py-4 px-6 font-medium text-[#1A1714]">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] text-white flex items-center justify-center font-bold">{p.name.charAt(0)}</div>
                       {p.name}
                     </div>
                   </td>
                   <td className="py-4 px-6 text-[#5C564F]">{p.age} • {p.gender}</td>
                   <td className="py-4 px-6">
                     <span className="px-3 py-1 rounded-full bg-[#E1F5EE] text-[#0F6B6B] text-xs font-semibold">{p.prakriti}</span>
                   </td>
                   <td className="py-4 px-6 text-[#5C564F]">{p.condition}</td>
                   <td className="py-4 px-6 text-right">
                     <button onClick={() => { setSelectedPatientId(p.id); setActiveView('builder'); }} className="text-[#3ECFB2] font-semibold hover:text-[#0D4A4A] transition-colors">View Chart</button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
      </div>
    </motion.div>
  );

  const FoodDatabaseView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1714]">Food Database</h1>
          <p className="text-[#8B857D] text-sm mt-1">{foods.length ? `${foods.length.toLocaleString()} indexed foods` : 'Food catalog'} with Ayurvedic properties and modern macros.</p>
        </div>
        <button onClick={handleAddCustomFood} className="btn-mint px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Add Custom Food
        </button>
      </div>
      
      <div className="white-card flex-1 overflow-hidden flex flex-col pb-6">
         <div className="p-5 border-b border-[#EDE8DF] flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B857D]" />
              <input type="text" placeholder="Search by food name, Rasa, or Virya..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#EDE8DF] bg-[#F7F3EE] outline-none focus:border-[#3ECFB2] text-sm" />
            </div>
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
             {foods.map(f => (
               <div key={f.id} className="p-5 rounded-2xl border border-[#EDE8DF] bg-white shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="font-semibold text-[#1A1714] text-lg leading-tight">{f.name}</h3>
                   <button className="text-[#8B857D] hover:text-[#3ECFB2] transition-colors"><Plus className="w-5 h-5"/></button>
                 </div>
                 <div className="flex flex-wrap gap-2 mb-5">
                   <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E1F5EE] text-[#0F6B6B]">Rasa: {f.rasa}</span>
                   <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FCEBEB] text-[#791F1F]">Virya: {f.virya}</span>
                 </div>
                 <div className="grid grid-cols-4 gap-2 text-center border-t border-[#EDE8DF] pt-4">
                   <div><div className="text-[10px] text-[#8B857D] font-medium uppercase mb-0.5">Kcal</div><div className="font-semibold text-sm text-[#0D4A4A]">{f.kcal}</div></div>
                   <div><div className="text-[10px] text-[#8B857D] font-medium uppercase mb-0.5">Pro</div><div className="font-semibold text-sm text-[#1A1714]">{f.protein}g</div></div>
                   <div><div className="text-[10px] text-[#8B857D] font-medium uppercase mb-0.5">Carbs</div><div className="font-semibold text-sm text-[#1A1714]">{f.carbs}g</div></div>
                   <div><div className="text-[10px] text-[#8B857D] font-medium uppercase mb-0.5">Fat</div><div className="font-semibold text-sm text-[#1A1714]">{f.fat}g</div></div>
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
    </motion.div>
  );

  const DietChartBuilderView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1714]">Diet Chart Generator</h1>
          <p className="text-[#8B857D] text-sm">Blend Ayurveda with modern macros.</p>
        </div>
        {selectedPatientId && (
          <button onClick={handleExportChartCsv} className="btn-mint px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Export PDF
          </button>
        )}
      </div>

      {selectedPatientId && (
        <div className="mb-4">
          <button onClick={handleSaveDietChart} className="btn-mint px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4" /> Save Diet Chart
          </button>
        </div>
      )}

      <div className="flex gap-6 flex-1 min-h-0 pb-6">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="white-card p-5">
            <label className="block text-xs font-semibold text-[#8B857D] uppercase tracking-wider mb-2">Select Patient Context</label>
            <div className="relative">
              <select 
                value={selectedPatientId} 
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full appearance-none p-3 rounded-xl border border-[#EDE8DF] bg-[#F7F3EE] font-medium outline-none focus:border-[#3ECFB2]"
              >
                <option value="">-- Choose a patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.prakriti})</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B857D] pointer-events-none" />
            </div>

            {selectedPatientId && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-[#E1F5EE] text-[#0F6B6B] text-xs font-semibold">Prakriti: {getSelectedPatient().prakriti}</span>
                <span className="px-3 py-1 rounded-full bg-[#FAEEDA] text-[#633806] text-xs font-semibold">Digestion: {getSelectedPatient().digestion}</span>
                <span className="px-3 py-1 rounded-full bg-[#FCEBEB] text-[#791F1F] text-xs font-semibold">Focus: {getSelectedPatient().condition}</span>
              </motion.div>
            )}
          </div>

          {selectedPatientId && (
            <div className="space-y-4">
              {['morning', 'afternoon', 'evening'].map(slot => (
                <div key={slot} className="white-card p-5">
                  <div className="flex justify-between items-center mb-4 border-b border-[#EDE8DF] pb-3">
                    <h3 className="font-semibold text-[#1A1714] capitalize flex items-center gap-2">
                      {slot === 'morning' ? '🌅' : slot === 'afternoon' ? '☀️' : '🌙'} {slot} Meal
                    </h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    {mealPlan[slot].map((food, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#F7F3EE] border border-[#EDE8DF]">
                        <div>
                          <div className="font-medium text-sm text-[#1A1714]">{food.name}</div>
                          <div className="text-[11px] text-[#8B857D] mt-0.5">{food.rasa} • {food.virya}</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-semibold text-[#0F6B6B]">{food.kcal} kcal</span>
                          <button onClick={() => removeFoodFromMeal(slot, idx)} className="text-[#E24B4A] hover:bg-[#FCEBEB] p-1.5 rounded-md transition-colors">×</button>
                        </div>
                      </div>
                    ))}
                    {mealPlan[slot].length === 0 && (
                      <div className="text-xs text-[#8B857D] text-center py-4 border border-dashed border-[#DDD6CA] rounded-lg">No foods added yet.</div>
                    )}
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={`Search ${foods.length ? foods.length.toLocaleString() : 'foods'} to add to ${slot}...`} 
                      className="w-full p-3 pl-10 rounded-xl border border-[#EDE8DF] bg-white text-sm outline-none focus:border-[#3ECFB2]"
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B857D]" />
                    
                    {foodSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EDE8DF] rounded-xl shadow-xl z-10 overflow-hidden">
                        {foods.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())).map(food => (
                          <div 
                            key={food.id} 
                            onClick={() => { addFoodToMeal(slot, food); setFoodSearch(''); }}
                            className="p-3 border-b border-[#EDE8DF] hover:bg-[#F7FCFA] cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="text-sm font-medium">{food.name}</div>
                              <div className="text-[10px] text-[#8B857D] mt-0.5">{food.virya} • {food.vipaka} Vipaka</div>
                            </div>
                            <div className="text-[#3ECFB2]"><Plus className="w-4 h-4" /></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-[340px] flex-shrink-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <div className="white-card p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E1F5EE] rounded-full blur-[40px] -z-10 opacity-60" />
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3ECFB2]" /> Dosha Impact
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="flex items-center gap-1 text-[#0C447C]"><Wind className="w-3 h-3"/> Vata (Air/Space)</span>
                  <span className={totals.vata > 60 ? 'text-[#E24B4A]' : 'text-[#8B857D]'}>{totals.vata > 60 ? 'Aggravated' : 'Balanced'}</span>
                </div>
                <div className="dosha-bar-container">
                  <div className="dosha-fill bg-[#0C447C]" style={{ width: `${Math.max(0, Math.min(100, totals.vata))}%` }} />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="flex items-center gap-1 text-[#C9A84C]"><Flame className="w-3 h-3"/> Pitta (Fire/Water)</span>
                  <span className={totals.pitta > 60 ? 'text-[#E24B4A]' : 'text-[#8B857D]'}>{totals.pitta > 60 ? 'Aggravated' : 'Balanced'}</span>
                </div>
                <div className="dosha-bar-container">
                  <div className="dosha-fill bg-[#C9A84C]" style={{ width: `${Math.max(0, Math.min(100, totals.pitta))}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5">
                  <span className="flex items-center gap-1 text-[#0D4A4A]"><Droplets className="w-3 h-3"/> Kapha (Water/Earth)</span>
                  <span className={totals.kapha > 60 ? 'text-[#E24B4A]' : 'text-[#8B857D]'}>{totals.kapha > 60 ? 'Aggravated' : 'Balanced'}</span>
                </div>
                <div className="dosha-bar-container">
                  <div className="dosha-fill bg-[#0D4A4A]" style={{ width: `${Math.max(0, Math.min(100, totals.kapha))}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-lg bg-black/5 text-[11px] text-[#5C564F] leading-relaxed">
              <strong>AI Note:</strong> Keep Dosha bars below 60% to prevent aggravation. Add cooling (Sheetal) foods to lower Pitta.
            </div>
          </div>

          <div className="white-card p-6 flex-1">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0F6B6B]" /> Modern Macros
            </h3>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-[#0D4A4A]">{totals.kcal}</div>
              <div className="text-xs font-medium text-[#8B857D] uppercase tracking-wider mt-1">Total Calories</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-[#F7F3EE] rounded-xl text-center border border-[#EDE8DF]">
                <div className="text-xs text-[#8B857D] mb-1">Protein</div>
                <div className="font-semibold">{totals.protein}g</div>
              </div>
              <div className="p-3 bg-[#F7F3EE] rounded-xl text-center border border-[#EDE8DF]">
                <div className="text-xs text-[#8B857D] mb-1">Carbs</div>
                <div className="font-semibold">{totals.carbs}g</div>
              </div>
              <div className="p-3 bg-[#F7F3EE] rounded-xl text-center border border-[#EDE8DF]">
                <div className="text-xs text-[#8B857D] mb-1">Fats</div>
                <div className="font-semibold">{totals.fat}g</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ReportsView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1714]">Analytics & Reports</h1>
          <p className="text-[#8B857D] text-sm mt-1">Clinic-wide insights and patient progress trends.</p>
        </div>
        <button onClick={handleExportReportCsv} className="btn-mint px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6">
          <div className="white-card p-5 border-l-4 border-l-[#3ECFB2]">
            <div className="text-sm text-[#8B857D] mb-1">Total Active Patients</div>
            <div className="text-3xl font-bold text-[#1A1714]">{patients.length}</div>
            <div className="text-xs text-[#3ECFB2] mt-2 font-medium">Live from patient records</div>
          </div>
          <div className="white-card p-5 border-l-4 border-l-[#C9A84C]">
            <div className="text-sm text-[#8B857D] mb-1">Avg. Diet Adherence</div>
            <div className="text-3xl font-bold text-[#1A1714]">{avgAdherence}%</div>
            <div className="text-xs text-[#C9A84C] mt-2 font-medium">Computed from logged chart entries</div>
          </div>
          <div className="white-card p-5 border-l-4 border-l-[#0F6B6B]">
            <div className="text-sm text-[#8B857D] mb-1">Charts Generated (MTD)</div>
            <div className="text-3xl font-bold text-[#1A1714]">{charts.length}</div>
            <div className="text-xs text-[#0F6B6B] mt-2 font-medium">Live from chart logs</div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Custom Bar Chart for Patient Growth */}
          <div className="white-card p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-[#3ECFB2]"/> Patient Growth</h3>
            <div className="flex items-end justify-between h-48 gap-2 mt-4">
              {monthlyGrowth.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: `${monthlyGrowth.some((m) => m.val > 0) ? (d.val / Math.max(...monthlyGrowth.map((m) => m.val), 1)) * 100 : 0}%` }} transition={{ delay: i*0.1 }}
                    className="w-full bg-gradient-to-t from-[#0D4A4A] to-[#3ECFB2] rounded-t-md opacity-90 hover:opacity-100 transition-opacity relative group"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{d.val}</div>
                  </motion.div>
                  <span className="text-xs text-[#8B857D] font-medium">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dosha Distribution */}
          <div className="white-card p-6 flex flex-col justify-between">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-[#C9A84C]"/> Clinic Dosha Profile</h3>
            <div className="space-y-6">
              {doshaDistribution.map((d, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-[#1A1714]">{d.label}</span>
                    <span className="text-[#8B857D]">{d.pct}%</span>
                  </div>
                  <div className="h-3 bg-[#F0EBE3] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${d.pct}%` }} transition={{ delay: i*0.2 + 0.5, duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: d.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Nutrient Adequacy Table */}
        <div className="white-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Utensils className="w-5 h-5 text-[#0F6B6B]"/> Avg. Nutrient Adequacy (Clinic-Wide)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-[#EDE8DF] text-[#8B857D]">
                  <th className="pb-3 font-medium px-2">Nutrient</th>
                  <th className="pb-3 font-medium px-2">Avg Intake</th>
                  <th className="pb-3 font-medium px-2">Target</th>
                  <th className="pb-3 font-medium px-2 w-1/3">Adequacy Goal</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Protein', intake: '45g', target: '50g', pct: 90, color: '#3ECFB2' },
                  { name: 'Iron', intake: '12mg', target: '18mg', pct: 66, color: '#E24B4A' },
                  { name: 'Calcium', intake: '800mg', target: '1000mg', pct: 80, color: '#C9A84C' },
                  { name: 'Vitamin C', intake: '75mg', target: '65mg', pct: 100, color: '#3ECFB2' }
                ].map((row, i) => (
                  <tr key={i} className="border-b border-[#EDE8DF] last:border-0 hover:bg-[#F7FCFA] transition-colors">
                    <td className="py-3 font-medium text-[#1A1714] px-2">{row.name}</td>
                    <td className="py-3 text-[#5C564F] px-2">{row.intake}</td>
                    <td className="py-3 text-[#5C564F] px-2">{row.target}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2.5 bg-[#F0EBE3] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, row.pct)}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ backgroundColor: row.color }} />
                        </div>
                        <span className="text-xs font-semibold w-8 text-right" style={{ color: row.color }}>{row.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const PlaceholderView = ({ title }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-20 h-20 bg-[#E1F5EE] rounded-full flex items-center justify-center mb-4">
        <Settings className="w-10 h-10 text-[#3ECFB2]" />
      </div>
      <h2 className="text-2xl font-semibold text-[#1A1714] mb-2">{title} Module</h2>
      <p className="text-[#8B857D]">This module settings are managed by your clinic's Super Admin.</p>
    </motion.div>
  );

  const ConsultationsView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1714]">Consultations</h1>
          <p className="text-[#8B857D] text-sm mt-1">Open consultation details, add notes, prescriptions, and follow-ups.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refreshAppointments} className="px-4 py-2 rounded-xl bg-white/5 text-[#0F6B6B] border border-[#EDE8DF]">Refresh</button>
          <button onClick={refreshDietPlans} className="btn-mint px-4 py-2 rounded-xl">Reload Data</button>
        </div>
      </div>

      {consultationSyncError ? (
        <div className="white-card p-4 text-sm text-[#B45309] border border-[#F59E0B]/20">{consultationSyncError}</div>
      ) : null}

      {consultationSyncMessage ? (
        <div className="white-card p-4 text-sm text-[#0F6B6B] border border-[#3ECFB2]/20">{consultationSyncMessage}</div>
      ) : null}

      {activeConsultationSession?.roomId ? (
        <div className="white-card overflow-hidden">
          <div className="p-4 border-b border-[#EDE8DF] flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#8B857D] uppercase tracking-wider">Active Consultation Room</div>
              <div className="font-semibold text-[#1A1714]">{activeConsultationSession.roomId}</div>
            </div>
            <div className="text-xs text-[#8B857D]">Status: {activeConsultationSession.status || 'in-progress'}</div>
          </div>
          <div style={{ height: '68vh', minHeight: '600px' }}>
            <VideoConsultation
              roomId={activeConsultationSession.roomId}
              userName={currentUser?.name || 'Doctor'}
              userRole={currentUser?.role || 'doctor'}
              appointmentId={activeConsultationSession.appointmentId}
              isDoctor
              onConsultationEnd={async () => {
                setActiveConsultationSession(null);
                await refreshAppointments();
                await refreshConsultations();
              }}
            />
          </div>
        </div>
      ) : null}
    </motion.div>
  );

  return (
    <div className="dashboard-root">
      <DashboardStyles />
      
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="sidebar py-6">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#3ECFB2] flex items-center justify-center text-white shadow-lg shadow-[#3ECFB2]/20">
            <span className="text-lg font-bold">✦</span>
          </div>
          <div>
            <div className="font-bold text-lg leading-none">AyurIT</div>
            <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Clinical Hub</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-8 mb-2 mt-4">Menu</div>
          <div 
            className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </div>
          <div 
            className={`nav-item ${activeView === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveView('patients')}
          >
            <Users className="w-5 h-5" /> Patient Records
          </div>
          <div 
            className={`nav-item ${activeView === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveView('builder')}
          >
            <Utensils className="w-5 h-5" /> Diet Chart Builder
          </div>
          <div 
            className={`nav-item ${activeView === 'food' ? 'active' : ''}`}
            onClick={() => setActiveView('food')}
          >
            <Database className="w-5 h-5" /> Food Database
          </div>
          <div 
            className={`nav-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          >
            <FileText className="w-5 h-5" /> Reports & Analytics
          </div>

          <div className="text-[11px] font-semibold text-white/40 uppercase tracking-wider px-8 mb-2 mt-8">System</div>
          <div 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <Settings className="w-5 h-5" /> Clinic Settings
          </div>
          <div 
            className={`nav-item ${activeView === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveView('appointments')}
          >
            <Calendar className="w-5 h-5" /> Appointments
          </div>
        </nav>

        <div className="px-4 mt-auto pt-4">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#3ECFB2] text-[#051C15] flex items-center justify-center font-bold">
                {(currentUser?.name || 'Doctor').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium">{currentUser?.name || 'Doctor'}</div>
                <div className="text-[10px] text-[#3ECFB2]">{(currentUser?.role || 'practitioner').charAt(0).toUpperCase() + (currentUser?.role || 'practitioner').slice(1)}</div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ──────────────────────────────────────────── */}
      <main className="content-area relative">
        {/* Subtle Background pattern for the content area */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#0D4A4A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        
        <div className="relative z-10 h-full">
          {showLoadingHint ? <div className="mb-4 text-sm text-[#8B857D]">Loading live data...</div> : null}
          {errorMsg ? <div className="mb-4 text-sm text-[#B45309]">{errorMsg}</div> : null}
          <AnimatePresence mode="wait">
            {activeView === 'overview' && <OverviewView key="overview" />}
            {activeView === 'builder' && <DietChartBuilderView key="builder" />}
            {activeView === 'patients' && <PatientsView key="patients" />}
            {activeView === 'food' && <FoodDatabaseView key="food" />}
            {activeView === 'reports' && <ReportsView key="reports" />}
            {activeView === 'appointments' && (
              <div className="grid grid-cols-2 gap-8">
                <div><DoctorSlotManager key="slots" /></div>
                <div><DoctorAppointmentQueue key="queue" /></div>
              </div>
            )}
            {activeView === 'settings' && <PlaceholderView key="settings" title="Clinic Settings" />}
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
}
