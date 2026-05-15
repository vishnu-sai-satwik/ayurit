import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Mail, Lock, Shield, Stethoscope, User, Sparkles, Leaf, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../utils/api';
import { setSession } from '../utils/session';
import { logger } from '../utils/logger';

// ─── Scoped Theme Styles for Login ─────────────────────────────────────────
const LoginStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&display=swap');

    .login-root {
      font-family: 'Poppins', sans-serif;
      background: linear-gradient(135deg, #04120E 0%, #0D4A4A 100%);
      position: fixed; 
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      overflow-y: auto;
      overflow-x: hidden;
      color: #F7F3EE;
      z-index: 50;
      /* Prevent width shifts from scrollbar appearance */
      scrollbar-gutter: stable;
    }

    .btn-mint {
      background: linear-gradient(135deg, #3ECFB2, #2BB89D);
      color: #051C15;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 20px rgba(62,207,178,0.25);
      border: none;
      cursor: pointer;
    }
    .btn-mint:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(62,207,178,0.4);
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.04);
      backdrop-filter: blur(32px);
      -webkit-backdrop-filter: blur(32px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
      transform: translateZ(0);
      will-change: transform, backdrop-filter;
    }

    .glass-input-container {
      position: relative;
      display: flex;
      align-items: center;
    }

    .glass-input {
      width: 100%; 
      padding: 14px 18px 14px 44px; 
      border-radius: 12px; 
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(0, 0, 0, 0.2); 
      font-family: 'Poppins', sans-serif; 
      font-size: 14px;
      color: #FFFFFF; 
      outline: none; 
      transition: all 0.3s ease;
    }
    .glass-input-container:has(.password-toggle-btn) .glass-input {
      padding-right: 44px;
    }
    .glass-input:focus {
      border-color: #3ECFB2;
      background: rgba(0, 0, 0, 0.4);
      box-shadow: 0 0 0 3px rgba(62,207,178,0.15);
    }
    .glass-input::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    .input-icon {
      position: absolute;
      left: 16px;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.3s ease;
      pointer-events: none;
    }
    .glass-input:focus + .input-icon,
    .glass-input-container:focus-within .input-icon {
      color: #3ECFB2;
    }

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

    /* Custom Scrollbar for dropdown */
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
      border-radius: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 8px;
    }
      
    /* Tech Grid Background Pattern */
    .bg-grid-pattern {
      background-image: radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 32px 32px;
    }
  `}</style>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const dropdownRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Debug: Track render count to detect infinite loops
  const renderCountRef = useRef(0);
  const isDevMode = import.meta.env.DEV;
  
  React.useEffect(() => {
    renderCountRef.current += 1;
    if (isDevMode && renderCountRef.current % 5 === 0) {
      logger.debug('LoginPage', 'Render count', {
        count: renderCountRef.current,
        loading,
        hasError: !!errorMsg,
        role: selectedRole?.id,
      });
    }
  });

  // Exact names matched with the SignUp wizard to avoid confusion
  const roles = [
    { id: 'admin', title: 'Clinic Admin / Owner', icon: Shield },
    { id: 'practitioner', title: 'Ayurvedic Practitioner', icon: Stethoscope },
    { id: 'patient', title: 'Patient', icon: User }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Debug: Log state changes
  useEffect(() => {
    if (isDevMode) {
      logger.debug('LoginPage', 'Loading state changed', { loading });
    }
  }, [loading]);
  
  useEffect(() => {
    if (isDevMode && errorMsg) {
      logger.debug('LoginPage', 'Error message', { message: errorMsg });
    }
  }, [errorMsg]);

  const roleHome = {
    superadmin: '/admin-dashboard',
    doctor: '/dashboard',
    patient: '/patient-dashboard',
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!selectedRole?.id) {
      setErrorMsg('Please select your role to continue.');
      return;
    }

    if (isDevMode) {
      logger.debug('LoginPage', 'Attempting login', { role: selectedRole.id, email });
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await apiRequest('/auth/token', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          role: selectedRole.id,
        }),
      });

      if (isDevMode) {
        logger.debug('LoginPage', 'Login successful, setting session', { role: data.role });
      }

      setSession({
        token: data.token,
        role: data.role,
        user: data.user,
      });

      window.dispatchEvent(new CustomEvent('ayurit:toast', {
        detail: { type: 'success', message: 'Signed in successfully.' }
      }));

      navigate(roleHome[data.role] || '/dashboard');
    } catch (err) {
      if (isDevMode) {
        logger.debug('LoginPage', 'Login error', { message: err?.data?.message || err?.message });
      }
      setErrorMsg(err?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root p-4 sm:p-8">
      <LoginStyles />
      
      {/* ─── Immersive Abstract Background Animation ──────────────────────────── */}
      <motion.div 
        animate={{ backgroundPosition: ['0px 0px', '32px 32px'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 bg-grid-pattern opacity-40 z-0 pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 20%, black 80%)' }}
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, 45, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] min-w-[500px] min-h-[500px] rounded-full bg-gradient-to-br from-[#3ECFB2]/30 to-transparent blur-[100px] z-0 pointer-events-none"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, -45, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] min-w-[600px] min-h-[600px] rounded-full bg-gradient-to-tl from-[#C9A84C]/20 to-transparent blur-[120px] z-0 pointer-events-none"
      />
      <motion.div 
        animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] left-[8%] text-white/[0.02] z-0 pointer-events-none hidden md:block"
      >
        <Leaf className="w-80 h-80" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] right-[5%] text-white/[0.02] z-0 pointer-events-none hidden md:block"
      >
        <Sparkles className="w-96 h-96" />
      </motion.div>

      {/* Back Button */}
      <div className="w-full max-w-[900px] mx-auto relative z-20 mt-4 md:mt-8 mb-6 md:mb-10">
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2 text-white/60 hover:text-[#3ECFB2] transition-colors text-[13px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      {/* Main Horizontal Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card rounded-[32px] w-full max-w-[900px] p-8 md:p-12 relative z-20 mb-16 mx-auto flex flex-col md:flex-row items-stretch gap-10 md:gap-14"
      >
        
        {/* Left Column: Greeting & Sign Up Link */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D4A4A] to-[#3ECFB2] flex items-center justify-center text-white shadow-xl shadow-[#3ECFB2]/20 mb-6 border border-white/10">
            <Sparkles className="w-8 h-8 fill-white" />
          </div>
          <h2 className="text-[32px] md:text-[38px] font-semibold text-white leading-tight mb-3">Welcome Back</h2>
          <p className="text-white/60 text-[15px] font-light mb-8 max-w-[300px]">
            Sign in to access your complete Ayurvedic practice dashboard and patient records.
          </p>

          {/* Desktop Sign Up Link */}
          <div className="hidden md:flex flex-col mt-auto pt-8">
            <p className="text-[13px] text-white/50 mb-2">
              Secure, HIPAA Compliant Gateway
            </p>
            <p className="text-[14px] text-white/80">
              New to AyurIT? 
              <Link to="/signup" className="text-[#3ECFB2] hover:text-white transition-colors font-semibold ml-1.5 underline underline-offset-4 decoration-[#3ECFB2]/30">
                Create an Account
              </Link>
            </p>
          </div>
        </div>

        {/* Divider Line (Desktop only) */}
        <div className="hidden md:block w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Right Column: Interactive Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">

            {errorMsg ? (
              <div className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-100">
                {errorMsg}
              </div>
            ) : null}
            
            {/* Custom Sleek Role Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[12px] font-medium text-white/70 mb-2 ml-1 uppercase tracking-wider">Sign in as</label>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="glass-input-container cursor-pointer"
              >
                <div className={`glass-input flex items-center justify-between ${isDropdownOpen ? 'border-[#3ECFB2] bg-black/40' : ''}`} style={{ paddingLeft: '44px' }}>
                  <span className={selectedRole ? 'text-white' : 'text-white/40'}>
                    {selectedRole ? selectedRole.title : 'Select your role'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/50 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-[#3ECFB2]' : ''}`} />
                </div>
                {selectedRole ? (
                  <selectedRole.icon className="w-4 h-4 input-icon text-[#3ECFB2]" />
                ) : (
                  <Shield className="w-4 h-4 input-icon" />
                )}
              </div>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#051C15] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar py-2">
                      {roles.map((role) => (
                        <div 
                          key={role.id}
                          onClick={() => {
                            setSelectedRole(role);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/10 ${selectedRole?.id === role.id ? 'bg-[#3ECFB2]/15 text-[#3ECFB2]' : 'text-white/80'}`}
                        >
                          <role.icon className="w-4 h-4" />
                          <span className="text-[13px] font-medium">{role.title}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-[12px] font-medium text-white/70 mb-2 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="glass-input-container">
                <input 
                  type="email" 
                  className="glass-input"
                  placeholder="user@ayurit.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="w-4 h-4 input-icon" />
              </div>
            </div>
            
            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-1 mr-1">
                <label className="block text-[12px] font-medium text-white/70 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[12px] text-[#3ECFB2] hover:text-white font-medium transition-colors">Forgot?</a>
              </div>
              <div className="glass-input-container">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="w-4 h-4 input-icon" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-mint py-4 rounded-xl text-[16px]"
              >
                {loading ? 'Signing In...' : 'Secure Sign In →'}
              </button>
            </div>
            
          </form>

          {/* Mobile Only Sign Up Link */}
          <div className="md:hidden mt-10 text-center border-t border-white/10 pt-6">
            <p className="text-[12px] text-white/50 mb-2">Secure, HIPAA Compliant</p>
            <p className="text-[13px] text-white/80">
              New to AyurIT? 
              <Link to="/signup" className="text-[#3ECFB2] hover:text-white transition-colors font-medium ml-1.5">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;