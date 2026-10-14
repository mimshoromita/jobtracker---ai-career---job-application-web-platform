import React, { useState } from 'react';
import { ActivityEvent, ActivityType, CV, UserProfile } from '../types';
import { deleteActivity } from '../services/activityService';
import {
  Sparkles,
  Bookmark,
  CheckCircle2,
  Clock,
  Briefcase,
  Award,
  Trash2,
  ArrowRight,
  Filter,
  Check,
  Building2,
  Zap,
} from 'lucide-react';

interface RecentActivityFeedProps {
  activities: ActivityEvent[];
  candidateCV: CV | null;
  userProfile: UserProfile | null;
  onNavigateToCvBuilder: () => void;
  onNavigateToJobs: () => void;
  onNavigateToTracker: () => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  candidateCV,
  userProfile,
  onNavigateToCvBuilder,
  onNavigateToJobs,
  onNavigateToTracker,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Calculate profile completion milestone
  const milestoneChecks = [
    {
      label: 'Personal & Contact Info',
      completed: !!(candidateCV?.fullName && candidateCV?.email),
      points: 20,
    },
    {
      label: 'Professional Summary',
      completed: !!(candidateCV?.summary && candidateCV?.targetRole),
      points: 20,
    },
    {
      label: 'Core Skills (3+ listed)',
      completed: (candidateCV?.skills || []).length >= 3,
      points: 20,
    },
    {
      label: 'Work Experience Added',
      completed: (candidateCV?.experience || []).length >= 1,
      points: 20,
    },
    {
      label: 'Education History Added',
      completed: (candidateCV?.education || []).length >= 1,
      points: 20,
    },
  ];

  const completionPercent = milestoneChecks.reduce(
    (acc, item) => (item.completed ? acc + item.points : acc),
    0
  );

  const filteredActivities = activities.filter((act) => {
    if (filterType === 'all') return true;
    if (filterType === 'applications') return act.type === 'application_update';
    if (filterType === 'saved') return act.type === 'job_saved' || act.type === 'job_unsaved';
    if (filterType === 'milestones') return act.type === 'profile_milestone' || act.type === 'cv_updated';
    return true;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteActivity(id);
    } catch (err) {
      console.error('Delete activity error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'application_update':
        return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'job_saved':
        return <Bookmark className="w-4 h-4 text-rose-400" />;
      case 'job_unsaved':
        return <Bookmark className="w-4 h-4 text-slate-400" />;
      case 'profile_milestone':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'cv_updated':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getActivityColor = (type: ActivityType) => {
    switch (type) {
      case 'application_update':
        return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300';
      case 'job_saved':
        return 'bg-rose-500/10 border-rose-500/20 text-rose-300';
      case 'job_unsaved':
        return 'bg-slate-800 border-slate-700 text-slate-400';
      case 'profile_milestone':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-300';
      case 'cv_updated':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Profile Completion Milestones */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Profile Strength
              </span>
              <span className="text-xs text-slate-400">• Real-Time Milestone Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Candidate Profile &amp; CV Health: {completionPercent}%
            </h2>
            <p className="text-xs text-slate-400 max-w-xl">
              A comprehensive profile calibrates TF-IDF vector matching against recruiter requirements and ranks your applications higher.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {completionPercent < 100 && (
              <button
                onClick={onNavigateToCvBuilder}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
              >
                <span>Complete Profile to 100%</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              completionPercent === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : completionPercent >= 60
                ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                : 'bg-gradient-to-r from-amber-500 to-indigo-500'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        {/* Milestone Steps Pills */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {milestoneChecks.map((item, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border flex items-center gap-2 ${
                item.completed
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-500'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  item.completed ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.completed ? <Check className="w-2.5 h-2.5" /> : idx + 1}
              </div>
              <span className="truncate text-[11px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                Live Candidate Activity Stream
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Firestore Live Snapshots
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant chronological events of application stage transitions, saved jobs, and profile completions.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Events ({activities.length})
            </button>
            <button
              onClick={() => setFilterType('applications')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'applications'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setFilterType('saved')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'saved'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Saved Jobs
            </button>
            <button
              onClick={() => setFilterType('milestones')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterType === 'milestones'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Milestones
            </button>
          </div>
        </div>

        {/* Activity Items List */}
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-white">No Recent Activity Recorded</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Your real-time activity stream updates automatically when you bookmark a job, edit your CV, or submit an application.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={onNavigateToJobs}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Browse Marketplace
              </button>
              <button
                onClick={onNavigateToCvBuilder}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition"
              >
                Edit CV
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="group p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${getActivityColor(
                      act.type
                    )}`}
                  >
                    {getActivityIcon(act.type)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        {act.title}
                      </h4>
                      {act.metadata?.status && (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-slate-800 text-indigo-300 capitalize">
                          {act.metadata.status.replace('_', ' ')}
                        </span>
                      )}
                      {act.metadata?.milestonePercent !== undefined && (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                          {act.metadata.milestonePercent}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      {act.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span>{new Date(act.timestamp).toLocaleString()}</span>
                      {act.metadata?.company && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {act.metadata.company}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition">
                  {act.type === 'application_update' && (
                    <button
                      onClick={onNavigateToTracker}
                      className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium mr-2"
                    >
                      View Tracker
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(act.id)}
                    disabled={deletingId === act.id}
                    title="Dismiss activity event"
                    className="p-1.5 text-slate-600 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
