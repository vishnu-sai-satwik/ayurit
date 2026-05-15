import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Server, Activity, Settings, LogOut, 
  Search, Plus, Mail, Key, CheckCircle2, AlertTriangle, 
  Database, RefreshCw, Lock, ArrowRight, UserPlus
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { clearSession } from '../utils/session';

const ADMIN_ROLES = new Set(['doctor', 'admin', 'superadmin']);
const formatTimestamp = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const uniqById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.id || item?._id || item?.email || JSON.stringify(item));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizePagedResult = (data) => {
  if (Array.isArray(data)) return { items: data, total: data.length, page: 1, limit: data.length };
  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total || 0),
    page: Number(data?.page || 1),
    limit: Number(data?.limit || 50)
  };
};

// ─── Scoped Premium Dark Theme Styles ────────────────────────────────────
const AdminStyles = () => (
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

    .admin-root {
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

    .glass-input {
      width: 100%; padding: 14px 18px; border-radius: 14px; 
      border: 1px solid rgba(255, 255, 255, 0.1); 
      background: rgba(0, 0, 0, 0.2); 
      font-family: 'Poppins', sans-serif; font-size: 14px; color: #FFF;
      outline: none; transition: all 0.3s ease;
    }
    .glass-input:focus { border-color: #3ECFB2; background: rgba(0, 0, 0, 0.4); box-shadow: 0 0 0 3px rgba(62,207,178,0.15); }
    .glass-input::placeholder { color: rgba(255, 255, 255, 0.3); }

    .bg-grid-pattern {
      background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 8px; }
  `}</style>
);

export default function SuperAdminDashboard() {
  const [activeView, setActiveView] = useState('overview');
  const refreshTimerRef = useRef(null);
  const navigate = useNavigate();

  // Staff State
  const [staff, setStaff] = useState([]);
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotal, setStaffTotal] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [invitesCount, setInvitesCount] = useState(0);
  const [clinicSettings, setClinicSettings] = useState(null);
  const [ehrStatus, setEhrStatus] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditUserFilter, setAuditUserFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState('');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Practitioner' });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffEditRole, setStaffEditRole] = useState('doctor');
  const [staffEditStatus, setStaffEditStatus] = useState('active');
  const [savingStaffAction, setSavingStaffAction] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    clinicName: '',
    branding: { primaryColor: '#0D4A4A', logoUrl: '' },
    contact: { phone: '', email: '' },
    ehrSync: {
      enabled: false,
      endpoint: '',
      vendor: '',
      syncFrequency: 'real-time',
      conflictResolution: 'ayurit_overrides'
    }
  });
  const [ehrForm, setEhrForm] = useState({
    vendor: '',
    endpoint: '',
    token: '',
    enabled: false,
    syncFrequency: 'real-time',
    conflictResolution: 'ayurit_overrides'
  });
  const [loadingData, setLoadingData] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      setLoadingData(true);
      setErrorMsg('');
      try {
        // Use allSettled to prevent EHR/clinic endpoints from blocking admin data load
        const [usersResponse, auditsResponse, patientsResponse, settingsResponse, invitesResponse, healthResponse, ehrResponse] = await Promise.allSettled([
          apiRequest('/users?page=1&limit=500'),
          apiRequest('/audits?page=1&limit=200'),
          apiRequest('/patients'),
          apiRequest('/clinic/settings'),
          apiRequest('/users/invites'),
          apiRequest('/health'),
          apiRequest('/integration/ehr/status')
        ]);

        const users = normalizePagedResult(usersResponse?.status === 'fulfilled' ? usersResponse.value : []);
        const audits = normalizePagedResult(auditsResponse?.status === 'fulfilled' ? auditsResponse.value : []);
        const patients_list = patientsResponse?.status === 'fulfilled' ? patientsResponse.value : [];
        const settings_data = settingsResponse?.status === 'fulfilled' ? settingsResponse.value : {};
        const invites_list = invitesResponse?.status === 'fulfilled' ? invitesResponse.value : [];
        const health_data = healthResponse?.status === 'fulfilled' ? healthResponse.value : null;
        const ehrResponse_value = ehrResponse?.status === 'fulfilled' ? ehrResponse.value : null;

        const uniqueUsers = uniqById(users.items || []);
        const uniqueAudits = uniqById(audits.items || []);

        const mappedStaff = uniqueUsers.map((u, idx) => ({
          id: u.id || u._id || idx + 1,
          name: u.name,
          email: u.email,
          role: u.role || 'staff',
          status: u.status || (u.isActive === false ? 'inactive' : 'active'),
          lastActive: u.lastActiveAt || u.lastLoginAt || u.updatedAt || u.createdAt,
        }));

        const mappedAudit = uniqueAudits.map((a, idx) => ({
          id: a.id || a._id || idx + 1,
          user: a.actor,
          action: a.action,
          target: a.target,
          time: formatTimestamp(a.createdAt),
          createdAt: a.createdAt,
          status: a.status === 'warning' ? 'warning' : a.status === 'failed' ? 'failed' : 'success',
        }));

        setStaff(mappedStaff.length ? mappedStaff : []);
        setStaffTotal(users.total || mappedStaff.length);
        setAuditLogs(mappedAudit.length ? mappedAudit : []);
        setAuditTotal(audits.total || mappedAudit.length);
        setPatientsCount(patients_list.length || 0);
        setClinicSettings(settings_data || null);
        setSettingsForm({
          clinicName: settings_data?.clinicName || '',
          branding: {
            primaryColor: settings_data?.branding?.primaryColor || '#0D4A4A',
            logoUrl: settings_data?.branding?.logoUrl || ''
          },
          contact: {
            phone: settings_data?.contact?.phone || '',
            email: settings_data?.contact?.email || ''
          },
          ehrSync: {
            enabled: Boolean(settings_data?.ehrSync?.enabled),
            endpoint: settings_data?.ehrSync?.endpoint || '',
            vendor: settings_data?.ehrSync?.vendor || '',
            syncFrequency: settings_data?.ehrSync?.syncFrequency || 'real-time',
            conflictResolution: settings_data?.ehrSync?.conflictResolution || 'ayurit_overrides'
          }
        });
        setEhrStatus(ehrResponse_value || null);
        setEhrForm({
          vendor: ehrResponse_value?.vendor || settings_data?.ehrSync?.vendor || '',
          endpoint: ehrResponse_value?.endpoint || settings_data?.ehrSync?.endpoint || '',
          token: '',
          enabled: Boolean(ehrResponse_value?.enabled ?? settings_data?.ehrSync?.enabled),
          syncFrequency: ehrResponse_value?.syncFrequency || settings_data?.ehrSync?.syncFrequency || 'real-time',
          conflictResolution: ehrResponse_value?.conflictResolution || settings_data?.ehrSync?.conflictResolution || 'ayurit_overrides'
        });
        setInvitesCount((invites_list && invites_list.length) || 0);
        setSystemHealth(health_data || null);
      } catch (err) {
        setErrorMsg(`Failed to load admin data: ${err?.data?.message || err?.message || 'Network error'}`);
        setStaff([]);
        setAuditLogs([]);
      } finally {
        setLoadingData(false);
      }
    };

    loadAdminData();
    refreshTimerRef.current = window.setInterval(loadAdminData, 30000);

    return () => {
      if (refreshTimerRef.current) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, []);

  const handleInviteStaff = async (e) => {
    e.preventDefault();

    try {
      const invite = await apiRequest('/users/invites', {
        method: 'POST',
        body: JSON.stringify({
          email: newStaff.email,
          role: newStaff.role,
          ttlMinutes: 60 * 24
        }),
      });

      setStaff((prev) => ([
        {
          id: invite.id,
          name: newStaff.name || invite.email.split('@')[0],
          email: invite.email,
          role: (invite.role || newStaff.role)?.replace('_', ' ') || 'Staff',
          status: 'Invited',
          lastActive: 'Never',
        },
        ...prev,
      ]));

      setNewStaff({ name: '', email: '', role: 'Practitioner' });
      setShowInviteForm(false);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to invite staff member right now.');
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const filteredStaff = staff.filter((member) => {
    if (!staffSearch.trim()) return true;
    const q = staffSearch.toLowerCase();
    const roleMatches = !staffRoleFilter.trim() || String(member.role || '').toLowerCase() === staffRoleFilter.toLowerCase();
    const statusMatches = !staffStatusFilter.trim() || String(member.status || '').toLowerCase() === staffStatusFilter.toLowerCase();
    return roleMatches && statusMatches && [member.name, member.email, member.role, member.status].some((value) => String(value || '').toLowerCase().includes(q));
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (!auditSearch.trim()) return true;
    const q = auditSearch.toLowerCase();
    const userMatches = !auditUserFilter.trim() || String(log.user || '').toLowerCase().includes(auditUserFilter.toLowerCase());
    const actionMatches = !auditActionFilter.trim() || String(log.action || '').toLowerCase().includes(auditActionFilter.toLowerCase());
    const statusMatches = !auditStatusFilter.trim() || String(log.status || '').toLowerCase() === auditStatusFilter.toLowerCase();
    const logDate = new Date(log.time || log.createdAt || log.created_at || Date.now());
    const fromMatches = !auditDateFrom || logDate >= new Date(auditDateFrom);
    const toMatches = !auditDateTo || logDate <= new Date(`${auditDateTo}T23:59:59.999`);
    return userMatches && actionMatches && statusMatches && fromMatches && toMatches && [log.user, log.action, log.target, log.status].some((value) => String(value || '').toLowerCase().includes(q));
  });

  const activeStaffCount = useMemo(() => staff.filter((member) => ADMIN_ROLES.has(String(member.role || '').toLowerCase()) && String(member.role || '').toLowerCase() !== 'patient').length, [staff]);
  const totalPatientsCount = useMemo(() => staff.filter((member) => String(member.role || '').toLowerCase() === 'patient').length, [staff]);
  const recentSecurityEvents = useMemo(() => filteredAuditLogs.slice(0, 3), [filteredAuditLogs]);

  const handleEditStaff = (member) => {
    setSelectedStaff(member);
    setStaffEditRole(String(member.role || 'doctor').toLowerCase());
    setStaffEditStatus(String(member.status || 'active').toLowerCase());
  };

  const closeStaffEditor = () => setSelectedStaff(null);

  const persistStaffChange = async () => {
    if (!selectedStaff) return;
    setSavingStaffAction(true);
    try {
      await apiRequest(`/users/${selectedStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: staffEditRole,
          status: staffEditStatus,
          isActive: staffEditStatus !== 'inactive'
        })
      });
      setSelectedStaff(null);
      await apiRequest('/audits?page=1&limit=200');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to update staff member right now.');
    } finally {
      setSavingStaffAction(false);
    }
  };

  const toggleStaffStatus = async () => {
    if (!selectedStaff) return;
    setSavingStaffAction(true);
    try {
      const nextStatus = String(staffEditStatus || selectedStaff.status || 'active').toLowerCase() === 'active' ? 'inactive' : 'active';
      await apiRequest(`/users/${selectedStaff.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: nextStatus,
          isActive: nextStatus === 'active'
        })
      });
      setSelectedStaff(null);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to change staff status right now.');
    } finally {
      setSavingStaffAction(false);
    }
  };

  const deleteStaff = async () => {
    if (!selectedStaff) return;
    if (!window.confirm(`Delete ${selectedStaff.name}? This cannot be undone.`)) return;
    setSavingStaffAction(true);
    try {
      await apiRequest(`/users/${selectedStaff.id}`, { method: 'DELETE' });
      setSelectedStaff(null);
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to delete staff member right now.');
    } finally {
      setSavingStaffAction(false);
    }
  };

  const handleSaveClinicSettings = async () => {
    setSavingSettings(true);
    try {
      const updated = await apiRequest('/clinic/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsForm)
      });
      setClinicSettings(updated);
      const ehrUpdated = await apiRequest('/integration/ehr/settings', {
        method: 'PUT',
        body: JSON.stringify({
          vendor: settingsForm.ehrSync.vendor,
          endpoint: settingsForm.ehrSync.endpoint,
          token: ehrForm.token,
          enabled: settingsForm.ehrSync.enabled,
          syncFrequency: settingsForm.ehrSync.syncFrequency,
          conflictResolution: settingsForm.ehrSync.conflictResolution
        })
      });
      setEhrStatus(ehrUpdated);
      setEhrForm((prev) => ({ ...prev, token: '' }));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to save clinic settings right now.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveEhrSettings = async () => {
    return handleSaveClinicSettings();
  };

  const handleRotateEhrToken = async () => {
    setSavingSettings(true);
    try {
      const updated = await apiRequest('/integration/ehr/rotate-token', { method: 'POST' });
      setEhrStatus((prev) => ({ ...(prev || {}), ...updated }));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to rotate token right now.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestEhrConnection = async () => {
    setSavingSettings(true);
    try {
      const updated = await apiRequest('/integration/ehr/test-connection', { method: 'POST' });
      setEhrStatus((prev) => ({ ...(prev || {}), ...updated }));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Unable to test EHR connection right now.');
    } finally {
      setSavingSettings(false);
    }
  };

  // ─── VIEWS ──────────────────────────────────────────────────────────────

  const OverviewView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-4">
        <div>
          <p className="text-[#3ECFB2] text-[13px] font-semibold tracking-[0.2em] uppercase mb-2">Command Center</p>
          <h1 className="text-4xl font-bold text-white tracking-tight leading-none">Admin Workspace</h1>
        </div>
        <button onClick={() => setActiveView('staff')} className="btn-mint px-6 py-3 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-[#3ECFB2]/20">
          <UserPlus className="w-4 h-4" /> Invite Staff
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-[#3ECFB2]">
          <div className="w-14 h-14 rounded-2xl bg-[#3ECFB2]/10 flex items-center justify-center border border-[#3ECFB2]/20">
            <Users className="w-6 h-6 text-[#3ECFB2]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{activeStaffCount}</div>
            <div className="text-sm text-white/50 font-medium uppercase tracking-wider mt-1">Active Staff</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-[#C9A84C]">
          <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/10 flex items-center justify-center border border-[#C9A84C]/20">
            <Activity className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{totalPatientsCount}</div>
            <div className="text-sm text-white/50 font-medium uppercase tracking-wider mt-1">Total Patients</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-5 border-l-4 border-l-[#0F6B6B]">
          <div className="w-14 h-14 rounded-2xl bg-[#0F6B6B]/20 flex items-center justify-center border border-[#0F6B6B]/30">
            <Server className="w-6 h-6 text-[#3ECFB2]" />
          </div>
          <div>
            <div className="text-3xl font-bold text-white flex items-center gap-2">{systemHealth?.status === 'ok' ? 'Live' : 'Down'} <span className={`w-2 h-2 rounded-full ${systemHealth?.status === 'ok' ? 'bg-[#3ECFB2]' : 'bg-[#E24B4A]'} animate-pulse`} /></div>
            <div className="text-sm text-white/50 font-medium uppercase tracking-wider mt-1">EHR API Uptime</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Audit Log */}
        <div className="glass-card p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-white text-lg flex items-center gap-2"><Lock className="w-5 h-5 text-[#3ECFB2]" /> Recent Security Events</h3>
            <button onClick={() => setActiveView('audit')} className="text-xs text-[#3ECFB2] font-medium hover:text-white transition-colors">View All Logs</button>
          </div>
          <div className="space-y-4">
            {recentSecurityEvents.map(log => (
              <div key={log.id} className="flex items-start justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex gap-3">
                  <div className={`mt-0.5 w-2 h-2 rounded-full ${log.status === 'Success' ? 'bg-[#3ECFB2]' : 'bg-[#E24B4A]'}`} />
                  <div>
                    <div className="text-[14px] text-white font-medium">{log.action}</div>
                    <div className="text-[12px] text-white/50 mt-1">{log.user} • {log.target}</div>
                  </div>
                </div>
                <div className="text-[11px] text-white/40">{log.time}</div>
              </div>
            ))}
            {!recentSecurityEvents.length && !loadingData ? <div className="text-sm text-white/40">No security events yet.</div> : null}
          </div>
        </div>

        {/* System Alerts */}
        <div className="glass-card p-8">
          <h3 className="font-semibold text-white text-lg flex items-center gap-2 mb-6"><AlertTriangle className="w-5 h-5 text-[#C9A84C]" /> System Alerts</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex gap-4">
              <AlertTriangle className="w-5 h-5 text-[#C9A84C] shrink-0" />
              <div>
                <div className="text-[14px] text-white font-medium">Pending Staff Invitations</div>
                <div className="text-[12px] text-white/60 mt-1">{invitesCount > 0 ? `${invitesCount} pending invitation(s).` : 'No pending invites.'}</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#3ECFB2]/10 border border-[#3ECFB2]/20 flex gap-4">
              <RefreshCw className="w-5 h-5 text-[#3ECFB2] shrink-0" />
              <div>
                <div className="text-[14px] text-white font-medium">EHR Sync Status</div>
                <div className="text-[12px] text-white/60 mt-1">{clinicSettings && clinicSettings.ehrSync && clinicSettings.ehrSync.enabled ? `Connected to ${clinicSettings.ehrSync.vendor || 'EHR'} at ${clinicSettings.ehrSync.endpoint || ''}` : 'Not configured'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const StaffView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-tight mb-2 leading-none">Staff Management</h1>
          <p className="text-white/50 text-[15px] font-light mt-3">Manage access controls and roles for your clinic team.</p>
        </div>
        {!showInviteForm && (
          <button onClick={() => setShowInviteForm(true)} className="btn-mint px-6 py-3 rounded-xl flex items-center gap-2 text-sm shadow-lg">
            <UserPlus className="w-4 h-4" /> Invite New Staff
          </button>
        )}
      </div>

      <AnimatePresence>
        {showInviteForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-6 md:p-8 mb-6 border-[#3ECFB2]/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-[#3ECFB2]" /> Send Invitation</h3>
              <form onSubmit={handleInviteStaff} className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" className="glass-input" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. Dr. Ananya" />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" className="glass-input" required value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="doctor@clinic.com" />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Role</label>
                  <select className="glass-input appearance-none cursor-pointer" value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                    <option className="text-black" value="Practitioner">Practitioner</option>
                    <option className="text-black" value="Admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowInviteForm(false)} className="px-6 py-[14px] rounded-xl bg-white/5 text-white/70 hover:bg-white/10 transition-colors text-sm font-medium">Cancel</button>
                  <button type="submit" className="btn-mint px-6 py-[14px] rounded-xl text-sm font-semibold">Send Invite</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/10 flex flex-wrap justify-between items-center gap-3 bg-black/20">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={staffSearch} onChange={(e) => setStaffSearch(e.target.value)} placeholder="Search staff members..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#3ECFB2]" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={staffRoleFilter} onChange={(e) => setStaffRoleFilter(e.target.value)} className="glass-input !w-40 py-2 px-3">
              <option className="text-black" value="">All Roles</option>
              <option className="text-black" value="superadmin">Super Admin</option>
              <option className="text-black" value="doctor">Doctor</option>
              <option className="text-black" value="patient">Patient</option>
            </select>
            <select value={staffStatusFilter} onChange={(e) => setStaffStatusFilter(e.target.value)} className="glass-input !w-32 py-2 px-3">
              <option className="text-black" value="">All Statuses</option>
              <option className="text-black" value="active">Active</option>
              <option className="text-black" value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-white/40 uppercase tracking-wider bg-white/5">
              <tr>
                <th className="py-4 px-6 font-medium">User</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Last Active</th>
                <th className="py-4 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(member => (
                <tr key={member.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] text-white flex items-center justify-center font-bold">{String(member.name || '?').charAt(0)}</div>
                      <div>
                        <div className="text-white font-medium">{member.name}</div>
                        <div className="text-[12px] text-white/50">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-[12px] text-[#C9A84C] font-medium bg-[#C9A84C]/10 px-3 py-1 rounded-full border border-[#C9A84C]/20">{String(member.role || 'staff').replace(/_/g, ' ')}</span>
                  </td>
                  <td className="py-4 px-6">
                    {String(member.status || '').toLowerCase() !== 'inactive' ? (
                      <span className="text-[12px] text-[#3ECFB2] font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#3ECFB2]" /> Active</span>
                    ) : (
                      <span className="text-[12px] text-white/60 font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white/40" /> Inactive</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-white/50 text-[12px]">{formatTimestamp(member.lastActive)}</td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleEditStaff(member)} className="text-[12px] text-[#3ECFB2] font-medium hover:text-white transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
              {!filteredStaff.length && !loadingData ? (
                <tr>
                  <td className="py-10 px-6 text-white/40 text-sm" colSpan={5}>No staff records match the current filters.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const IntegrationsView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-tight mb-2 leading-none">EHR & APIs</h1>
        <p className="text-white/50 text-[15px] font-light mt-3">Configure secure cloud sync with external Hospital Information Systems (HIS).</p>
      </div>

          <div className="glass-card p-8 border-[#3ECFB2]/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Database className="w-48 h-48" /></div>
          <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                Main Hospital EHR Sync <span className="text-[10px] bg-[#3ECFB2]/20 text-[#3ECFB2] px-2 py-1 rounded-md uppercase tracking-widest border border-[#3ECFB2]/30">Connected</span>
              </h2>
              <p className="text-[13px] text-white/50 mt-1">Bi-directional sync for patient demographics and diagnostic reports.</p>
            </div>
            <div className="p-3 bg-black/30 rounded-xl border border-white/10">
              <RefreshCw className="w-5 h-5 text-[#3ECFB2]" />
            </div>
          </div>

          <div className="space-y-5 bg-black/20 p-6 rounded-2xl border border-white/5">
            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Clinic Name</label>
              <input type="text" className="glass-input text-white/70" value={settingsForm.clinicName} onChange={(e) => setSettingsForm((prev) => ({ ...prev, clinicName: e.target.value }))} placeholder="Clinic name" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Primary Color</label>
                <input type="text" className="glass-input text-white/70" value={settingsForm.branding.primaryColor} onChange={(e) => setSettingsForm((prev) => ({ ...prev, branding: { ...prev.branding, primaryColor: e.target.value } }))} placeholder="#0D4A4A" />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Logo URL</label>
                <input type="text" className="glass-input text-white/70" value={settingsForm.branding.logoUrl} onChange={(e) => setSettingsForm((prev) => ({ ...prev, branding: { ...prev.branding, logoUrl: e.target.value } }))} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Contact Phone</label>
                <input type="text" className="glass-input text-white/70" value={settingsForm.contact.phone} onChange={(e) => setSettingsForm((prev) => ({ ...prev, contact: { ...prev.contact, phone: e.target.value } }))} placeholder="Clinic phone" />
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Contact Email</label>
                <input type="email" className="glass-input text-white/70" value={settingsForm.contact.email} onChange={(e) => setSettingsForm((prev) => ({ ...prev, contact: { ...prev.contact, email: e.target.value } }))} placeholder="clinic@ayurit.com" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Integration Enabled</label>
              <select className="glass-input appearance-none text-white/70" value={String(settingsForm.ehrSync.enabled)} onChange={(e) => setSettingsForm((prev) => ({ ...prev, ehrSync: { ...prev.ehrSync, enabled: e.target.value === 'true' } }))}>
                <option className="text-black" value="true">Enabled</option>
                <option className="text-black" value="false">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Endpoint URL</label>
              <input type="text" className="glass-input text-white/70" value={settingsForm.ehrSync.endpoint} onChange={(e) => setSettingsForm((prev) => ({ ...prev, ehrSync: { ...prev.ehrSync, endpoint: e.target.value } }))} placeholder={ehrStatus?.enabled || clinicSettings?.ehrSync?.enabled ? 'Configured' : 'Not configured'} />
            </div>
            <div>
              <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2 flex justify-between">
                <span>API Bearer Token (Masked)</span>
                <span onClick={handleRotateEhrToken} className="text-[#3ECFB2] cursor-pointer hover:underline">Rotate Key</span>
              </label>
              <div className="relative">
                <input type="password" className="glass-input text-white/70 font-mono tracking-widest" value={ehrForm.token} onChange={(e) => setEhrForm((prev) => ({ ...prev, token: e.target.value }))} placeholder={ehrStatus?.tokenMasked || (ehrStatus?.enabled || clinicSettings?.ehrSync?.enabled ? '*************' : 'Not configured')} />
                <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Sync Frequency</label>
                <select className="glass-input appearance-none text-white/70" value={settingsForm.ehrSync.syncFrequency} onChange={(e) => setSettingsForm((prev) => ({ ...prev, ehrSync: { ...prev.ehrSync, syncFrequency: e.target.value } }))}>
                  <option className="text-black" value="real-time">Real-time (Webhooks)</option>
                  <option className="text-black" value="15m">Every 15 Minutes</option>
                  <option className="text-black" value="hourly">Hourly</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Data Conflict Resolution</label>
                <select className="glass-input appearance-none text-white/70" value={settingsForm.ehrSync.conflictResolution} onChange={(e) => setSettingsForm((prev) => ({ ...prev, ehrSync: { ...prev.ehrSync, conflictResolution: e.target.value } }))}>
                  <option className="text-black" value="ayurit_overrides">AyurIT Overrides</option>
                  <option className="text-black" value="ehr_overrides">EHR Overrides</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <div className="flex gap-3">
              <button onClick={handleTestEhrConnection} className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm font-semibold">Test Connection</button>
              <button onClick={handleSaveClinicSettings} className="btn-mint px-6 py-3 rounded-xl text-sm font-semibold">Save Configuration</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const AuditView = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-[42px] font-bold text-white tracking-tight mb-2 leading-none">Security & Audit Logs</h1>
        <p className="text-white/50 text-[15px] font-light mt-3">HIPAA compliant tracking of all system access and data exports.</p>
      </div>

      <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/10 flex flex-wrap justify-between items-center gap-3 bg-black/20">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input type="text" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Search logs by user or action..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#3ECFB2]" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input value={auditUserFilter} onChange={(e) => setAuditUserFilter(e.target.value)} placeholder="User" className="glass-input !w-36 py-2 px-3" />
            <input value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)} placeholder="Action" className="glass-input !w-36 py-2 px-3" />
            <select value={auditStatusFilter} onChange={(e) => setAuditStatusFilter(e.target.value)} className="glass-input !w-36 py-2 px-3">
              <option className="text-black" value="">All Statuses</option>
              <option className="text-black" value="success">Success</option>
              <option className="text-black" value="failed">Failed</option>
              <option className="text-black" value="warning">Warning</option>
            </select>
            <input type="date" value={auditDateFrom} onChange={(e) => setAuditDateFrom(e.target.value)} className="glass-input !w-40 py-2 px-3" />
            <input type="date" value={auditDateTo} onChange={(e) => setAuditDateTo(e.target.value)} className="glass-input !w-40 py-2 px-3" />
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[12px] text-white/70 hover:bg-white/10 transition-colors">Download CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-white/40 uppercase tracking-wider bg-white/5">
              <tr>
                <th className="py-4 px-6 font-medium">Timestamp</th>
                <th className="py-4 px-6 font-medium">User / Actor</th>
                <th className="py-4 px-6 font-medium">Action Performed</th>
                <th className="py-4 px-6 font-medium">Target Data</th>
                <th className="py-4 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.map(log => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 text-white/50 text-[12px] whitespace-nowrap">{log.time}</td>
                  <td className="py-4 px-6 text-white font-medium">{log.user}</td>
                  <td className="py-4 px-6 text-white/80">{log.action}</td>
                  <td className="py-4 px-6 text-white/50 text-[12px] font-mono">{log.target}</td>
                  <td className="py-4 px-6">
                    {log.status === 'Success' ? (
                      <span className="text-[11px] font-semibold text-[#3ECFB2] bg-[#3ECFB2]/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Success</span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#E24B4A] bg-[#E24B4A]/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Failed</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredAuditLogs.length && !loadingData ? (
                <tr>
                  <td className="py-10 px-6 text-white/40 text-sm" colSpan={5}>No audit events match the current filters.</td>
                </tr>
              ) : null}
              </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  // ─── LAYOUT RENDER ───────────────────────────────────────────────────────

  return (
    <div className="admin-root">
      <AdminStyles />
      
      {/* ─── Immersive Background ─── */}
      <motion.div animate={{ backgroundPosition: ['0px 0px', '32px 32px'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0 bg-grid-pattern opacity-40 z-0 pointer-events-none" style={{ maskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)' }} />
      <motion.div animate={{ opacity: [0.1, 0.3, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] rounded-full bg-gradient-to-br from-[#3ECFB2]/20 to-transparent blur-[100px] z-0 pointer-events-none" />
      <motion.div animate={{ opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] min-w-[600px] min-h-[600px] rounded-full bg-gradient-to-tl from-[#C9A84C]/10 to-transparent blur-[120px] z-0 pointer-events-none" />

      {/* ─── Desktop Sidebar ─── */}
      <aside className="sidebar py-8">
        <div className="px-8 mb-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A2A22] to-[#04120E] flex items-center justify-center text-white shadow-lg border border-white/10">
            <Shield className="w-6 h-6 text-[#3ECFB2]" />
          </div>
          <div>
            <div className="font-bold text-xl leading-none text-white tracking-wide">AyurIT</div>
            <div className="text-[10px] text-[#C9A84C] uppercase tracking-widest mt-1.5 font-semibold">Super Admin</div>
          </div>
        </div>

        <nav className="flex-1 mt-4 space-y-1 custom-scrollbar overflow-y-auto">
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-8 mb-3 mt-2">Workspace</div>
          <div className={`nav-item ${activeView === 'overview' ? 'active' : ''}`} onClick={() => setActiveView('overview')}>
            <Activity className="w-5 h-5" /> Command Center
          </div>
          <div className={`nav-item ${activeView === 'staff' ? 'active' : ''}`} onClick={() => setActiveView('staff')}>
            <Users className="w-5 h-5" /> Staff Management
          </div>
          
          <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-8 mb-3 mt-8">System</div>
          <div className={`nav-item ${activeView === 'integrations' ? 'active' : ''}`} onClick={() => setActiveView('integrations')}>
            <Database className="w-5 h-5" /> EHR Integrations
          </div>
          <div className={`nav-item ${activeView === 'audit' ? 'active' : ''}`} onClick={() => setActiveView('audit')}>
            <Lock className="w-5 h-5" /> Security & Audit
          </div>
          <div className={`nav-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
            <Settings className="w-5 h-5" /> Clinic Settings
          </div>
        </nav>

        <div className="px-6 mt-auto pt-4">
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-medium">
            <LogOut className="w-4 h-4" /> Secure Logout
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="content-area custom-scrollbar w-full">
        <div className="relative z-10 h-full">
          {loadingData ? <div className="mb-4 text-sm text-white/60">Loading live data...</div> : null}
          {errorMsg ? <div className="mb-4 text-sm text-[#F1B6B6]">{errorMsg}</div> : null}
          <AnimatePresence mode="wait">
            {activeView === 'overview' && <OverviewView key="overview" />}
            {activeView === 'staff' && <StaffView key="staff" />}
            {activeView === 'integrations' && <IntegrationsView key="integrations" />}
            {activeView === 'audit' && <AuditView key="audit" />}
            {activeView === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-center">
                <Settings className="w-16 h-16 text-[#3ECFB2] mb-4 opacity-50" />
                <h2 className="text-2xl font-semibold text-white mb-2">Clinic Settings</h2>
                <p className="text-white/50 max-w-md">Manage billing, clinic branding, and global platform preferences here.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {selectedStaff ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
          <div className="glass-card w-full max-w-lg p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[#3ECFB2] font-semibold">Staff Actions</p>
                <h3 className="text-2xl font-semibold text-white mt-2">{selectedStaff.name}</h3>
                <p className="text-sm text-white/50 mt-1">{selectedStaff.email}</p>
              </div>
              <button onClick={closeStaffEditor} className="text-white/50 hover:text-white transition-colors text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Role</label>
                <select className="glass-input appearance-none text-white/70" value={staffEditRole} onChange={(e) => setStaffEditRole(e.target.value)}>
                  <option className="text-black" value="superadmin">Super Admin</option>
                  <option className="text-black" value="doctor">Doctor</option>
                  <option className="text-black" value="admin">Admin</option>
                  <option className="text-black" value="patient">Patient</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-2">Status</label>
                <select className="glass-input appearance-none text-white/70" value={staffEditStatus} onChange={(e) => setStaffEditStatus(e.target.value)}>
                  <option className="text-black" value="active">Active</option>
                  <option className="text-black" value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 justify-end">
                <button onClick={deleteStaff} disabled={savingStaffAction} className="px-5 py-3 rounded-xl bg-[#E24B4A]/15 border border-[#E24B4A]/30 text-[#F1B6B6] hover:bg-[#E24B4A]/25 transition-colors text-sm font-semibold disabled:opacity-50">Delete</button>
                <button onClick={toggleStaffStatus} disabled={savingStaffAction} className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-sm font-semibold disabled:opacity-50">
                  {String(staffEditStatus || 'active').toLowerCase() === 'active' ? 'Deactivate' : 'Reactivate'}
                </button>
                <button onClick={persistStaffChange} disabled={savingStaffAction} className="btn-mint px-5 py-3 rounded-xl text-sm font-semibold disabled:opacity-50">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}