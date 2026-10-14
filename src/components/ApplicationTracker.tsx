import React, { useState } from 'react';
import { Application, ApplicationStatus, StatusLog } from '../types';
import { updateApplicationStatus } from '../services/applicationService';
import {
  Clock,
  Building2,
  CheckCircle2,
  Sparkles,
  Calendar,
  AlertCircle,
  ChevronRight,
  XCircle,
  FileText,
  UserCheck,
  Search,
  MessageSquare,
  History,
  X,
  ExternalLink,
} from 'lucide-react';

interface ApplicationTrackerProps {
  applications: Application[];
  loading: boolean;
  onRefresh: () => void;
  onNavigateToJobs: () => void;
}

export const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({
  applications,
  loading,
  onRefresh,
  onNavigateToJobs,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAppForHistory, setSelectedAppForHistory] = useState<Application | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  // Status Metrics
  const stats = {
    total: applications.length,
    underReview: applications.filter(a => a.status === 'under_review').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const filteredApps = applications.filter(app => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return ['submitted', 'under_review', 'interview'].includes(app.status);
    }
    return app.status === statusFilter;
  });

  const handleWithdraw = async (app: Application) => {
    if (!window.confirm(`Are you sure you want to withdraw your application for ${app.jobTitle}?`)) {
      return;
    }
    setWithdrawingId(app.id);
    try {
      await updateApplicationStatus(
        app.id,
        'withdrawn',
        'Candidate withdrew application.',
        app.candidateName,
        app.statusHistory || []
      );
      onRefresh();
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Submitted
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Under Review
          </span>
        );
      case 'interview':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Interview
          </span>
        );
      case 'offer':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Offer Extended
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Not Selected
          </span>
        );
      case 'withdrawn':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Withdrawn
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Audit Pipeline
            </span>
            <span className="text-xs text-slate-400">• Real-Time History Tracking</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Job Application Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor submission status, interview progressions, and recruiter feedback timestamps in your audit timeline.
          </p>
        </div>

        <button
          onClick={onNavigateToJobs}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>Find More Roles</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 font-medium">Total Applied</span>
          <span className="text-2xl font-bold text-white mt-2">{stats.total}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-amber-400 font-medium">Under Review</span>
          <span className="text-2xl font-bold text-amber-300 mt-2">{stats.underReview}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-purple-400 font-medium">Interviews</span>
          <span className="text-2xl font-bold text-purple-300 mt-2">{stats.interview}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-emerald-400 font-medium">Offers</span>
          <span className="text-2xl font-bold text-emerald-300 mt-2">{stats.offer}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-xs text-rose-400 font-medium">Not Selected</span>
          <span className="text-2xl font-bold text-rose-300 mt-2">{stats.rejected}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900 px-4 rounded-xl overflow-x-auto text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
            statusFilter === 'all'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          All Applications ({stats.total})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
            statusFilter === 'active'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Active Pipelines ({stats.underReview + stats.interview})
        </button>
        <button
          onClick={() => setStatusFilter('interview')}
          className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
            statusFilter === 'interview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Interviewing ({stats.interview})
        </button>
        <button
          onClick={() => setStatusFilter('offer')}
          className={`py-3 px-3 font-semibold border-b-2 transition whitespace-nowrap ${
            statusFilter === 'offer'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Offers ({stats.offer})
        </button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-5 rounded-xl bg-slate-900 border border-slate-800 animate-pulse h-28" />
          ))}
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Applications Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't submitted any applications under this category yet. Explore the marketplace and apply with your saved CV!
          </p>
          <button
            onClick={onNavigateToJobs}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            Explore Jobs Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    {getStatusBadge(app.status)}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {app.matchScore}% Match
                    </span>
                    <span className="text-xs text-slate-500">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">
                    {app.jobTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{app.company}</span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedAppForHistory(app)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span>View Audit Timeline</span>
                  </button>

                  {app.status !== 'withdrawn' && app.status !== 'rejected' && (
                    <button
                      onClick={() => handleWithdraw(app)}
                      disabled={withdrawingId === app.id}
                      className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 text-xs font-medium transition"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>

              {/* Recruiter feedback note banner if present */}
              {app.notes && (
                <div className="mt-3.5 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs flex items-start gap-2.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-300">Latest Recruiter Update: </span>
                    <span className="text-slate-400">{app.notes}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History & Timeline Modal */}
      {selectedAppForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 overflow-hidden">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Status Progression Audit Log</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedAppForHistory.jobTitle} • {selectedAppForHistory.company}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppForHistory(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {(!selectedAppForHistory.statusHistory || selectedAppForHistory.statusHistory.length === 0) ? (
                <p className="text-xs text-slate-400">No status events logged yet.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedAppForHistory.statusHistory.map((log: StatusLog, idx: number) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white capitalize">
                            {log.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {log.note || 'Status updated'}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Recorded by: {log.updatedBy || 'System'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAppForHistory(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
