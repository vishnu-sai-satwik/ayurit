import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, Lock, Shield, Stethoscope,
  User, Sparkles, Leaf, Building, Key,
  CheckCircle, Phone, MapPin, Award,
  AlertCircle, Loader2, ChevronDown, Eye, EyeOff
} from 'lucide-react';
import { resolveApiBaseUrl, apiRequest } from '../utils/api';
import { logger } from '../utils/logger';

// ─── Styles ──────────────────────────────────────────────────────────────────
const SignUpStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&display=swap');

    .signup-root {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #04120E 0%, #0D4A4A 100%);
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      display: flex; flex-direction: column;
      align-items: center; justify-content: flex-start;
      overflow-y: auto; overflow-x: hidden;
      color: #F7F3EE; z-index: 50;
    }

    .btn-mint {
      background: linear-gradient(135deg, #3ECFB2, #2BB89D);
      color: #051C15; font-weight: 600; letter-spacing: 0.02em;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 20px rgba(62,207,178,0.25);
      border: none; cursor: pointer;
    }
    .btn-mint:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(62,207,178,0.4); }
    .btn-mint:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .glass-card {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(32px);
      -webkit-backdrop-filter: blur(32px);
      border: 1px solid rgba(255,255,255,0.1);
      box-shadow: 0 24px 60px rgba(0,0,0,0.4);
    }

    .glass-input-container { position: relative; display: flex; align-items: center; }

    .glass-input {
      width: 100%; padding: 13px 18px 13px 44px;
      border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);
      background: rgba(0,0,0,0.2); font-family: 'Poppins', sans-serif;
      font-size: 14px; color: #FFFFFF; outline: none; transition: all 0.3s ease;
    }
    .glass-input.no-icon { padding-left: 18px; }
    .glass-input-container:has(.password-toggle-btn) .glass-input {
      padding-right: 44px;
    }
    .glass-input:focus {
      border-color: #3ECFB2; background: rgba(0,0,0,0.4);
      box-shadow: 0 0 0 3px rgba(62,207,178,0.15);
    }
    .glass-input::placeholder { color: rgba(255,255,255,0.4); }
    .glass-input option { color: #000; background: #fff; }

    .input-icon {
      position: absolute; left: 16px;
      color: rgba(255,255,255,0.5); transition: color 0.3s ease; pointer-events: none;
    }
    .glass-input-container:focus-within .input-icon { color: #3ECFB2; }

    .password-toggle-btn {
      position: absolute;
      right: 14px;
      color: rgba(255, 255, 255, 0.5);
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.3s ease;
    }
    .password-toggle-btn:hover {
      color: rgba(255, 255, 255, 0.8);
    }
    .glass-input-container:focus-within .password-toggle-btn {
      color: #3ECFB2;
    }

    .bg-grid-pattern {
      background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
      background-size: 32px 32px;
    }

    .role-select-card { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .role-select-card:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(62,207,178,0.4);
      transform: translateY(-2px);
    }

    .field-label {
      display: block; font-size: 11px; font-weight: 500;
      color: rgba(255,255,255,0.65); margin-bottom: 6px;
      margin-left: 2px; text-transform: uppercase; letter-spacing: 0.08em;
    }

    .optional-badge {
      font-size: 9px; background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      color: rgba(255,255,255,0.4); border-radius: 4px;
      padding: 1px 5px; margin-left: 6px; letter-spacing: 0; text-transform: none;
      font-weight: 400; vertical-align: middle;
    }

    .section-divider {
      display: flex; align-items: center; gap: 10px; margin: 4px 0 8px;
    }
    .section-divider span {
      font-size: 10px; font-weight: 600; color: rgba(62,207,178,0.8);
      text-transform: uppercase; letter-spacing: 0.1em; white-space: nowrap;
    }
    .section-divider::before, .section-divider::after {
      content: ''; flex: 1; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(62,207,178,0.2), transparent);
    }

    .error-banner {
      background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.25);
      border-radius: 10px; padding: 10px 14px;
      display: flex; align-items: flex-start; gap: 8px;
    }
    .error-banner p { font-size: 13px; color: rgba(255,170,170,0.95); margin: 0; }

    .select-arrow {
      position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      color: rgba(255,255,255,0.4); pointer-events: none;
    }
  `}</style>
);

// ─── Constants ───────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'admin',        title: 'Clinic Admin / Owner',     desc: 'Register a new clinic and manage staff.',               icon: Shield,       color: '#3ECFB2' },
  { id: 'practitioner', title: 'Ayurvedic Practitioner',   desc: 'Join a clinic to manage patients and treatment plans.', icon: Stethoscope,  color: '#0F9B8E' },
  { id: 'patient',      title: 'Patient',                  desc: 'Access your diet charts and log daily health data.',   icon: User,         color: '#E1F5EE' },
];

const PRAKRITI_OPTIONS = [
  { value: 'unknown',     label: "I don't know yet" },
  { value: 'vata',        label: 'Vata' },
  { value: 'pitta',       label: 'Pitta' },
  { value: 'kapha',       label: 'Kapha' },
  { value: 'vata_pitta',  label: 'Vata-Pitta' },
  { value: 'pitta_kapha', label: 'Pitta-Kapha' },
  { value: 'vata_kapha',  label: 'Vata-Kapha' },
  { value: 'tridosha',    label: 'Tridosha (balanced)' },
];

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

const INITIAL_FORM = {
  firstName: '', lastName: '', email: '', password: '',
  clinicName: '', clinicPhone: '', clinicCity: '',
  inviteCode: '', specialization: '', licenseNumber: '',
  yearsExp: '', certifications: '', department: '', phone: '',
  age: '', gender: '', prakriti: 'unknown', chronicConds: '', allergies: '', bloodGroup: '',
};

// ─── Field helpers ────────────────────────────────────────────────────────────
const Field = ({ label, optional, children }) => (
  <div>
    <label className="field-label">
      {label}{optional && <span className="optional-badge">optional</span>}
    </label>
    {children}
  </div>
);

const TextInput = ({ icon: Icon, name, value, onChange, placeholder, type = 'text', required, autoFocus, showPassword, setShowPassword }) => (
  <div className="glass-input-container">
    <input type={type === 'password' && !showPassword ? 'password' : type === 'password' && showPassword ? 'text' : type} name={name} value={value} onChange={onChange} placeholder={placeholder}
      required={required} autoFocus={autoFocus}
      className={`glass-input${!Icon ? ' no-icon' : ''}`}
      autoComplete={type === 'password' ? 'new-password' : 'off'}
    />
    {Icon && <Icon className="w-4 h-4 input-icon" />}
    {type === 'password' && (
      <button
        type="button"
        onClick={() => setShowPassword && setShowPassword(!showPassword)}
        className="password-toggle-btn"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    )}
  </div>
);

const SelectInput = ({ name, value, onChange, options, placeholder }) => (
  <div className="glass-input-container" style={{ position: 'relative' }}>
    <select name={name} value={value} onChange={onChange}
      className="glass-input no-icon" style={{ paddingRight: '36px', WebkitAppearance: 'none', appearance: 'none' }}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
    <ChevronDown className="w-4 h-4 select-arrow" />
  </div>
);

const SectionDivider = ({ label }) => (
  <div className="section-divider"><span>{label}</span></div>
);

// ─── Role-specific fields ─────────────────────────────────────────────────────
const AdminFields = ({ form, onChange }) => (
  <>
    <SectionDivider label="Clinic Details" />
    <Field label="Clinic Name">
      <TextInput icon={Building} name="clinicName" value={form.clinicName} onChange={onChange} placeholder="e.g. Kerala Ayurveda Centre" required />
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Clinic Phone" optional>
        <TextInput icon={Phone} name="clinicPhone" value={form.clinicPhone} onChange={onChange} placeholder="+91 98765 43210" type="tel" />
      </Field>
      <Field label="City" optional>
        <TextInput icon={MapPin} name="clinicCity" value={form.clinicCity} onChange={onChange} placeholder="e.g. Thrissur" />
      </Field>
    </div>
  </>
);

const PractitionerFields = ({ form, onChange }) => (
  <>
    <SectionDivider label="Professional Details" />
    <Field label="Clinic Invite Code">
      <TextInput icon={Key} name="inviteCode" value={form.inviteCode} onChange={onChange} placeholder="Provided by your clinic admin" required />
    </Field>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Specialization" optional>
        <TextInput icon={Stethoscope} name="specialization" value={form.specialization} onChange={onChange} placeholder="e.g. Panchakarma" />
      </Field>
      <Field label="License No." optional>
        <TextInput icon={Award} name="licenseNumber" value={form.licenseNumber} onChange={onChange} placeholder="e.g. MH-2019-XXXXX" />
      </Field>
    </div>
    <Field label="Years of Experience" optional>
      <TextInput name="yearsExp" value={form.yearsExp} onChange={onChange} placeholder="e.g. 8" type="number" />
    </Field>
    <p className="text-[11px] text-white/35 ml-1">Don't have an invite code? Ask your clinic administrator.</p>
  </>
);


const PatientFields = ({ form, onChange }) => (
  <>
    <SectionDivider label="Health Profile" />
    <div className="grid grid-cols-2 gap-4">
      <Field label="Age">
        <TextInput name="age" value={form.age} onChange={onChange} placeholder="e.g. 34" type="number" required />
      </Field>
      <Field label="Gender">
        <SelectInput name="gender" value={form.gender} onChange={onChange} placeholder="Select..."
          options={[{ value:'male', label:'Male' }, { value:'female', label:'Female' }, { value:'other', label:'Other' }]} />
      </Field>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Blood Group" optional>
        <SelectInput name="bloodGroup" value={form.bloodGroup} onChange={onChange} placeholder="Select..."
          options={BLOOD_GROUPS.map(b => ({ value: b, label: b }))} />
      </Field>
      <Field label="Phone" optional>
        <TextInput icon={Phone} name="phone" value={form.phone} onChange={onChange} placeholder="+91 98765 43210" type="tel" />
      </Field>
    </div>
    <SectionDivider label="Ayurvedic Profile" />
    <Field label="Prakriti (Body Constitution)" optional>
      <SelectInput name="prakriti" value={form.prakriti} onChange={onChange} options={PRAKRITI_OPTIONS} />
    </Field>
    <Field label="Chronic Conditions" optional>
      <TextInput name="chronicConds" value={form.chronicConds} onChange={onChange} placeholder="e.g. Diabetes, Hypertension (comma separated)" />
    </Field>
    <Field label="Food Allergies" optional>
      <TextInput icon={AlertCircle} name="allergies" value={form.allergies} onChange={onChange} placeholder="e.g. Peanuts, Dairy" />
    </Field>
  </>
);

const ROLE_FIELDS = { admin: AdminFields, practitioner: PractitionerFields, patient: PatientFields };

// ─── Main Component ───────────────────────────────────────────────────────────
const SignUpPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [createdUser, setCreatedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (apiError) setApiError(null);
  };

  const handleRoleSelect = (role) => { setSelectedRole(role); setApiError(null); setStep(1); };

  const handleBack = () => {
    if (step === 0) return navigate('/login');
    setStep(s => s - 1);
    if (step === 1) { setSelectedRole(null); setApiError(null); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiError(null);

    const payload = {
      role: selectedRole.id,
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      email:     form.email.trim().toLowerCase(),
      password:  form.password,
      ...(selectedRole.id === 'admin' && {
        clinicName: form.clinicName.trim(), clinicPhone: form.clinicPhone.trim(), clinicCity: form.clinicCity.trim(),
      }),
      ...(selectedRole.id === 'practitioner' && { inviteCode: form.inviteCode.trim() }),
      ...(selectedRole.id === 'practitioner' && {
        specialization: form.specialization.trim(), licenseNumber: form.licenseNumber.trim(),
        yearsExp: form.yearsExp ? Number(form.yearsExp) : undefined,
      }),
      ...(selectedRole.id === 'patient' && {
        age: Number(form.age), gender: form.gender, phone: form.phone.trim(),
        prakriti: form.prakriti || 'unknown', chronicConds: form.chronicConds.trim(),
        allergies: form.allergies.trim(), bloodGroup: form.bloodGroup || 'unknown',
      }),
    };

    try {
      const debugPayload = {
        ...payload,
        password: payload.password ? '[REDACTED]' : undefined,
      };
      const apiBase = await resolveApiBaseUrl();
      logger.debug('Signup', 'Sending register request', {
        url: `${apiBase}/auth/register`,
        payload: debugPayload,
      });

      try {
        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        logger.debug('Signup', 'Register request succeeded', {
          userId: data?.user?.id,
          email: data?.user?.email,
        });
        setCreatedUser(data.user);
        setStep(2);
        window.dispatchEvent(new CustomEvent('ayurit:toast', {
          detail: { type: 'success', message: 'Account created successfully.' }
        }));
      } catch (err) {
        logger.error('Signup', 'Register request failed', { error: err });
        setApiError(err?.data?.message || err?.message || err?.details || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
    } 
  } catch (error) {
      logger.error('Signup', 'Unexpected signup error', { error });
      setApiError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const slide = {
    hidden:  { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit:    { opacity: 0, x: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  const RoleFields = selectedRole ? ROLE_FIELDS[selectedRole.id] : null;
  const SelectedIcon = selectedRole?.icon;

  return (
    <div className="signup-root p-4 sm:p-8">
      <SignUpStyles />

      {/* Backgrounds */}
      <motion.div animate={{ backgroundPosition: ['0px 0px','32px 32px'] }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-grid-pattern opacity-40 z-0 pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)' }} />
      <motion.div animate={{ opacity: [0.2,0.5,0.2] }} transition={{ duration: 8, repeat: Infinity }}
        style={{ position:'absolute', top:'5%', left:'-5%', width:600, height:600, background:'radial-gradient(circle, rgba(62,207,178,0.12) 0%, transparent 70%)', filter:'blur(60px)', zIndex:0, pointerEvents:'none' }} />
      <motion.div animate={{ opacity: [0.15,0.4,0.15] }} transition={{ duration: 10, repeat: Infinity, delay: 2 }}
        style={{ position:'absolute', bottom:'5%', right:'-5%', width:700, height:700, background:'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', filter:'blur(80px)', zIndex:0, pointerEvents:'none' }} />
      <motion.div animate={{ y:[0,-30,0], rotate:[0,10,0] }} transition={{ duration:12, repeat:Infinity }}
        className="absolute top-[15%] left-[8%] text-white/[0.02] z-0 pointer-events-none hidden md:block"><Leaf className="w-80 h-80" /></motion.div>
      <motion.div animate={{ y:[0,30,0], rotate:[0,-10,0] }} transition={{ duration:14, repeat:Infinity, delay:1 }}
        className="absolute bottom-[10%] right-[5%] text-white/[0.02] z-0 pointer-events-none hidden md:block"><Sparkles className="w-96 h-96" /></motion.div>

      {/* Back */}
      <div className="w-full max-w-[1020px] mx-auto relative z-20 mt-4 md:mt-8 mb-6 md:mb-8">
        <button onClick={handleBack} className="flex items-center gap-2 text-white/60 hover:text-[#3ECFB2] transition-colors text-[13px] font-medium">
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? 'Back to Login' : 'Back to Role Selection'}
        </button>
      </div>

      {/* Card */}
      <motion.div initial={{ opacity:0, y:20, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}
        className="glass-card rounded-[32px] w-full max-w-[1020px] p-8 md:p-12 relative z-20 mb-16 mx-auto flex flex-col md:flex-row items-stretch gap-10 md:gap-14">

        {/* Left */}
        <div className="w-full md:w-[38%] flex flex-col items-center md:items-start text-center md:text-left">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="l0" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="flex flex-col items-center md:items-start w-full">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] flex items-center justify-center shadow-xl shadow-[#3ECFB2]/20 mb-6 border border-white/10">
                  <Sparkles className="w-8 h-8 fill-white text-white" />
                </div>
                <h2 className="text-[32px] md:text-[38px] font-semibold text-white leading-tight mb-3">Join AyurIT</h2>
                <p className="text-white/55 text-[15px] font-light mb-8 max-w-[300px]">
                  Select your account type to join the leading cloud platform for Ayurvedic practice management.
                </p>
              </motion.div>
            )}
            {step === 1 && selectedRole && (
              <motion.div key="l1" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} className="flex flex-col items-center md:items-start w-full">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                  {SelectedIcon && <SelectedIcon className="w-8 h-8" style={{ color: selectedRole.color }} />}
                </div>
                <h2 className="text-[26px] md:text-[32px] font-semibold text-white leading-tight mb-3">
                  {selectedRole.id === 'admin' ? 'Register Clinic' : 'Create Account'}
                </h2>
                <p className="text-white/55 text-[14px] font-light mb-6 max-w-[280px]">
                  Setting up your profile as an <span className="font-medium text-white">{selectedRole.title}</span>.
                </p>
                <div className="hidden md:flex flex-col gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#3ECFB2] text-[#051C15] flex items-center justify-center text-[10px] font-bold">✓</div>
                    <span className="text-[12px] text-white font-medium">Select Role</span>
                  </div>
                  <div className="w-[2px] h-6 bg-gradient-to-b from-[#3ECFB2] to-white/20 ml-[11px]" />
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-[#3ECFB2] text-[#3ECFB2] flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(62,207,178,0.3)]">2</div>
                    <span className="text-[12px] text-[#3ECFB2] font-semibold">Profile Details</span>
                  </div>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="l2" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} className="flex flex-col items-center md:items-start w-full">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] flex items-center justify-center shadow-[0_8px_30px_rgba(62,207,178,0.3)] mb-6 border border-white/10">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-[32px] md:text-[38px] font-semibold text-white leading-tight mb-3">All Set!</h2>
                <p className="text-white/55 text-[15px] font-light mb-8 max-w-[300px]">Account created and saved to the platform.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden md:block w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Right */}
        <div className="w-full md:w-[62%] flex flex-col justify-center">
          <AnimatePresence mode="wait">

            {step === 0 && (
              <motion.div key="r0" variants={slide} initial="hidden" animate="visible" exit="exit" className="flex flex-col gap-3">
                {ROLES.map(role => {
                  const RoleIcon = role.icon;
                  return (
                    <div key={role.id} onClick={() => handleRoleSelect(role)}
                      className="role-select-card p-4 rounded-xl border border-white/10 bg-white/5 cursor-pointer flex items-center gap-4">
                      <div className="p-3 rounded-full bg-black/20 flex-shrink-0">
                        <RoleIcon className="w-5 h-5" style={{ color: role.color }} />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-medium text-white mb-0.5">{role.title}</h3>
                        <p className="text-[12px] text-white/50 leading-snug">{role.desc}</p>
                      </div>
                    </div>
                  );
                })}
                <p className="text-[13px] text-white/55 text-center mt-4">
                  Already have an account? <Link to="/login" className="text-[#3ECFB2] font-medium ml-1">Log in</Link>
                </p>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="r1" variants={slide} initial="hidden" animate="visible" exit="exit">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  {apiError && (
                    <div className="error-banner">
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        {Array.isArray(apiError)
                          ? apiError.map((e, i) => <p key={i}>{e}</p>)
                          : <p>{apiError}</p>}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name">
                      <TextInput name="firstName" value={form.firstName} onChange={onChange} placeholder="Arjun" required autoFocus />
                    </Field>
                    <Field label="Last Name">
                      <TextInput name="lastName" value={form.lastName} onChange={onChange} placeholder="Mehta" required />
                    </Field>
                  </div>

                  <Field label="Email Address">
                    <TextInput icon={Mail} name="email" value={form.email} onChange={onChange} placeholder="you@domain.com" type="email" required />
                  </Field>

                  <Field label="Password">
                    <TextInput icon={Lock} name="password" value={form.password} onChange={onChange} placeholder="Min. 8 characters" type="password" required showPassword={showPassword} setShowPassword={setShowPassword} />
                  </Field>

                  {RoleFields && <RoleFields form={form} onChange={onChange} />}

                  <div className="mt-2">
                    <button type="submit" disabled={loading} className="w-full btn-mint py-4 rounded-xl text-[15px] flex items-center justify-center gap-2">
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account…</>
                        : selectedRole?.id === 'admin' ? 'Finalize Registration →' : 'Create Account →'}
                    </button>
                  </div>

                  <p className="text-[12px] text-white/35 text-center">
                    Already have an account? <Link to="/login" className="text-[#3ECFB2]">Log in</Link>
                  </p>
                </form>
              </motion.div>
            )}

            {step === 2 && createdUser && (
              <motion.div key="r2" variants={slide} initial="hidden" animate="visible" exit="exit" className="flex flex-col justify-center">
                <div className="bg-black/20 border border-white/10 rounded-2xl p-6 mb-6 shadow-inner">
                  <h3 className="text-[15px] font-medium text-white mb-4">Registration Summary</h3>
                  <div className="space-y-3">
                    <SummaryRow label="Account Type" value={selectedRole?.title} accent />
                    <SummaryRow label="Name"  value={createdUser.name} />
                    <SummaryRow label="Email" value={createdUser.email} />
                    {createdUser.profile?.clinicName && <SummaryRow label="Clinic" value={createdUser.profile.clinicName} />}
                    {createdUser.profile?.age && <SummaryRow label="Age / Gender" value={`${createdUser.profile.age} / ${createdUser.profile.gender}`} />}
                    {createdUser.profile?.specialization && <SummaryRow label="Specialization" value={createdUser.profile.specialization} />}
                    {createdUser.profile?.prakriti && createdUser.profile.prakriti !== 'unknown' && (
                      <SummaryRow label="Prakriti" value={PRAKRITI_OPTIONS.find(p => p.value === createdUser.profile.prakriti)?.label} />
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-white/55 mb-6 leading-relaxed">
                  {selectedRole?.id === 'admin'
                    ? `"${createdUser.profile?.clinicName}" is registered. Log in and invite your team.`
                    : selectedRole?.id === 'patient'
                    ? "Your patient portal is ready. Log in to access diet charts and health tracking."
                    : "Your account is linked. An administrator will verify your access shortly."}
                </p>
                <button onClick={() => navigate('/login')} className="w-full btn-mint py-4 rounded-xl text-[15px]">
                  Go to Login →
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const SummaryRow = ({ label, value, accent }) =>
  value ? (
    <div className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
      <span className="text-[11px] text-white/45 uppercase tracking-wider">{label}</span>
      <span className={`text-[13px] font-medium ${accent ? 'text-[#3ECFB2]' : 'text-white'}`}>{value}</span>
    </div>
  ) : null;

export default SignUpPage;