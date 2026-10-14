import React, { useState } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  Building2,
  Shield,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  KeyRound,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: UserRole;
  initialTab?: 'signin' | 'signup' | 'forgot';
  onAuthSuccess?: (role: UserRole) => void;
}

const BANGLADESH_COMPANIES = [
  'Brain Station 23',
  'bKash Limited',
  'Pathao',
  'Chaldal',
  'Therap (BD) Ltd.',
  'Optimizely Bangladesh',
  'TigerIT Bangladesh',
  'ShopUp',
  'Nagad',
  'Kaz Software',
  'Cefalo Bangladesh',
  'Walton Hi-Tech',
];

const RECRUITER_PASSCODES = ['recruiter123', 'bdjobs2026', 'recruiter@bd', 'hr2026'];
const ADMIN_PASSCODES = ['admin123', 'jobtracker2026', 'admin@jobtracker2026'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'candidate',
  initialTab = 'signin',
  onAuthSuccess,
}) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemo, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<UserRole>(initialMode);
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>(initialTab);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('+880 ');
  const [specialization, setSpecialization] = useState('Full Stack Development');
  const [securityCode, setSecurityCode] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleModeSwitch = (newMode: UserRole) => {
    setMode(newMode);
    resetFormState();
    if (newMode === 'recruiter' && !company) {
      setCompany('Brain Station 23');
    }
  };

  const handleTabSwitch = (newTab: 'signin' | 'signup' | 'forgot') => {
    setTab(newTab);
    resetFormState();
  };

  // 1. Submit Sign In
  const handleSubmitSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    // Role-specific verification
    if (mode === 'admin') {
      const code = securityCode.trim();
      if (!code) {
        setErrorMessage('Admin Master Security Key is required for Administrator sign-in.');
        return;
      }
      if (!ADMIN_PASSCODES.includes(code)) {
        setErrorMessage('Invalid Admin Security Key. Please verify organizational credentials.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await signInWithEmail(email, password, mode);
      if (res.success) {
        setSuccessMessage(`Successfully signed in as ${mode.toUpperCase()}! Redirecting...`);
        setTimeout(() => {
          onAuthSuccess?.(mode);
          onClose();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sign in error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit Sign Up
  const handleSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Recruiter validation
    if (mode === 'recruiter') {
      if (!company.trim()) {
        setErrorMessage('Please enter your Company / Organization name.');
        return;
      }
      const code = securityCode.trim();
      if (!code) {
        setErrorMessage('Recruiter authorization code is required (e.g. recruiter123 or bdjobs2026).');
        return;
      }
      if (!RECRUITER_PASSCODES.includes(code)) {
        setErrorMessage('Invalid recruiter authorization code. Please enter authorized code (recruiter123 or bdjobs2026).');
        return;
      }
    }

    // Admin validation
    if (mode === 'admin') {
      const code = securityCode.trim();
      if (!code) {
        setErrorMessage('Admin Master Security Key is required (e.g. admin123 or jobtracker2026).');
        return;
      }
      if (!ADMIN_PASSCODES.includes(code)) {
        setErrorMessage('Invalid Admin Security Key.');
        return;
      }
    }

    setLoading(true);
    try {
      const extraData = {
        company: mode === 'recruiter' ? company : undefined,
        phone: phone.trim(),
        headline:
          mode === 'recruiter'
            ? `HR & Talent Acquisition Lead | ${company}`
            : mode === 'admin'
            ? 'System Administrator | JobTracker BD'
            : `${specialization} | Dhaka, Bangladesh`,
      };

      const res = await signUpWithEmail(email, password, fullName, mode, extraData);
      if (res.success) {
        setSuccessMessage(`Account created successfully as ${mode.toUpperCase()}! Setting up workspace...`);
        setTimeout(() => {
          onAuthSuccess?.(mode);
          onClose();
        }, 900);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Sign up error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Quick Google Sign-In with Role
  const handleGoogleAuth = async () => {
    resetFormState();
    setLoading(true);
    try {
      const ok = await signInWithGoogle(mode, {
        company: mode === 'recruiter' ? (company || 'Brain Station 23') : undefined,
      });
      if (ok) {
        setSuccessMessage(`Signed in with Google as ${mode}!`);
        setTimeout(() => {
          onAuthSuccess?.(mode);
          onClose();
        }, 700);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google authentication error');
    } finally {
      setLoading(false);
    }
  };

  // 4. Quick Demo 1-Click Login
  const handleDemoLogin = async () => {
    resetFormState();
    setLoading(true);
    try {
      const ok = await signInAsDemo(mode, {
        company: mode === 'recruiter' ? (company || 'Brain Station 23') : undefined,
      });
      if (ok) {
        setSuccessMessage(`Signed in as Demo ${mode.toUpperCase()}!`);
        setTimeout(() => {
          onAuthSuccess?.(mode);
          onClose();
        }, 600);
      } else {
        setErrorMessage('Demo login failed. Please try standard sign-in.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Demo login error');
    } finally {
      setLoading(false);
    }
  };

  // 5. Send Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendPasswordReset(email);
      if (res.success) {
        setSuccessMessage('Password reset link sent to your email! Please check your inbox.');
      } else {
        setErrorMessage(res.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error sending reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Top Gradient Accent Bar */}
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${
            mode === 'admin'
              ? 'from-rose-500 via-amber-500 to-red-600'
              : mode === 'recruiter'
              ? 'from-emerald-500 via-teal-500 to-cyan-500'
              : 'from-indigo-500 via-blue-500 to-sky-400'
          }`}
        />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-start justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${
                mode === 'admin'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : mode === 'recruiter'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {mode === 'admin' ? (
                <Shield className="w-6 h-6" />
              ) : mode === 'recruiter' ? (
                <Building2 className="w-6 h-6" />
              ) : (
                <User className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">JobTracker Bangladesh</h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    mode === 'admin'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : mode === 'recruiter'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {mode === 'admin' ? 'Admin Portal' : mode === 'recruiter' ? 'Recruiter Hub' : 'Candidate Portal'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'admin'
                  ? 'System Administration & Security Console'
                  : mode === 'recruiter'
                  ? 'Hiring & Talent Acquisition for Bangladesh Companies'
                  : 'Browse Jobs, Build AI CV & Track Applications'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Role Selection Mode Tabs */}
        <div className="px-5 sm:px-6 pt-4">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Your Role Mode (৩টি মোড নির্বাচন করুন)
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleModeSwitch('candidate')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition ${
                mode === 'candidate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <User className="w-4 h-4 mb-1" />
              <span>Candidate</span>
              <span className="text-[10px] opacity-80 font-normal">চাকরি প্রার্থী</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('recruiter')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition ${
                mode === 'recruiter'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Building2 className="w-4 h-4 mb-1" />
              <span>Recruiter</span>
              <span className="text-[10px] opacity-80 font-normal">নিয়োগকারী</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('admin')}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-semibold transition ${
                mode === 'admin'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Shield className="w-4 h-4 mb-1" />
              <span>Admin</span>
              <span className="text-[10px] opacity-80 font-normal">প্রশাসক</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Sign In vs Sign Up vs Forgot */}
        <div className="px-5 sm:px-6 pt-4 flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => handleTabSwitch('signin')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'signin'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In (লগইন)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('signup')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === 'signup'
                  ? 'bg-slate-800 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (নিবন্ধন)</span>
            </button>
          </div>

          {/* Quick Demo Button for effortless testing */}
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 border transition ${
              mode === 'admin'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/40'
                : mode === 'recruiter'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300 hover:bg-indigo-900/40'
            }`}
            title="Click to instantly test this mode without typing"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">1-Click Demo</span>
            <span className="sm:hidden">Demo</span>
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="px-5 sm:px-6 pt-3">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 pt-3">
          {/* TAB 1: SIGN IN */}
          {tab === 'signin' && (
            <form onSubmit={handleSubmitSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {mode === 'recruiter' ? 'Work Email' : mode === 'admin' ? 'Admin Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      mode === 'recruiter'
                        ? 'hr@brainstation-23.com'
                        : mode === 'admin'
                        ? 'mimshoromita@gmail.com'
                        : 'candidate@example.com'
                    }
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('forgot')}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mode-Specific Field for Admin Sign-In */}
              {mode === 'admin' && (
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl">
                  <label className="block text-xs font-medium text-rose-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Admin Master Security PIN</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="Enter admin passcode (e.g. admin123)"
                    className="w-full bg-slate-950 border border-rose-700/60 rounded-lg px-3 py-1.5 text-xs text-rose-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-rose-400/80 mt-1">
                    Required for administrator clearance (Authorized master keys: admin123, jobtracker2026)
                  </p>
                </div>
              )}

              {/* Mode-Specific Helper for Recruiter Sign-In */}
              {mode === 'recruiter' && (
                <p className="text-[11px] text-emerald-400/90 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-800/40 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <span>Logging into the Bangladesh Recruiter Hub for job postings and applicant pipelines.</span>
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 ${
                  mode === 'admin'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : mode === 'recruiter'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Authenticating...'
                    : `Sign In as ${mode === 'admin' ? 'Administrator' : mode === 'recruiter' ? 'Recruiter' : 'Candidate'}`}
                </span>
              </button>

              {/* Divider */}
              <div className="relative my-3 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <span className="relative bg-slate-900 px-3 text-[11px] text-slate-500 uppercase">Or Continue With</span>
              </div>

              {/* Google 1-Click Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google ({mode.toUpperCase()})</span>
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {tab === 'signup' && (
            <form onSubmit={handleSubmitSignUp} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={mode === 'recruiter' ? 'Farhana Yeasmin' : 'Tanvir Ahmed'}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {mode === 'recruiter' ? 'Work Email' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'recruiter' ? 'hr@company.com.bd' : 'user@example.com'}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Mode-Specific Field for Recruiter: Company Name & Passcode */}
              {mode === 'recruiter' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-emerald-300 mb-1">Company / Organization</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-emerald-400" />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Brain Station 23, bKash"
                          className="w-full bg-slate-950 border border-emerald-700/60 rounded-xl pl-9 pr-3 py-2 text-xs text-emerald-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+880 1712-000000"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recruiter Security Code */}
                  <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                    <label className="block text-xs font-medium text-emerald-300 mb-1 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Recruiter Authorization Code</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={securityCode}
                      onChange={(e) => setSecurityCode(e.target.value)}
                      placeholder="Enter organizational passcode (e.g. recruiter123 or bdjobs2026)"
                      className="w-full bg-slate-950 border border-emerald-700/60 rounded-lg px-3 py-1.5 text-xs text-emerald-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <p className="text-[10px] text-emerald-400/80 mt-1">
                      Ensures only verified enterprise employers and HR representatives post jobs and manage candidate pipelines.
                    </p>
                  </div>
                </>
              )}

              {/* Mode-Specific Field for Candidate: Specialization */}
              {mode === 'candidate' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Engineering Discipline</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Full Stack Development">Full Stack Engineering (React, Node.js, Python)</option>
                    <option value="Frontend Engineering">Frontend Development (React, TypeScript, Next.js)</option>
                    <option value="Backend Engineering">Backend Engineering (Node.js, Go, Python, Java)</option>
                    <option value="Mobile App Development">Mobile App Development (Flutter, React Native, iOS, Android)</option>
                    <option value="SQA & Software Testing">Software Quality Assurance (Automation, Selenium, Cypress)</option>
                    <option value="DevOps & Cloud">DevOps & Cloud Architecture (Docker, Kubernetes, AWS)</option>
                    <option value="AI & Machine Learning">AI & Machine Learning Engineering</option>
                  </select>
                </div>
              )}

              {/* Mode-Specific Field for Admin Registration */}
              {mode === 'admin' && (
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl">
                  <label className="block text-xs font-medium text-rose-300 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Admin Master Security Key</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="Enter admin master key (e.g. admin123 or jobtracker2026)"
                    className="w-full bg-slate-950 border border-rose-700/60 rounded-lg px-3 py-1.5 text-xs text-rose-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                  <p className="text-[10px] text-rose-400/80 mt-1">
                    Master administrator authorization required to provision administrative rights.
                  </p>
                </div>
              )}

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-white shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 ${
                  mode === 'admin'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : mode === 'recruiter'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Creating Account...'
                    : `Create ${mode === 'admin' ? 'Admin' : mode === 'recruiter' ? 'Recruiter' : 'Candidate'} Account`}
                </span>
              </button>

              {/* Google 1-Click for Sign Up */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full py-2 px-4 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Sign Up Fast with Google ({mode.toUpperCase()})</span>
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD */}
          {tab === 'forgot' && (
            <form onSubmit={handleResetPassword} className="space-y-4 py-2">
              <p className="text-xs text-slate-400">
                Enter your registered email address and we will send you a secure link to reset your account password.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Registered Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow transition disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Password Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-medium text-slate-300 transition"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info banner */}
        <div className="bg-slate-950 px-5 sm:px-6 py-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {mode === 'candidate' && '✨ Free candidate account with unlimited job applications & AI CV export.'}
            {mode === 'recruiter' && '🏢 Post tech vacancies & evaluate candidates across Bangladesh.'}
            {mode === 'admin' && '🛡️ System supervision, role governance, and real-time telemetry.'}
          </span>
          <button
            onClick={() => handleTabSwitch(tab === 'signin' ? 'signup' : 'signin')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {tab === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};
