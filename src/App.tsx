import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { JobMarketplace } from './components/JobMarketplace';
import { CVBuilder } from './components/CVBuilder';
import { ApplicationTracker } from './components/ApplicationTracker';
import { RecruiterPortal } from './components/RecruiterPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { JobDetailModal } from './components/JobDetailModal';
import { ProfileModal } from './components/ProfileModal';
import { AuthModal } from './components/AuthModal';
import { RecentActivityFeed } from './components/RecentActivityFeed';
import { Job, CV, Application, ActivityEvent, SavedJob, UserRole } from './types';
import { getJobs } from './services/jobService';
import { getUserCV } from './services/cvService';
import {
  getCandidateApplications,
  getRecruiterApplications,
  getAllApplications,
  subscribeToCandidateApplications,
} from './services/applicationService';
import { subscribeToUserActivities } from './services/activityService';
import { subscribeToSavedJobs, toggleSaveJob } from './services/savedJobService';

function MainApp() {
  const { currentUser, userProfile, role } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidateCV, setCandidateCV] = useState<CV | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 3-Mode Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<UserRole>('candidate');
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const handleOpenAuth = (
    mode: UserRole = 'candidate',
    tab: 'signin' | 'signup' | 'forgot' = 'signin'
  ) => {
    setAuthModalMode(mode);
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  useEffect(() => {
    const handleAuthEvent = (e: any) => {
      const targetMode = e.detail?.mode || 'candidate';
      const targetTab = e.detail?.tab || 'signin';
      handleOpenAuth(targetMode, targetTab);
    };
    window.addEventListener('open-auth-modal', handleAuthEvent);
    return () => window.removeEventListener('open-auth-modal', handleAuthEvent);
  }, []);

  // Set of saved job IDs for O(1) lookups
  const savedJobIds = useMemo(() => {
    return new Set(savedJobs.map((s) => s.jobId));
  }, [savedJobs]);

  // Fetch Jobs
  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch CV for authenticated user
  const loadCV = async () => {
    if (!currentUser) {
      setCandidateCV(null);
      return;
    }
    try {
      const cvData = await getUserCV(currentUser.uid);
      setCandidateCV(cvData);
    } catch (err) {
      console.error('Error loading CV:', err);
    }
  };

  // Fetch Applications (fallback and non-candidate roles)
  const loadApplications = async () => {
    if (!currentUser) {
      setApplications([]);
      return;
    }
    setLoadingApps(true);
    try {
      let data: Application[] = [];
      if (role === 'admin') {
        data = await getAllApplications();
      } else if (role === 'recruiter') {
        data = await getRecruiterApplications(currentUser.uid);
      } else {
        data = await getCandidateApplications(currentUser.uid);
      }
      setApplications(data);
    } catch (err) {
      console.error('Error loading applications:', err);
    } finally {
      setLoadingApps(false);
    }
  };

  // Initial jobs load
  useEffect(() => {
    loadJobs();
  }, []);

  // CV load on user change
  useEffect(() => {
    loadCV();
  }, [currentUser]);

  // Real-time Firestore snapshot listeners for Activity, Saved Jobs, and Applications
  useEffect(() => {
    if (!currentUser) {
      setActivities([]);
      setSavedJobs([]);
      setApplications([]);
      return;
    }

    // 1. Live Activity Feed Snapshot Listener
    const unsubscribeActivities = subscribeToUserActivities(
      currentUser.uid,
      (acts) => {
        setActivities(acts);
      }
    );

    // 2. Live Saved Jobs Snapshot Listener
    const unsubscribeSavedJobs = subscribeToSavedJobs(
      currentUser.uid,
      (sJobs) => {
        setSavedJobs(sJobs);
      }
    );

    // 3. For candidates: Live Application Updates Snapshot Listener
    let unsubscribeApps = () => {};
    if (role === 'candidate') {
      unsubscribeApps = subscribeToCandidateApplications(
        currentUser.uid,
        (liveApps) => {
          setApplications(liveApps);
        }
      );
    } else {
      loadApplications();
    }

    return () => {
      unsubscribeActivities();
      unsubscribeSavedJobs();
      unsubscribeApps();
    };
  }, [currentUser, role]);

  // Strict role guard: Candidates can NEVER view Recruiter or Admin panels
  useEffect(() => {
    if (role === 'candidate') {
      if (activeTab === 'recruiter' || activeTab === 'admin') {
        setActiveTab('marketplace');
      }
    } else if (role === 'recruiter') {
      if (activeTab === 'admin') {
        setActiveTab('recruiter');
      }
    }
  }, [role, activeTab]);

  const handleToggleSaveJob = async (job: Job) => {
    if (!currentUser) {
      handleOpenAuth('candidate', 'signin');
      return;
    }
    const isCurrentlySaved = savedJobIds.has(job.id);
    await toggleSaveJob(
      currentUser.uid,
      { id: job.id, title: job.title, company: job.company },
      isCurrentlySaved
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'marketplace' && (
          <JobMarketplace
            jobs={jobs}
            candidateCV={candidateCV}
            applications={applications}
            savedJobIds={savedJobIds}
            loading={loadingJobs}
            onSelectJob={(job) => setSelectedJob(job)}
            onToggleSaveJob={handleToggleSaveJob}
            onRefreshJobs={loadJobs}
            onNavigateToCvBuilder={() => setActiveTab('cv-builder')}
            onNavigateToRecruiter={() => setActiveTab('recruiter')}
          />
        )}

        {activeTab === 'activity' && (
          <RecentActivityFeed
            activities={activities}
            candidateCV={candidateCV}
            userProfile={userProfile}
            onNavigateToCvBuilder={() => setActiveTab('cv-builder')}
            onNavigateToJobs={() => setActiveTab('marketplace')}
            onNavigateToTracker={() => setActiveTab('applications')}
          />
        )}

        {activeTab === 'cv-builder' && (
          <CVBuilder
            cv={candidateCV}
            onCVSaved={(saved) => {
              setCandidateCV(saved);
              loadJobs(); // refresh match scores
            }}
          />
        )}

        {activeTab === 'applications' && (
          <ApplicationTracker
            applications={applications}
            loading={loadingApps}
            onRefresh={loadApplications}
            onNavigateToJobs={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'recruiter' && (role === 'recruiter' || role === 'admin') && (
          <RecruiterPortal
            jobs={jobs}
            applications={applications}
            onRefresh={() => {
              loadJobs();
              loadApplications();
            }}
          />
        )}

        {activeTab === 'admin' && role === 'admin' && (
          <AdminDashboard
            jobs={jobs}
            applications={applications}
            onRefresh={() => {
              loadJobs();
              loadApplications();
            }}
          />
        )}
      </main>

      {/* Job Details & AI Match Modal */}
      <JobDetailModal
        job={selectedJob}
        candidateCV={candidateCV}
        hasApplied={
          selectedJob
            ? applications.some((app) => app.jobId === selectedJob.id)
            : false
        }
        isSaved={selectedJob ? savedJobIds.has(selectedJob.id) : false}
        onToggleSave={() => selectedJob && handleToggleSaveJob(selectedJob)}
        onClose={() => setSelectedJob(null)}
        onApplicationSubmitted={() => {
          loadApplications();
          loadJobs();
        }}
        onNavigateToCvBuilder={() => setActiveTab('cv-builder')}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* 3-Mode Unified Authentication Modal (Candidate / Recruiter / Admin) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        initialTab={authModalTab}
        onAuthSuccess={(newRole) => {
          if (newRole === 'recruiter') {
            setActiveTab('recruiter');
          } else if (newRole === 'admin') {
            setActiveTab('admin');
          } else {
            if (activeTab === 'recruiter' || activeTab === 'admin') {
              setActiveTab('marketplace');
            }
          }
          loadJobs();
          loadApplications();
        }}
      />

      {/* Academic Platform Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-8 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              JT
            </div>
            <span className="font-semibold text-slate-400">
              JobTracker — Bangladesh Career &amp; Recruitment Platform
            </span>
            <span>• Full-Stack Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <span>Real-Time Firestore</span>
            <span>•</span>
            <span>TF-IDF Skill Match Engine</span>
            <span>•</span>
            <span>PDF CV Export</span>

            {/* If unauthenticated, show 3 modes clearly */}
            {!currentUser && (
              <>
                <span>•</span>
                <button
                  onClick={() => handleOpenAuth('candidate', 'signin')}
                  className="hover:text-indigo-400 text-slate-400 transition underline cursor-pointer"
                >
                  Candidate Sign In
                </button>
                <span>•</span>
                <button
                  onClick={() => handleOpenAuth('recruiter', 'signin')}
                  className="hover:text-emerald-400 text-slate-400 transition underline cursor-pointer"
                >
                  Recruiter Hub
                </button>
                <span>•</span>
                <button
                  onClick={() => handleOpenAuth('admin', 'signin')}
                  className="hover:text-rose-400 text-slate-400 transition underline cursor-pointer"
                >
                  Admin Portal
                </button>
              </>
            )}

            {/* If logged in as Recruiter or Admin, show staff portal */}
            {currentUser && (role === 'recruiter' || role === 'admin') && (
              <>
                <span>•</span>
                <button
                  onClick={() => setActiveTab(role === 'admin' ? 'admin' : 'recruiter')}
                  className="hover:text-indigo-400 text-indigo-400 transition underline cursor-pointer font-medium"
                >
                  {role === 'admin' ? 'Admin Dashboard' : 'Recruiter Hub'}
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
