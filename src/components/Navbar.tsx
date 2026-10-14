import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Briefcase,
  FileText,
  Clock,
  Layers,
  Shield,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Zap,
  KeyRound,
  X,
  Lock,
  Building,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  onOpenAuth: (mode?: UserRole, tab?: 'signin' | 'signup' | 'forgot') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenProfile,
  onOpenAuth,
}) => {
  const { currentUser, role, setRole, signOutUser } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Staff / Employer Passcode Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffPasscode, setStaffPasscode] = useState('');
  const [staffError, setStaffError] = useState<string | null>(null);

  useEffect(() => {
    const handleOpenStaff = () => setShowStaffModal(true);
    window.addEventListener('open-staff-portal', handleOpenStaff);
    return () => window.removeEventListener('open-staff-portal', handleOpenStaff);
  }, []);

  const handleRoleChange = async (newRole: UserRole) => {
    setRoleMenuOpen(false);
    await setRole(newRole);
    if (newRole === 'recruiter' && activeTab === 'cv-builder') {
      setActiveTab('recruiter');
    } else if (newRole === 'admin') {
      setActiveTab('admin');
    } else if (newRole === 'candidate' && (activeTab === 'recruiter' || activeTab === 'admin')) {
      setActiveTab('marketplace');
    }
  };


  const handleStaffUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    const code = staffPasscode.trim();

    if (code === 'recruiter123' || code === 'bdjobs2026' || code === 'recruiter@bd') {
      await setRole('recruiter');
      setActiveTab('recruiter');
      setShowStaffModal(false);
      setStaffPasscode('');
    } else if (code === 'admin123' || code === 'admin@jobtracker2026' || code === 'jobtracker2026') {
      await setRole('admin');
      setActiveTab('admin');
      setShowStaffModal(false);
      setStaffPasscode('');
    } else {
      setStaffError('Invalid access passcode. Please check organization credentials.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setActiveTab('marketplace')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-lg text-white tracking-tight">
                  <span>JobTracker</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                    BD
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Bangladesh Career &amp; Job Platform
                </p>
              </div>
            </div>

            {/* Navigation Tabs - STRICT ROLE BASED */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'marketplace'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Jobs
              </button>

              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === 'activity'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Activity Feed
              </button>

              {/* Candidate Only Tabs */}
              {(role === 'candidate' || role === 'admin') && (
                <>
                  <button
                    onClick={() => setActiveTab('cv-builder')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === 'cv-builder'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    CV Builder
                  </button>

                  <button
                    onClick={() => setActiveTab('applications')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      activeTab === 'applications'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    My Tracker
                  </button>
                </>
              )}

              {/* Recruiter Tab - HIDDEN FOR CANDIDATES */}
              {(role === 'recruiter' || role === 'admin') && (
                <button
                  onClick={() => setActiveTab('recruiter')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'recruiter'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Recruiter Hub
                </button>
              )}

              {/* Admin Tab - HIDDEN FOR CANDIDATES & RECRUITERS */}
              {role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </button>
              )}
            </nav>

            {/* Right Section: Role Status & Auth */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <>
                  {/* For CANDIDATES: Clean non-switchable badge. NO recruiter or admin option exposed! */}
                  {role === 'candidate' && (
                    <div className="flex items-center gap-1.5 text-xs bg-slate-800/90 text-slate-300 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-400 font-medium">Role:</span>
                      <span className="font-semibold text-emerald-400">Candidate</span>
                    </div>
                  )}

                  {/* For RECRUITERS: Recruiter badge with option to toggle to candidate view */}
                  {role === 'recruiter' && (
                    <div className="relative">
                      <button
                        onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-indigo-500/40 px-3 py-1.5 rounded-lg transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-slate-400">Role:</span>
                        <span className="font-semibold text-indigo-400">Recruiter</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {roleMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-40">
                          <button
                            onClick={() => handleRoleChange('recruiter')}
                            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between bg-indigo-600/20 text-indigo-300 font-semibold"
                          >
                            <span>Recruiter Hub</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          </button>
                          <button
                            onClick={() => handleRoleChange('candidate')}
                            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-slate-300 hover:bg-slate-700"
                          >
                            <span>Switch to Candidate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* For ADMINS: Full administrative control */}
                  {role === 'admin' && (
                    <div className="relative">
                      <button
                        onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-rose-500/40 px-3 py-1.5 rounded-lg transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span className="text-slate-400">Role:</span>
                        <span className="font-semibold text-rose-400">Admin</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>

                      {roleMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-40">
                          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Admin Role View
                          </div>
                          <button
                            onClick={() => handleRoleChange('admin')}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between ${
                              role === 'admin' ? 'bg-indigo-600/20 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <span>Administrator</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          </button>
                          <button
                            onClick={() => handleRoleChange('recruiter')}
                            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-slate-300 hover:bg-slate-700"
                          >
                            <span>Recruiter Hub</span>
                          </button>
                          <button
                            onClick={() => handleRoleChange('candidate')}
                            className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-slate-300 hover:bg-slate-700"
                          >
                            <span>Candidate View</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Auth Buttons or User Menu */}
              {!currentUser ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAuth('candidate', 'signin')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition"
                  >
                    <LogIn className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth('candidate', 'signup')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg shadow-md transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sign Up</span>
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'User'}
                        className="w-8 h-8 rounded-full border border-indigo-400/50 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold border border-indigo-400/50">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-40">
                      <div className="px-4 py-2 border-b border-slate-700/60">
                        <p className="text-xs font-semibold text-white truncate">
                          {currentUser.displayName || 'JobTracker User'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onOpenProfile();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Manage Profile
                      </button>

                      {/* Candidates NEVER see any recruiter or admin options */}
                      <div className="border-t border-slate-700/60 my-1" />

                      <button
                        onClick={async () => {
                          setUserMenuOpen(false);
                          await signOutUser();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Navigation Row - STRICT ROLE BASED */}
          <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                activeTab === 'marketplace' ? 'text-indigo-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Jobs</span>
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                activeTab === 'activity' ? 'text-indigo-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Activity</span>
            </button>

            {/* Candidate Mobile Tabs */}
            {(role === 'candidate' || role === 'admin') && (
              <>
                <button
                  onClick={() => setActiveTab('cv-builder')}
                  className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                    activeTab === 'cv-builder' ? 'text-indigo-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>CV</span>
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                    activeTab === 'applications' ? 'text-indigo-400 font-bold' : 'text-slate-400'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Tracker</span>
                </button>
              </>
            )}

            {/* Recruiter Tab - HIDDEN FOR CANDIDATES */}
            {(role === 'recruiter' || role === 'admin') && (
              <button
                onClick={() => setActiveTab('recruiter')}
                className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                  activeTab === 'recruiter' ? 'text-indigo-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Recruiter</span>
              </button>
            )}

            {/* Admin Tab - HIDDEN FOR CANDIDATES & RECRUITERS */}
            {role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                  activeTab === 'admin' ? 'text-indigo-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Authorized Staff / Recruiter Passcode Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Staff &amp; Employer Portal Access</h3>
              </div>
              <button
                onClick={() => {
                  setShowStaffModal(false);
                  setStaffPasscode('');
                  setStaffError(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStaffUnlock} className="py-4 space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Enter your employer organization key or administrative passcode to unlock recruiter job posting and applicant pipeline tools.
              </p>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Access Passcode
                </label>
                <input
                  type="password"
                  value={staffPasscode}
                  onChange={(e) => setStaffPasscode(e.target.value)}
                  placeholder="Enter recruiter or admin passcode..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  autoFocus
                />
              </div>

              {staffError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300">
                  {staffError}
                </div>
              )}

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">Academic Demo Credentials:</p>
                <p>• Recruiter Passcode: <span className="font-mono text-indigo-400">recruiter123</span></p>
                <p>• Admin Passcode: <span className="font-mono text-rose-400">admin123</span></p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStaffModal(false);
                    setStaffPasscode('');
                    setStaffError(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-md transition"
                >
                  Verify &amp; Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
