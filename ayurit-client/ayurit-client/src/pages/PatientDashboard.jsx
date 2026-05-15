import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Utensils, BookOpen, Activity, Calendar, 
  LogOut, ChevronRight, Droplets, Wind, Flame, 
  Coffee, Sun, Moon, CheckCircle2, Sparkles, Smile, Frown, Meh, Leaf, Download, RefreshCw,
  Bell
} from 'lucide-react';

import { apiRequest, resolveApiBaseUrl } from '../utils/api';
import { clearSession, getAccessToken, getSession } from '../utils/session';
import { logger } from '../utils/logger';
import AppointmentBooking from '../components/AppointmentBooking';
import { getRealtimeSocket } from '../utils/realtime';

const normalizeAppointmentDate = (appt) => appt?.dateTime || appt?.startAt || appt?.date || appt?.slotTime || '';
const formatAppointmentDate = (appt) => {
  const raw = normalizeAppointmentDate(appt);
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? String(raw) : date.toLocaleString();
};

// ─── Scoped Premium Dark Theme Styles ────────────────────────────────────
const PatientStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&display=swap');

    body, html, #root {
      margin: 0 !important;
      padding: 0 !important;
      max-width: none !important;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .patient-root {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #04120E 0%, #0D4A4A 100%);
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      display: flex;
      color: #F7F3EE;
      overflow: hidden;
      z-index: 50;
      text-align: left;
    }

    /* Desktop Sidebar */
    .sidebar {
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(20px);
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      width: 280px;
      color: white;
      display: flex;
      flex-direction: column;
      height: 100vh;
      flex-shrink: 0;
      z-index: 20;
    }

    /* Mobile Bottom Nav */
    .mobile-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(5, 28, 21, 0.85);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 100;
      padding-bottom: env(safe-area-inset-bottom);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 24px;
      margin: 4px 16px;
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      font-weight: 500;
    }
    
    .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: #FFF; }
    .nav-item.active {
      background: rgba(62, 207, 178, 0.15);
      color: #3ECFB2;
      border: 1px solid rgba(62, 207, 178, 0.2);
    }

    .mobile-nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 0;
      color: rgba(255, 255, 255, 0.5);
      font-size: 11px;
      font-weight: 500;
      gap: 6px;
      transition: all 0.3s;
    }
    .mobile-nav-item.active { color: #3ECFB2; font-weight: 600; }

    .content-area {
      flex: 1;
      padding: 40px 48px;
      overflow-y: auto;
      height: 100vh;
      position: relative;
      z-index: 10;
    }

    /* Premium Glass Cards */
    .glass-card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      box-shadow: 0 24px 40px rgba(0, 0, 0, 0.15);
      transform: translateZ(0);
    }

    .btn-mint {
      background: linear-gradient(135deg, #3ECFB2, #2BB89D);
      color: #051C15;
      font-weight: 600;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }
    .btn-mint:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(62,207,178,0.3); }

    /* Glass Inputs */
    .glass-input {
      width: 100%; padding: 16px 20px; border-radius: 16px; 
      border: 1px solid rgba(255, 255, 255, 0.1); 
      background: rgba(0, 0, 0, 0.2); 
      font-family: 'Poppins', sans-serif; font-size: 14px; color: #FFF;
      outline: none; transition: all 0.3s ease;
      color-scheme: dark;
    }
    .glass-input:focus { border-color: #3ECFB2; background: rgba(0, 0, 0, 0.4); box-shadow: 0 0 0 3px rgba(62,207,178,0.15); }
    .glass-input::placeholder { color: rgba(255, 255, 255, 0.3); }

    /* Custom Radio Buttons for Logging */
    .radio-group input[type="radio"] { display: none; }
    .radio-group label {
      flex: 1; text-align: center; padding: 16px 8px; 
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px; cursor: pointer; transition: all 0.3s;
      display: flex; flex-direction: column; align-items: center; gap: 8px; 
      background: rgba(255, 255, 255, 0.03); color: rgba(255, 255, 255, 0.6);
    }
    .radio-group label:hover { background: rgba(255, 255, 255, 0.08); }
    .radio-group input[type="radio"]:checked + label {
      border-color: #3ECFB2; background: rgba(62, 207, 178, 0.15); 
      color: #3ECFB2; font-weight: 600;
    }

    .bg-grid-pattern {
      background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    .custom-scrollbar::-webkit-scrollbar { width: 0px; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .mobile-nav { display: flex; }
      .content-area { padding: 32px 24px 120px 24px; }
    }
  `}</style>
);

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
};

const buildDietPayload = (user, patientData) => ({
  age: Number(user?.profile?.age || patientData?.age || 22),
  gender: user?.profile?.gender || 'male',
  weight: Number(user?.profile?.weight || patientData?.weight || 70),
  height: Number(user?.profile?.height || patientData?.height || 175),
  prakriti: user?.profile?.prakriti || patientData?.prakriti?.toLowerCase?.() || 'vata',
  goal: user?.profile?.goal || patientData?.goal || 'general wellness',
  allergies: normalizeList(user?.profile?.allergies),
  diseases: normalizeList(user?.profile?.chronicConds),
  dietaryPreference: user?.profile?.dietaryPreference || 'vegetarian'
});

const formatPlanDate = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString();
};

const buildTodayChartFromPlan = (generatedDiet) => {
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const dayPlan = generatedDiet?.[today] || {};

  return {
    morning: dayPlan.Breakfast ? [{ name: dayPlan.Breakfast, qty: 'As prescribed', note: 'AI-generated breakfast.' }] : [],
    afternoon: dayPlan.Lunch ? [{ name: dayPlan.Lunch, qty: 'As prescribed', note: 'AI-generated lunch.' }] : [],
    evening: dayPlan.Dinner ? [{ name: dayPlan.Dinner, qty: 'As prescribed', note: 'AI-generated dinner.' }] : []
  };
};

const normalizeDietPlans = (plans) => (Array.isArray(plans) ? plans.filter(Boolean) : []).map((plan) => ({
  id: plan?.id || plan?._id || plan?.planId,
  createdAt: plan?.createdAt || plan?.generatedAt,
  version: Number(plan?.version || 1),
  patientName: plan?.patientName || '',
  input: plan?.input || plan?.dietPlan?.input || {},
  generatedDiet: plan?.generatedDiet || plan?.dietPlan?.generatedDiet || {},
  recommendations: plan?.recommendations || plan?.dietPlan?.recommendations || {},
  foodsToAvoid: plan?.foodsToAvoid || [],
  hydrationGuidance: plan?.hydrationGuidance || '',
  lifestyleRecommendations: plan?.lifestyleRecommendations || [],
  mealTimings: plan?.mealTimings || {},
  status: plan?.status || 'active'
}));

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatDietItems = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const emitToast = (type, message) => {
  window.dispatchEvent(new CustomEvent('ayurit:toast', {
    detail: { type, message }
  }));
};

const DailyLogView = React.memo(function DailyLogView({
  logData,
  setLogData,
  handleLogSubmit,
  logSubmitted,
  logSubmitting,
  dailyLogLoading,
  logError,
  dailyLogEntries = [],
}) {
  const isDevMode = false; // Fixed for canvas compatibility

  if (isDevMode) {
    logger.debug('DailyLogView', 'Rendering with entries', {
      count: dailyLogEntries.length,
    });
  }

  return (
    <motion.div key="log" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-3xl mx-auto h-full flex flex-col pb-8">
      <div className="mb-4">
        <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-tight mb-2 leading-none">Daily Log</h1>
        <p className="text-white/50 text-[15px] font-light mt-3">Track your meals, digestion, and energy for your wellness plan.</p>
      </div>

      {!logSubmitted ? (
        <form onSubmit={handleLogSubmit} className="flex-1 flex flex-col gap-6">
          <div className="glass-card p-6 md:p-8">
            <label className="block text-[12px] font-semibold text-white/50 uppercase tracking-widest mb-4">Which meal are you logging?</label>
            <div className="flex gap-3 md:gap-4 radio-group">
              <input type="radio" id="m-morn" name="meal" value="morning" checked={logData.meal === 'morning'} onChange={(e) => setLogData((prev) => ({ ...prev, meal: e.target.value }))} />
              <label htmlFor="m-morn"><Coffee className="w-6 h-6 mb-1"/> <span className="text-[13px]">Morning</span></label>

              <input type="radio" id="m-aft" name="meal" value="afternoon" checked={logData.meal === 'afternoon'} onChange={(e) => setLogData((prev) => ({ ...prev, meal: e.target.value }))} />
              <label htmlFor="m-aft"><Sun className="w-6 h-6 mb-1"/> <span className="text-[13px]">Afternoon</span></label>

              <input type="radio" id="m-eve" name="meal" value="evening" checked={logData.meal === 'evening'} onChange={(e) => setLogData((prev) => ({ ...prev, meal: e.target.value }))} />
              <label htmlFor="m-eve"><Moon className="w-6 h-6 mb-1"/> <span className="text-[13px]">Evening</span></label>
            </div>
          </div>

          <div className="glass-card p-6 md:p-8">
            <label className="block text-[12px] font-semibold text-white/50 uppercase tracking-widest mb-4">What did you eat?</label>
            <textarea
              className="glass-input min-h-[120px] resize-none"
              placeholder="e.g. I ate the prescribed Moong Dal, but added a side of yogurt..."
              value={logData.description}
              onChange={(e) => setLogData((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="glass-card p-6 md:p-8">
            <label className="block text-[12px] font-semibold text-white/50 uppercase tracking-widest mb-4">How is your digestion?</label>
            <div className="flex gap-3 md:gap-4 radio-group">
              <input type="radio" id="d-heavy" name="digestion" value="heavy" checked={logData.digestion === 'heavy'} onChange={(e) => setLogData((prev) => ({ ...prev, digestion: e.target.value }))} />
              <label htmlFor="d-heavy"><Frown className="w-8 h-8 mb-1"/> <span className="text-[13px]">Heavy / Bloated</span></label>

              <input type="radio" id="d-normal" name="digestion" value="normal" checked={logData.digestion === 'normal'} onChange={(e) => setLogData((prev) => ({ ...prev, digestion: e.target.value }))} />
              <label htmlFor="d-normal"><Meh className="w-8 h-8 mb-1"/> <span className="text-[13px]">Normal</span></label>

              <input type="radio" id="d-light" name="digestion" value="light" checked={logData.digestion === 'light'} onChange={(e) => setLogData((prev) => ({ ...prev, digestion: e.target.value }))} />
              <label htmlFor="d-light"><Smile className="w-8 h-8 mb-1"/> <span className="text-[13px]">Light / Good</span></label>
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" disabled={logSubmitting} className="btn-mint w-full py-4 md:py-5 rounded-2xl text-[16px] shadow-lg disabled:opacity-60 disabled:cursor-not-allowed">
              {logSubmitting ? 'Saving Daily Log...' : 'Save Daily Log'}
            </button>
            {dailyLogLoading ? <div className="mt-3 text-sm text-white/50">Loading previous entries...</div> : null}
            {logError ? <div className="mt-3 text-sm text-red-300">{logError}</div> : null}
          </div>

          {/* Previous Entries Section */}
          {dailyLogEntries.length > 0 && (
            <div className="glass-card p-6 md:p-8 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#3ECFB2]" /> Previous Entries ({dailyLogEntries.length})
              </h3>
              <div className="space-y-3">
                {dailyLogEntries.slice(0, 5).map((entry, idx) => {
                  const entryDate = new Date(entry.loggedAt || entry.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                  const mealType = String(entry.metric || 'meal_').replace('meal_', '');
                  return (
                    <div key={entry.id || idx} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div>
                        <div className="font-medium text-white text-sm capitalize">{mealType} Meal</div>
                        <div className="text-xs text-white/50 mt-1">{entryDate}</div>
                      </div>
                      <div className="text-sm font-semibold text-[#3ECFB2] bg-[#3ECFB2]/10 px-3 py-1 rounded-lg">
                        {Math.round(Number(entry.value || 0))} kcal
                      </div>
                    </div>
                  );
                })}
                {dailyLogEntries.length > 5 && (
                  <div className="text-center text-xs text-white/40 pt-2">
                    ... and {dailyLogEntries.length - 5} more entries
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      ) : (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex-1 flex flex-col items-center justify-center text-center mt-10 glass-card p-12">
          <div className="w-24 h-24 bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(62,207,178,0.4)] border border-white/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-3">Log Saved!</h2>
          <p className="text-white/60 text-[15px] font-light max-w-[300px]">Your feedback has been securely synced with your practitioner's records.</p>
        </motion.div>
      )}
    </motion.div>
  );
});

export default function PatientDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(getSession()?.user || null);
  const [patientData, setPatientData] = useState(null);
  const [dietChart, setDietChart] = useState(null);
  const [patientCharts, setPatientCharts] = useState([]);
  const [progressReport, setProgressReport] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dietPlans, setDietPlans] = useState([]);
  const [dietPlansLoading, setDietPlansLoading] = useState(false);
  const [dietPlansError, setDietPlansError] = useState('');
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [providerAvailability, setProviderAvailability] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [generatingDiet, setGeneratingDiet] = useState(false);
  const [activeDietActionId, setActiveDietActionId] = useState('');
  const [pdfLoadingPlanId, setPdfLoadingPlanId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);
  
  // Custom Modal State for Rescheduling
  const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, appointment: null, newDate: '' });

  const generateDietLockRef = useRef(false);
  const logSubmitLockRef = useRef(false);
  const logResetTimerRef = useRef(null);
  const logRenderCountRef = useRef(0);
  const isDevMode = false; // Fixed for Canvas

  // Log Form State
  const [logData, setLogData] = useState({ meal: 'lunch', description: '', digestion: '', energy: '' });
  const [logSubmitted, setLogSubmitted] = useState(false);
  const [logSubmitting, setLogSubmitting] = useState(false);
  const [logError, setLogError] = useState('');
  const [dailyLogEntries, setDailyLogEntries] = useState([]);
  const [dailyLogLoading, setDailyLogLoading] = useState(false);

  useEffect(() => {
    const loadPatientData = async () => {
      setLoadingData(true);
      setErrorMsg('');
      setDietPlansError('');

      try {
        const me = await apiRequest('/auth/me');
        const user = me.user || { id: '1', profile: {} };
        setCurrentUser(user);

        let appointments = [];
        let chartEntries = [];

        try {
          const settled = await Promise.allSettled([
            apiRequest(`/appointments/patient/bookings?patientId=${user.id}`),
            apiRequest(`/charts?patientId=${user.id}`),
          ]);

          const [appointmentsRes, chartEntriesRes] = settled;
          if (appointmentsRes?.status === 'fulfilled') appointments = appointmentsRes.value;
          if (chartEntriesRes?.status === 'fulfilled') chartEntries = chartEntriesRes.value;
        } catch (e) {
          appointments = [];
          chartEntries = [];
        }

        try {
          const allUsers = await apiRequest('/users', { suppressToast: true });
          const docs = Array.isArray(allUsers) ? allUsers.filter((u) => String(u.role).toLowerCase() === 'doctor') : [];
          setProviders(docs);
          if (docs[0]) setSelectedProvider(String(docs[0].id || docs[0]._id));
        } catch (e) {
          setProviders([]);
        }

        const sortedUpcoming = (Array.isArray(appointments) ? appointments : [])
          .filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))
          .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

        const nextAppointment = sortedUpcoming[0]?.dateTime
          ? new Date(sortedUpcoming[0].dateTime).toLocaleString()
          : 'No upcoming appointment';

        setPatientData({
          name: user.name?.split(' ')[0] || 'Patient',
          prakriti: user.profile?.prakriti || 'Unknown',
          focus: user.profile?.chronicConds || 'General wellness',
          age: Number(user.profile?.age || 22),
          gender: user.profile?.gender || 'male',
          weight: Number(user.profile?.weight || 70),
          height: Number(user.profile?.height || 175),
          goal: user.profile?.goal || 'general wellness',
          adherence: chartEntries.length
            ? Math.round(chartEntries.reduce((sum, item) => sum + Number(item.value || 0), 0) / chartEntries.length)
            : 0,
          nextAppointment,
        });

        setPatientCharts(Array.isArray(chartEntries) ? chartEntries : []);
        setPatientAppointments(Array.isArray(appointments) ? appointments : []);

        const lastWeight = (Array.isArray(chartEntries) ? chartEntries : []).find((entry) => String(entry.metric).toLowerCase() === 'weight');
        setLatestWeight(lastWeight ? Number(lastWeight.value) : null);

        setDietChart(null);
        setDietPlansLoading(true);
        
        try {
          const planData = await apiRequest(`/ai/diet-plans?patientId=${user.id}`, { suppressToast: true });
          const normalizedPlans = normalizeDietPlans(planData);
          setDietPlans(normalizedPlans);

          if (normalizedPlans[0]?.generatedDiet) {
            setDietChart(buildTodayChartFromPlan(normalizedPlans[0].generatedDiet));
          }
        } catch (planErr) {
          setDietPlans([]);
          setDietPlansError(planErr?.data?.message || planErr?.message || 'Unable to load diet history');
        } finally {
          setDietPlansLoading(false);
        }
      } catch (err) {
        setErrorMsg(`Failed to load your profile: ${err?.data?.message || err?.message || 'Network error'}`);
        setPatientData(null);
        setDietChart(null);
        setPatientCharts([]);
        setProgressReport(null);
        setLatestWeight(null);
        setDietPlans([]);
      } finally {
        setLoadingData(false);
        setDietPlansLoading(false);
      }
    };

    loadPatientData();
  }, [reloadNonce]);

  useEffect(() => () => {
    if (logResetTimerRef.current) {
      window.clearTimeout(logResetTimerRef.current);
    }
  }, []);

  const loadDailyLogEntries = useCallback(async () => {
    if (!currentUser?.id || activeView !== 'log') return;

    setDailyLogLoading(true);
    setLogError('');

    try {
      const entries = await apiRequest(`/charts?patientId=${currentUser.id}`);
      const chartEntries = Array.isArray(entries) ? entries : [];
      const mealEntries = chartEntries.filter((entry) => String(entry.metric || '').startsWith('meal_'));

      setDailyLogEntries(mealEntries);
      setPatientCharts(chartEntries);
    } catch (err) {
      logger.error('PatientDashboard', 'Error loading daily log entries', err);
      setLogError(err?.data?.message || err?.message || 'Unable to load previous log entries');
    } finally {
      setDailyLogLoading(false);
    }
  }, [currentUser?.id, activeView]);

  useEffect(() => {
    loadDailyLogEntries();
  }, [loadDailyLogEntries]);

  const loadNotifications = useCallback(async () => {
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
  }, [currentUser?.id]);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  const refreshProgressData = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const settled = await Promise.allSettled([
        apiRequest(`/charts?patientId=${currentUser.id}`),
        apiRequest(`/appointments/patient/bookings?patientId=${currentUser.id}`)
      ]);

      const [chartEntriesRes, apptsRes] = settled;
      const chartEntries = chartEntriesRes?.status === 'fulfilled' ? chartEntriesRes.value : [];
      const appts = apptsRes?.status === 'fulfilled' ? apptsRes.value : [];

      const chartData = Array.isArray(chartEntries) ? chartEntries : [];
      setPatientCharts(chartData);
      
      const sortedUpcoming = (Array.isArray(appts) ? appts : [])
        .filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

      const nextAppointment = sortedUpcoming[0]?.dateTime
        ? new Date(sortedUpcoming[0].dateTime).toLocaleString()
        : 'No upcoming appointment';

      setPatientData((prev) => ({ ...(prev || {}), nextAppointment }));
      setPatientAppointments(Array.isArray(appts) ? appts : []);

      const lastWeight = chartData.find((entry) => String(entry.metric).toLowerCase() === 'weight');
      setLatestWeight(lastWeight ? Number(lastWeight.value) : null);

      const adherence = chartData.length
        ? Math.round(chartData.reduce((sum, item) => sum + Number(item.value || 0), 0) / chartData.length)
        : 0;
      setPatientData((prev) => ({ ...(prev || {}), adherence }));

    } catch (err) {
      logger.error('Error refreshing progress data:', err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const progressRefreshTimer = window.setInterval(() => {
      refreshProgressData();
    }, 25000);

    if (activeView === 'progress') {
      refreshProgressData();
    }

    return () => {
      window.clearInterval(progressRefreshTimer);
    };
  }, [currentUser?.id, activeView, refreshProgressData]);

  useEffect(() => {
    if (!currentUser?.id) return undefined;

    let isActive = true;
    let socket = null;

    const handleSlotEvent = () => {
      const today = new Date().toISOString().slice(0, 10);
      if (!selectedProvider) return;
      fetchProviderAvailability(selectedProvider);
      fetchSlots(selectedProvider, today);
    };

    const handleChartEvent = async () => {
      if (activeView === 'log') {
        await loadDailyLogEntries();
      }
      await refreshProgressData();
    };

    const initializeSocket = async () => {
      socket = await getRealtimeSocket();
      if (!isActive || !socket) return;

      socket.emit('join:user', String(currentUser.id));
      socket.emit('join:patient', String(currentUser.id));
      socket.emit('join:role', String(currentUser.role || 'patient'));

      socket.on('slot:created', handleSlotEvent);
      socket.on('chart:created', handleChartEvent);
      socket.on('chart:updated', handleChartEvent);
    };

    initializeSocket();

    return () => {
      isActive = false;
      if (socket) {
        socket.off('slot:created', handleSlotEvent);
        socket.off('chart:created', handleChartEvent);
        socket.off('chart:updated', handleChartEvent);
      }
    };
  }, [currentUser?.id, currentUser?.role, activeView, selectedProvider, loadDailyLogEntries, refreshProgressData]);

  const unreadNotificationCount = notifications.filter((item) => !item.isRead).length;

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await apiRequest(`/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications((prev) => prev.map((item) => String(item.id) === String(notificationId) ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to mark notification as read');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: item.readAt || new Date().toISOString() })));
      emitToast('success', 'All notifications marked as read');
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to mark all notifications as read');
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();

    if (logSubmitLockRef.current || logSubmitting) return;

    if (!currentUser?.id) {
      setLogError('Please login to save your daily log');
      return;
    }

    if (!logData.description.trim()) {
      setLogError('Please add what you ate before saving');
      return;
    }

    const todayKey = new Date().toISOString().slice(0, 10);
    const metric = `meal_${logData.meal}`;
    const existingEntry = dailyLogEntries.find((entry) => {
      const entryDate = new Date(entry.loggedAt || entry.createdAt || Date.now()).toISOString().slice(0, 10);
      return String(entry.metric) === metric && entryDate === todayKey;
    });

    logSubmitLockRef.current = true;
    setLogSubmitting(true);
    setLogError('');

    try {
      const metricValue = logData.energy === 'high' ? 250 : logData.energy === 'low' ? 120 : 180;
      const endpoint = existingEntry?.id ? `/charts/${existingEntry.id}` : '/charts';
      const method = existingEntry?.id ? 'PUT' : 'POST';

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(existingEntry?.id
          ? { metric, value: metricValue }
          : {
              patientId: String(currentUser.id),
              metric,
              value: metricValue,
            })
      });

      const refreshedEntries = await apiRequest(`/charts?patientId=${currentUser.id}`);
      const chartEntries = Array.isArray(refreshedEntries) ? refreshedEntries : [];
      const updatedMealEntries = chartEntries.filter((entry) => String(entry.metric || '').startsWith('meal_'));

      setPatientCharts(chartEntries);
      setDailyLogEntries(updatedMealEntries);

      setLogSubmitted(true);
      emitToast('success', existingEntry?.id ? 'Daily log updated successfully.' : 'Daily log saved successfully.');

      if (logResetTimerRef.current) {
        window.clearTimeout(logResetTimerRef.current);
      }

      logResetTimerRef.current = window.setTimeout(() => {
        setLogSubmitted(false);
        setLogData({ meal: 'lunch', description: '', digestion: '', energy: '' });
      }, 2000);
    } catch (err) {
      const message = err?.data?.message || err?.message || 'Unable to save daily log right now';
      setLogError(message);
      emitToast('error', message);
    } finally {
      logSubmitLockRef.current = false;
      setLogSubmitting(false);
    }
  };

  const refreshDietPlans = useCallback(async () => {
    if (!currentUser?.id) return [];
    setDietPlansLoading(true);
    setDietPlansError('');

    try {
      const planData = await apiRequest(`/ai/diet-plans?patientId=${currentUser.id}`, { suppressToast: true });
      const normalizedPlans = normalizeDietPlans(planData);
      setDietPlans(normalizedPlans);

      if (normalizedPlans[0]?.generatedDiet) {
        setDietChart(buildTodayChartFromPlan(normalizedPlans[0].generatedDiet));
      }

      return normalizedPlans;
    } catch (err) {
      const message = err?.data?.message || err?.message || 'Unable to load diet history';
      setDietPlansError(message);
      throw err;
    } finally {
      setDietPlansLoading(false);
    }
  }, [currentUser?.id]);

  const submitDietGeneration = async (payload, actionId, successMessage) => {
    if (generateDietLockRef.current) return null;

    generateDietLockRef.current = true;
    setGeneratingDiet(true);
    setActiveDietActionId(actionId);
    setDietPlansError('');

    try {
      const response = await apiRequest('/ai/generate-diet', {
        method: 'POST',
        body: JSON.stringify(payload),
        suppressToast: true
      });

      const generatedPlan = response?.dietPlan;
      if (generatedPlan?.generatedDiet) {
        setDietPlans((existing) => [generatedPlan, ...existing.filter((plan) => String(plan.id) !== String(generatedPlan.id))]);
        setDietChart(buildTodayChartFromPlan(generatedPlan.generatedDiet));
      }

      await refreshDietPlans();
      emitToast('success', successMessage);
      return generatedPlan || null;
    } catch (err) {
      const message = err?.data?.message || err?.message || 'Could not generate diet plan';
      setDietPlansError(message);
      emitToast('error', message);
      return null;
    } finally {
      generateDietLockRef.current = false;
      setGeneratingDiet(false);
      setActiveDietActionId('');
    }
  };

  const handleGenerateDiet = async () => {
    if (!currentUser?.id) return;
    const payload = buildDietPayload(currentUser, patientData);
    await submitDietGeneration(payload, 'generate', 'Diet plan generated successfully.');
  };

  const handleRegenerateDiet = async (plan) => {
    if (!currentUser?.id || !plan) return;

    const payload = {
      ...(plan.input || buildDietPayload(currentUser, patientData)),
      patientId: String(currentUser.id),
      patientName: currentUser?.name || patientData?.name || 'Patient',
      patientEmail: currentUser?.email || '',
      age: Number(currentUser?.profile?.age || patientData?.age || 22),
      gender: currentUser?.profile?.gender || patientData?.gender || 'male',
      weight: Number(currentUser?.profile?.weight || patientData?.weight || 70),
      height: Number(currentUser?.profile?.height || patientData?.height || 175),
      prakriti: currentUser?.profile?.prakriti || patientData?.prakriti?.toLowerCase?.() || 'vata',
      goal: currentUser?.profile?.goal || patientData?.goal || 'general wellness',
      allergies: normalizeList(currentUser?.profile?.allergies),
      diseases: normalizeList(currentUser?.profile?.chronicConds),
      dietaryPreference: currentUser?.profile?.dietaryPreference || 'vegetarian'
    };

    await submitDietGeneration(payload, plan.id || 'regenerate', 'Diet plan regenerated successfully.');
  };

  const handleDownloadPdf = async (plan) => {
    if (!plan?.id || pdfLoadingPlanId) return;

    setPdfLoadingPlanId(plan.id);
    try {
      const apiBase = await resolveApiBaseUrl();
      const response = await fetch(`${apiBase}/ai/diet-plans/${plan.id}/pdf`, {
        headers: {
          Authorization: `Bearer ${getAccessToken()}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `diet-plan-${plan.id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      emitToast('success', 'PDF downloaded successfully.');
    } catch (err) {
      const msg = err?.message || '';
      if (/route not found|not found/i.test(msg)) {
        emitToast('info', 'PDF export is unavailable in this build.');
      } else {
        emitToast('error', msg || 'Unable to download PDF');
      }
    } finally {
      setPdfLoadingPlanId('');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const fetchProviderAvailability = async (providerId) => {
    if (!providerId) return null;
    try {
      const resp = await apiRequest(`/providers/${providerId}/availability`);
      setProviderAvailability(resp?.availability || resp || null);
      return resp;
    } catch (err) {
      setProviderAvailability(null);
      return null;
    }
  };

  const fetchSlots = async (providerId, date) => {
    if (!providerId || !date) return setSlots([]);
    setSlotsLoading(true);
    try {
      const resp = await apiRequest(`/appointments/patient/available?doctorId=${providerId}&date=${date}`);
      const available = Array.isArray(resp?.availableSlots) ? resp.availableSlots : Array.isArray(resp?.slots) ? resp.slots : [];
      setSlots(available);
      logger.debug('Fetched available slots:', { providerId, date, count: available.length });
    } catch (err) {
      setSlots([]);
      logger.error('Error fetching slots:', err);
      emitToast('error', err?.data?.message || err?.message || 'Unable to load slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleBookSlot = async (slotIso) => {
    if (!currentUser?.id) return emitToast('error', 'Please login to book');
    if (!selectedProvider) return emitToast('error', 'Select a provider');
    setBookingLoading(true);
    try {
      const payload = {
        doctorId: String(selectedProvider),
        dateTime: new Date(slotIso).toISOString(),
        reason: 'Consultation booked via patient dashboard',
        durationMinutes: 30
      };

      const created = await apiRequest('/appointments/patient/book', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      emitToast('success', 'Appointment booked successfully');
      
      const appts = await apiRequest(`/appointments/patient/bookings?patientId=${currentUser.id}`);
      const upcomingAppts = Array.isArray(appts) ? appts : [];
      const createdAppointment = created?.appointment || created;
      const mergedAppointments = Array.isArray(appts)
        ? appts
        : createdAppointment ? [createdAppointment, ...patientAppointments] : patientAppointments;

      const firstUpcoming = mergedAppointments.filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))[0];
      const nextAppointment = formatAppointmentDate(firstUpcoming) || 'No upcoming appointment';
      
      setPatientData((prev) => ({ ...(prev || {}), nextAppointment }));
      setPatientAppointments(mergedAppointments);
      setSlots((prevSlots) => prevSlots.filter((s) => s !== slotIso));
      return created;
    } catch (err) {
      logger.error('Error booking appointment:', err);
      emitToast('error', err?.data?.message || err?.message || 'Unable to book appointment');
      throw err;
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await apiRequest(`/appointments/${appointmentId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) });
      const appts = await apiRequest(`/appointments/patient/bookings?patientId=${currentUser.id}`);
      setPatientAppointments(Array.isArray(appts) ? appts : []);
      const nextUpcoming = (Array.isArray(appts) ? appts : []).filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))[0];
      setPatientData((prev) => ({ ...(prev || {}), nextAppointment: formatAppointmentDate(nextUpcoming) || 'No upcoming appointment' }));
      emitToast('success', 'Appointment cancelled');
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to cancel appointment');
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleModal.newDate || !rescheduleModal.appointment) return;
    
    const nextDate = new Date(rescheduleModal.newDate);
    if (Number.isNaN(nextDate.getTime())) {
      emitToast('error', 'Invalid date/time');
      return;
    }

    try {
      await apiRequest(`/appointments/${rescheduleModal.appointment.id}`, { method: 'PUT', body: JSON.stringify({ dateTime: nextDate.toISOString() }) });
      const appts = await apiRequest(`/appointments/patient/bookings?patientId=${currentUser.id}`);
      setPatientAppointments(Array.isArray(appts) ? appts : []);
      const nextUpcoming = (Array.isArray(appts) ? appts : []).filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))[0];
      setPatientData((prev) => ({ ...(prev || {}), nextAppointment: formatAppointmentDate(nextUpcoming) || 'No upcoming appointment' }));
      emitToast('success', 'Appointment rescheduled');
      setRescheduleModal({ isOpen: false, appointment: null, newDate: '' });
    } catch (err) {
      emitToast('error', err?.data?.message || 'Unable to reschedule appointment');
    }
  };

  const latestDietPlan = useMemo(() => dietPlans[0] || null, [dietPlans]);
  const latestDietRecommendations = useMemo(() => latestDietPlan?.recommendations || {}, [latestDietPlan]);
  const latestDietDays = useMemo(() => latestDietPlan?.generatedDiet || {}, [latestDietPlan]);

  const energyEntries = useMemo(() => patientCharts
    .filter((entry) => String(entry.metric).startsWith('meal_'))
    .slice(0, 7)
    .reverse(), [patientCharts]);

  const energySeries = useMemo(() => (energyEntries.length ? energyEntries : [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }])
    .map((item, index) => ({
      day: ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] || 'D',
      val: Math.max(1, Math.min(5, Math.round(Number(item.value || 0) / 20)))
    })), [energyEntries]);

  const computedAdherence = useMemo(() => {
    const validValues = (patientCharts || []).map((item) => Number(item.value || 0)).filter((value) => !Number.isNaN(value));
    return validValues.length ? Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length) : 0;
  }, [patientCharts]);

  const computedLatestWeight = useMemo(() => {
    const weightEntries = (patientCharts || []).filter((entry) => String(entry.metric || '').toLowerCase() === 'weight');
    if (!weightEntries.length) return null;
    const latest = weightEntries[weightEntries.length - 1];
    return Number(latest.value || 0);
  }, [patientCharts]);

  const symptomRows = useMemo(() => (patientData?.focus || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((symptom, idx) => {
      const trend = progressReport?.trends?.[idx];
      const pct = trend ? Math.max(10, Math.min(100, Math.round(trend.average))) : 40;
      return {
        label: symptom,
        status: pct <= 35 ? 'Improving' : pct <= 60 ? 'Stable' : 'Needs review',
        pct
      };
    }), [patientData?.focus, progressReport]);

  const weeklyPlanRows = useMemo(() => WEEK_DAYS.map((day) => ({
    day,
    meals: latestDietDays?.[day] || { Breakfast: '', Lunch: '', Dinner: '', Snacks: '' }
  })), [latestDietDays]);

  const timingLines = useMemo(() => formatDietItems(latestDietRecommendations.mealTimings), [latestDietRecommendations]);
  const ayurvedicNotes = useMemo(() => formatDietItems(latestDietRecommendations.ayurvedic), [latestDietRecommendations]);

  // ─── RENDER FUNCTIONS (Fixes unmounting re-render issues) ─────────────

  const renderOverviewView = () => (
    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-4xl mx-auto">
      
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-[#3ECFB2] text-[13px] font-semibold tracking-[0.2em] uppercase mb-2">Namaste,</p>
          <h1 className="text-5xl md:text-[54px] font-bold text-white tracking-tight leading-none">{patientData?.name || 'Patient'}</h1>
        </div>
        <div className="w-[64px] h-[64px] rounded-[20px] bg-gradient-to-br from-[#1D9E75] to-[#3ECFB2] flex items-center justify-center border border-white/10 shadow-[0_0_40px_rgba(62,207,178,0.4)]">
          <span className="text-white font-bold text-3xl">{(patientData?.name || 'P').charAt(0)}</span>
        </div>
      </div>

      <div className="glass-card p-8 relative overflow-hidden group">
        <div className="absolute -right-10 -top-10 text-white/5 transition-transform duration-700 group-hover:rotate-12"><Wind className="w-64 h-64" /></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#3ECFB2]/10 to-transparent opacity-50" />
        
        <div className="relative z-10">
          <div className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Current Focus
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-white">Pacifying {patientData?.prakriti || 'Your Dosha'}</h2>
          
          <div className="grid grid-cols-2 md:flex gap-4">
            <div className="bg-black/20 rounded-2xl p-5 flex-1 border border-white/10 backdrop-blur-md">
              <div className="text-white/50 text-[11px] uppercase tracking-wider mb-2">Adherence</div>
              <div className="font-semibold text-3xl text-white">{patientData?.adherence || 0}%</div>
            </div>
            <div className="bg-black/20 rounded-2xl p-5 flex-1 border border-white/10 backdrop-blur-md">
              <div className="text-white/50 text-[11px] uppercase tracking-wider mb-2">Energy Trend</div>
              <div className="font-semibold text-xl text-[#3ECFB2] mt-2">Improving ↑</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#C9A84C]" /> Next Meal: Afternoon
            </h3>
            <button onClick={() => setActiveView('diet')} className="text-xs text-[#3ECFB2] font-medium hover:text-white transition-colors">Full Chart →</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {(dietChart?.afternoon || []).map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div>
                  <div className="font-medium text-[15px] text-white">{item.name}</div>
                  <div className="text-[12px] text-white/50 mt-1">"{item.note}"</div>
                </div>
                <span className="text-xs font-semibold text-[#3ECFB2] bg-[#3ECFB2]/10 px-3 py-1.5 rounded-lg border border-[#3ECFB2]/20">{item.qty}</span>
              </div>
            ))}
          </div>
          
          <button onClick={() => setActiveView('log')} className="w-full mt-6 py-3.5 rounded-xl border border-[#3ECFB2]/50 text-[#3ECFB2] font-semibold text-[15px] hover:bg-[#3ECFB2]/10 transition-all flex justify-center items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Log This Meal
          </button>
        </div>

        <div className="glass-card p-6 md:p-8 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 bottom-0 text-[#C9A84C]/5 translate-x-1/4 translate-y-1/4">
            <Calendar className="w-48 h-48" />
          </div>

          <h3 className="font-semibold text-white text-lg flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-[#C9A84C]" /> Next Appointment
          </h3>

          <div className="bg-black/20 border border-[#C9A84C]/30 rounded-2xl p-6 mb-6">
            <div className="text-[13px] text-white/60 font-medium uppercase tracking-wider mb-2">Scheduled For</div>
            <div className="font-semibold text-white text-2xl">{patientData?.nextAppointment || 'No appointment scheduled'}</div>
          </div>

          <div className="space-y-3">
            {currentUser?.role === 'patient' && (
              <div className="flex gap-3 items-center">
                <select className="glass-input" value={selectedProvider} onChange={(e) => setSelectedProvider(e.target.value)}>
                  {providers.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>{p.name || p.email}</option>
                  ))}
                </select>
                <button
                  onClick={async () => {
                    if (!selectedProvider) return emitToast('error', 'Please select a provider');
                    const date = new Date().toISOString().slice(0,10);
                    await fetchProviderAvailability(selectedProvider);
                    await fetchSlots(selectedProvider, date);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white border border-white/10 font-semibold text-sm hover:bg-white/10 transition-all"
                >
                  {slotsLoading ? 'Loading...' : 'View Slots Today'}
                </button>
              </div>
            )}

            <div>
              {slotsLoading ? (
                <div className="text-sm text-white/50">Loading slots…</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.length ? slots.map((s) => (
                    <div key={s} className="rounded-xl p-3 border border-white/10 bg-white/5 flex items-center justify-between">
                      <div className="text-sm text-white">{new Date(s).toLocaleString()}</div>
                      <button disabled={bookingLoading} onClick={() => handleBookSlot(s)} className="px-3 py-1 rounded-lg bg-[#3ECFB2] text-black font-semibold">
                        {bookingLoading ? 'Booking...' : 'Book'}
                      </button>
                    </div>
                  )) : (
                    <div className="text-sm text-white/50">No available slots.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8">
        <div className="flex justify-between items-center mb-5">
          <div>
            <div className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notifications
            </div>
            <h3 className="font-semibold text-white text-lg">Inbox {unreadNotificationCount ? `(${unreadNotificationCount} unread)` : ''}</h3>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={loadNotifications} className="px-4 py-2 rounded-xl bg-white/5 text-white border border-white/10 text-sm font-semibold hover:bg-white/10 transition-all">
              {notificationsLoading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={handleMarkAllNotificationsRead} className="px-4 py-2 rounded-xl bg-[#3ECFB2] text-black text-sm font-semibold hover:bg-[#2BB89D] transition-all">
              Mark All Read
            </button>
          </div>
        </div>

        {notificationsError ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm mb-4">{notificationsError}</div>
        ) : null}

        {notificationsLoading ? (
          <div className="text-sm text-white/60">Loading notifications…</div>
        ) : notifications.length ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className={`p-4 rounded-xl border ${item.isRead ? 'border-white/10 bg-white/5' : 'border-[#3ECFB2]/30 bg-[#3ECFB2]/10'}`}>
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      {!item.isRead ? <span className="w-2 h-2 rounded-full bg-[#3ECFB2]" /> : null}
                      {item.title || 'Notification'}
                    </div>
                    <div className="text-xs text-white/60 mt-1">{item.message || ''}</div>
                    <div className="text-[11px] text-white/40 mt-2 uppercase tracking-wider">{item.type || 'update'} • {new Date(item.createdAt || Date.now()).toLocaleString()}</div>
                  </div>
                  <div className="flex items-start gap-2">
                    {!item.isRead ? (
                      <button onClick={() => handleMarkNotificationRead(item.id)} className="px-3 py-1.5 rounded-lg bg-[#3ECFB2] text-black text-xs font-semibold">Read</button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-white/60">No notifications yet.</div>
        )}
      </div>

      <div className="glass-card p-6 md:p-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white text-lg">Appointment History</h3>
          <div className="text-xs text-white/50 uppercase tracking-wider">Upcoming, completed, and cancelled</div>
        </div>
        {patientAppointments.length ? (
          <div className="space-y-3">
            {patientAppointments.slice().sort((a, b) => new Date(normalizeAppointmentDate(b)).getTime() - new Date(normalizeAppointmentDate(a)).getTime()).map((appointment) => {
              const status = String(appointment.status || 'requested');
              const isFinal = ['completed', 'cancelled'].includes(status);
              const isLive = ['booked', 'in-progress'].includes(status);
              return (
                <div key={appointment.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-semibold text-white">{formatAppointmentDate(appointment) || 'Unknown time'}</div>
                      <div className="text-xs text-white/60 mt-1">Provider: {appointment.doctorId || appointment.providerId || 'Unassigned'}</div>
                      <div className="text-xs text-white/60 mt-1">Reason: {appointment.reason || 'Consultation'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase ${status === 'completed' ? 'text-white/40 border border-white/10' : status === 'cancelled' ? 'text-[#F1B6B6] bg-[#F1B6B6]/10 border border-[#F1B6B6]/20' : 'text-[#3ECFB2] bg-[#3ECFB2]/10 border border-[#3ECFB2]/20'}`}>
                        {status}
                      </span>
                      {!isFinal ? (
                        <div className="flex gap-2 flex-wrap justify-end">
                          {isLive ? (
                            <button onClick={() => emitToast('info', 'Please join at the clinic for your scheduled appointment.')} className="px-3 py-1.5 rounded-lg bg-[#3ECFB2] text-black text-xs font-semibold">Appointment In Progress</button>
                          ) : null}
                          <button onClick={() => setRescheduleModal({ isOpen: true, appointment, newDate: appointment.dateTime ? new Date(appointment.dateTime).toISOString().slice(0, 16) : '' })} className="px-3 py-1.5 rounded-lg bg-white/5 text-white border border-white/10 text-xs font-semibold">Reschedule</button>
                          <button onClick={() => handleCancelAppointment(appointment.id)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white border border-white/10 text-xs font-semibold">Cancel</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-white/60">No appointment history found.</div>
        )}
      </div>
    </motion.div>
  );

  const renderDietChartView = () => (
    <motion.div key="diet" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-4xl mx-auto pb-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-tight mb-2 leading-none">My Diet Chart</h1>
          <p className="text-white/50 text-[15px] font-light mt-3">Prescribed by your doctor to balance {patientData?.prakriti || 'your constitution'}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGenerateDiet}
            disabled={generatingDiet || loadingData}
            className="btn-mint px-5 py-3 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generatingDiet ? 'Generating Diet...' : 'Generate Diet'}
          </button>
          <button
            onClick={refreshDietPlans}
            disabled={dietPlansLoading}
            className="px-5 py-3 rounded-xl bg-white/5 text-white border border-white/10 font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {dietPlansLoading ? 'Refreshing...' : 'Load History'}
          </button>
        </div>
      </div>

      {dietPlansError ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm">
          {dietPlansError}
        </div>
      ) : null}

      {latestDietPlan ? (
        <div className="glass-card p-6 md:p-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#3ECFB2] font-semibold mb-2">Latest AI Diet Plan</div>
              <h2 className="text-2xl font-semibold text-white">Version {latestDietPlan.version || 1}</h2>
              <p className="text-white/50 text-sm mt-2">Saved on {formatPlanDate(latestDietPlan.createdAt)}.</p>
            </div>
            <div className="text-right text-sm text-white/60">
              <div className="font-medium text-white">{latestDietPlan.patientName || 'You'}</div>
              <div>{latestDietPlan.status || 'active'}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Hydration</div>
              <div className="text-white text-sm leading-6">{latestDietPlan?.hydrationGuidance || 'Keep water warm and steady throughout the day.'}</div>
            </div>
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Avoid</div>
              <div className="text-white text-sm leading-6">{(latestDietPlan.foodsToAvoid || []).length ? latestDietPlan.foodsToAvoid.join(', ') : 'No specific restrictions recorded.'}</div>
            </div>
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Lifestyle</div>
              <div className="text-white text-sm leading-6">{(latestDietPlan.lifestyleRecommendations || []).slice(0, 3).join(' • ') || 'Sleep early, walk after meals, and keep meals regular.'}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(latestDietDays).slice(0, 2).map(([day, meals]) => (
              <div key={day} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-[#3ECFB2] text-xs uppercase tracking-widest font-semibold mb-3">{day}</div>
                <div className="space-y-2 text-sm text-white/80">
                  <div><span className="text-white/45">Breakfast:</span> {meals.Breakfast || '—'}</div>
                  <div><span className="text-white/45">Lunch:</span> {meals.Lunch || '—'}</div>
                  <div><span className="text-white/45">Dinner:</span> {meals.Dinner || '—'}</div>
                  <div><span className="text-white/45">Snacks:</span> {meals.Snacks || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 md:p-8 text-white/60 text-sm">
          No AI diet plan yet. Use Generate Diet to create one for your current profile.
        </div>
      )}

      {dietPlansLoading && !latestDietPlan ? (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-200 text-sm">
          Loading diet history...
        </div>
      ) : null}

      {latestDietPlan ? (
        <div className="glass-card p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#3ECFB2] font-semibold mb-2">Weekly Diet Calendar</div>
              <h2 className="text-2xl font-semibold text-white">Version {latestDietPlan.version || 1}</h2>
              <p className="text-white/50 text-sm mt-2">Saved on {formatPlanDate(latestDietPlan.createdAt)}.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerateDiet}
                disabled={generatingDiet || loadingData}
                className="btn-mint px-4 py-2.5 rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {generatingDiet ? 'Generating...' : 'Generate Diet'}
              </button>
              <button
                onClick={() => refreshDietPlans()}
                disabled={dietPlansLoading}
                className="px-4 py-2.5 rounded-xl bg-white/5 text-white border border-white/10 font-semibold text-sm hover:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {dietPlansLoading ? 'Refreshing...' : 'Refresh History'}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Meal Timings</div>
              <div className="space-y-2 text-white text-sm leading-6">
                {timingLines.length ? timingLines.map((item) => <div key={item}>{item}</div>) : <div>Breakfast 7-9 AM • Lunch 12-1 PM • Dinner 6-7:30 PM</div>}
              </div>
            </div>
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Water Intake</div>
              <div className="text-white text-sm leading-6">{latestDietPlan?.hydrationGuidance || latestDietRecommendations?.hydrationGuidance || 'Sip warm water regularly through the day.'}</div>
            </div>
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">Ayurvedic Notes</div>
              <div className="space-y-2 text-white text-sm leading-6">
                {ayurvedicNotes.length ? ayurvedicNotes.slice(0, 3).map((item) => <div key={item}>{item}</div>) : <div>Keep meals warm, fresh, and easy to digest.</div>}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="p-6 md:p-8 rounded-[24px] bg-gradient-to-br from-[#103D33] to-[#0A2A22] border border-[#3ECFB2]/30 relative overflow-hidden shadow-[0_10px_30px_rgba(62,207,178,0.15)]">
        <div className="absolute right-0 top-0 w-64 h-64 bg-[#3ECFB2]/10 blur-[50px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute -right-4 -bottom-4 text-[#3ECFB2]/10"><Sparkles className="w-32 h-32" /></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[#3ECFB2] font-semibold text-[11px] uppercase tracking-widest mb-3">
            <Sparkles className="w-4 h-4" /> Gemini AI Insight
          </div>
          <p className="text-[15px] text-white/90 leading-relaxed font-light">
            Your current chart emphasizes <strong className="text-white font-medium">cooling (Sheetal)</strong> and <strong className="text-white font-medium">grounding</strong> foods to pacify your Pitta-Vata constitution. Notice the inclusion of Ghee to soothe the digestive fire, and warm soups to settle Vata anxiety.
          </p>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold text-white text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3ECFB2]" /> Weekly Calendar
          </h3>
          <span className="text-xs text-white/50 uppercase tracking-widest">Monday to Sunday</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weeklyPlanRows.map(({ day, meals }) => (
            <div key={day} className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[#3ECFB2] text-xs uppercase tracking-widest font-semibold">{day}</div>
                <div className="text-[11px] text-white/45 uppercase tracking-wider">AI Saved</div>
              </div>

              <div className="space-y-3 text-sm text-white/80">
                <div><span className="text-white/45">Breakfast:</span> {meals.Breakfast || '—'}</div>
                <div><span className="text-white/45">Lunch:</span> {meals.Lunch || '—'}</div>
                <div><span className="text-white/45">Dinner:</span> {meals.Dinner || '—'}</div>
                <div><span className="text-white/45">Snacks:</span> {meals.Snacks || '—'}</div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-2 text-[12px] text-white/60">
                <div><span className="text-white/40 uppercase tracking-wider">Timings:</span> {timingLines.length ? timingLines.slice(0, 2).join(' • ') : 'Follow the recommended timings'}</div>
                <div><span className="text-white/40 uppercase tracking-wider">Water:</span> {latestDietPlan?.hydrationGuidance || 'Sip warm water through the day.'}</div>
                <div><span className="text-white/40 uppercase tracking-wider">Note:</span> {ayurvedicNotes[0] || 'Keep meals warm, fresh, and easy to digest.'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-semibold text-white text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#3ECFB2]" /> Saved AI Diet History
          </h3>
          <span className="text-xs text-white/50 uppercase tracking-widest">{dietPlans.length} plan{dietPlans.length === 1 ? '' : 's'}</span>
        </div>

        <div className="space-y-3">
          {dietPlans.length === 0 ? (
            <div className="text-sm text-white/50">No saved plans yet. Generate your first AI diet to see history here.</div>
          ) : dietPlans.slice(0, 3).map((plan) => (
            <div key={plan.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-medium text-white">Version {plan.version || 1}</div>
                <div className="text-sm text-white/50">Saved {formatPlanDate(plan.createdAt)}</div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  onClick={() => handleDownloadPdf(plan)}
                  disabled={pdfLoadingPlanId === plan.id || generatingDiet}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white border border-white/10 text-sm hover:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {pdfLoadingPlanId === plan.id ? 'Downloading...' : 'Download PDF'}
                </button>
                <button
                  onClick={() => handleRegenerateDiet(plan)}
                  disabled={generatingDiet || pdfLoadingPlanId === plan.id || activeDietActionId === plan.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl btn-mint text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingDiet && activeDietActionId === plan.id ? 'animate-spin' : ''}`} />
                  {generatingDiet && activeDietActionId === plan.id ? 'Regenerating...' : 'Regenerate Diet'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderProgressView = () => (
    <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 max-w-4xl mx-auto pb-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-tight mb-2 leading-none">My Progress</h1>
        <p className="text-white/50 text-[15px] font-light mt-3">Your health trends over the last 7 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="glass-card p-6 text-center bg-black/10">
          <div className="text-[11px] text-white/50 uppercase tracking-widest mb-2">Plan Adherence</div>
          <div className="text-4xl font-bold text-[#3ECFB2]">{computedAdherence || patientData?.adherence || 0}%</div>
        </div>
        <div className="glass-card p-6 text-center bg-black/10">
          <div className="text-[11px] text-white/50 uppercase tracking-widest mb-2">Latest Weight</div>
          <div className="text-4xl font-bold text-white">{computedLatestWeight !== null ? computedLatestWeight : latestWeight !== null ? latestWeight : '--'}<span className="text-lg text-white/40 font-normal ml-1">kg</span></div>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-semibold text-white text-lg mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#3ECFB2]"/> Energy Levels
        </h3>
        <div className="flex items-end justify-between h-40 gap-2 md:gap-4 mt-4 border-b border-white/10 pb-4">
          {energySeries.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-3 flex-1 h-full justify-end group">
              <div className="w-full max-w-[40px] bg-white/5 rounded-lg relative overflow-hidden" style={{ height: `${(d.val/5)*100}%` }}>
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#0D4A4A] to-[#3ECFB2] group-hover:brightness-125 transition-all" style={{ height: '100%' }} />
              </div>
              <span className="text-[12px] text-white/50 font-medium uppercase">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-white/40 mt-3 uppercase tracking-wider font-medium">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8">
        <h3 className="font-semibold text-white text-lg mb-6 flex items-center gap-2">
          <Droplets className="w-5 h-5 text-[#C9A84C]" /> Reported Symptoms
        </h3>
        <div className="space-y-6">
          {symptomRows.length === 0 ? (
            <div className="text-[13px] text-white/50">No symptom trends logged yet.</div>
          ) : symptomRows.map((symptom, index) => (
            <div key={symptom.label + index}>
              <div className="flex justify-between text-[14px] mb-2">
                <span className="text-white">{symptom.label}</span>
                <span className="text-[#C9A84C] font-medium text-[13px]">{symptom.status}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#8C6D23] to-[#C9A84C] rounded-full shadow-[0_0_10px_rgba(201,168,76,0.5)]" style={{ width: `${symptom.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // ─── LAYOUT RENDER ───────────────────────────────────────────────────────

  return (
    <div className="patient-root">
      <PatientStyles />
      
      {/* ─── Immersive Background ─── */}
      <motion.div animate={{ backgroundPosition: ['0px 0px', '32px 32px'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-grid-pattern opacity-40 z-0 pointer-events-none" style={{ maskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)' }} />
      <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] rounded-full bg-gradient-to-br from-[#3ECFB2]/20 to-transparent blur-[100px] z-0 pointer-events-none" />
      <motion.div animate={{ opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] min-w-[600px] min-h-[600px] rounded-full bg-gradient-to-tl from-[#C9A84C]/10 to-transparent blur-[120px] z-0 pointer-events-none" />

      {/* ─── Desktop Sidebar (Hidden on Mobile) ─── */}
      <aside className="sidebar py-8 hidden md:flex">
        <div className="px-8 mb-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] flex items-center justify-center text-white shadow-lg shadow-[#3ECFB2]/20 border border-white/20">
            <span className="text-xl font-bold">✦</span>
          </div>
          <div>
            <div className="font-bold text-xl leading-none text-white tracking-wide">AyurIT</div>
            <div className="text-[10px] text-[#3ECFB2] uppercase tracking-widest mt-1.5 font-semibold">Patient Portal</div>
          </div>
        </div>

        <nav className="flex-1 mt-4 space-y-1">
          <div className={`nav-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>
            <Home className="w-5 h-5" /> Dashboard
          </div>
          <div className={`nav-item ${activeView === 'appointments' ? 'active' : ''}`} onClick={() => setActiveView('appointments')}>
            <Calendar className="w-5 h-5" /> Appointments
          </div>
          <div className={`nav-item ${activeView === 'diet' ? 'active' : ''}`} onClick={() => setActiveView('diet')}>
            <Utensils className="w-5 h-5" /> My Diet Chart
          </div>
          <div className={`nav-item ${activeView === 'log' ? 'active' : ''}`} onClick={() => setActiveView('log')}>
            <BookOpen className="w-5 h-5" /> Daily Log
          </div>
          <div className={`nav-item ${activeView === 'progress' ? 'active' : ''}`} onClick={() => setActiveView('progress')}>
            <Activity className="w-5 h-5" /> My Progress
          </div>
        </nav>

        <div className="px-6 mt-auto pt-4">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="content-area custom-scrollbar w-full">
        <div className="relative z-10 h-full">
          {loadingData ? <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">Loading your profile...</div> : null}
          {errorMsg ? <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm"><strong>Error:</strong> {errorMsg} <button onClick={() => setReloadNonce((prev) => prev + 1)} className="ml-2 underline">Retry</button></div> : null}
          {!loadingData && !patientData && !errorMsg ? <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">No profile data available.</div> : null}
          
          <AnimatePresence mode="wait">
            {patientData && activeView === 'overview' && renderOverviewView()}
            
            {patientData && activeView === 'appointments' && (
              <motion.div key="appointments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AppointmentBooking
                  doctorId={selectedProvider || null}
                  providers={providers}
                  onBookingSuccess={async (response) => {
                    const createdAppointment = response?.appointment || response;
                    const appts = await apiRequest(`/appointments/patient/bookings?patientId=${currentUser?.id}`);
                    const cleaned = Array.isArray(appts) ? appts : [];
                    const merged = createdAppointment
                      ? [...cleaned.filter((item) => String(item.id || item._id) !== String(createdAppointment.id || createdAppointment._id)), createdAppointment]
                      : cleaned;
                    const nextUpcoming = merged.filter((item) => !['completed', 'cancelled'].includes(String(item.status || '').toLowerCase()))[0];
                    setPatientAppointments(merged);
                    setPatientData((prev) => ({
                      ...(prev || {}),
                      nextAppointment: formatAppointmentDate(nextUpcoming) || 'No upcoming appointment'
                    }));
                  }}
                />
              </motion.div>
            )}

            {patientData && activeView === 'diet' && renderDietChartView()}

            {patientData && activeView === 'log' && (
              <DailyLogView
                key="log"
                logData={logData}
                setLogData={setLogData}
                handleLogSubmit={handleLogSubmit}
                logSubmitted={logSubmitted}
                logSubmitting={logSubmitting}
                dailyLogLoading={dailyLogLoading}
                logError={logError}
                dailyLogEntries={dailyLogEntries}
              />
            )}

            {patientData && activeView === 'progress' && renderProgressView()}
          </AnimatePresence>
        </div>
      </main>

      {/* ─── Mobile Bottom Navigation (Hidden on Desktop) ─── */}
      <nav className="mobile-nav flex md:hidden">
        <div className={`mobile-nav-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>
          <Home className="w-6 h-6" />
          <span>Home</span>
        </div>
        <div className={`mobile-nav-item ${activeView === 'appointments' ? 'active' : ''}`} onClick={() => setActiveView('appointments')}>
          <Calendar className="w-6 h-6" />
          <span>Book</span>
        </div>
        <div className={`mobile-nav-item ${activeView === 'diet' ? 'active' : ''}`} onClick={() => setActiveView('diet')}>
          <Utensils className="w-6 h-6" />
          <span>Diet</span>
        </div>
        <div className={`mobile-nav-item ${activeView === 'log' ? 'active' : ''}`} onClick={() => setActiveView('log')}>
          <BookOpen className="w-6 h-6" />
          <span>Log</span>
        </div>
        <div className={`mobile-nav-item ${activeView === 'progress' ? 'active' : ''}`} onClick={() => setActiveView('progress')}>
          <Activity className="w-6 h-6" />
          <span>Progress</span>
        </div>
      </nav>

      {/* ─── Reschedule Modal ─── */}
      <AnimatePresence>
        {rescheduleModal.isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.95, y: 20 }} 
              className="glass-card p-6 md:p-8 w-full max-w-md border border-white/20"
            >
              <h3 className="text-xl font-semibold text-white mb-2">Reschedule Appointment</h3>
              <p className="text-white/60 text-sm mb-6">Select a new date and time for your consultation.</p>
              
              <input 
                type="datetime-local" 
                className="glass-input mb-8" 
                value={rescheduleModal.newDate} 
                onChange={e => setRescheduleModal(prev => ({...prev, newDate: e.target.value}))} 
              />
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setRescheduleModal({isOpen: false, appointment: null, newDate: ''})} 
                  className="px-5 py-2.5 rounded-xl bg-white/5 text-white border border-white/10 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitReschedule} 
                  className="px-5 py-2.5 rounded-xl bg-[#3ECFB2] text-black text-sm font-semibold hover:bg-[#2BB89D] transition-colors shadow-lg"
                >
                  Confirm Time
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}