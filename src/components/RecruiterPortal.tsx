import React, { useState } from 'react';
import { Job, Application, ApplicationStatus, JobType, ExperienceLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import { createJob, updateJob, deleteJob } from '../services/jobService';
import { updateApplicationStatus } from '../services/applicationService';
import {
  Layers,
  PlusCircle,
  Briefcase,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  XCircle,
  DollarSign,
  MapPin,
  Sparkles,
  Edit,
  Trash2,
  MessageSquare,
  FileText,
  Loader2,
  X,
} from 'lucide-react';

interface RecruiterPortalProps {
  jobs: Job[];
  applications: Application[];
  onRefresh: () => void;
}

export const RecruiterPortal: React.FC<RecruiterPortalProps> = ({
  jobs,
  applications,
  onRefresh,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'pipeline'>('jobs');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  // Job Creation Form State
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState(userProfile?.company || 'Brain Station 23');
  const [location, setLocation] = useState('Dhaka, Bangladesh (Hybrid)');
  const [type, setType] = useState<JobType>('Full-time');
  const [department, setDepartment] = useState('Engineering');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid Level');
  const [salaryRange, setSalaryRange] = useState('৳১,২০,০০০ - ৳১,৬০,০০০ / month');
  const [description, setDescription] = useState('');
  const [reqSkillsInput, setReqSkillsInput] = useState('React, TypeScript, Node.js');
  const [prefSkillsInput, setPrefSkillsInput] = useState('Docker, AWS, GraphQL');
  const [submittingJob, setSubmittingJob] = useState(false);

  // Pipeline Status Update Form State
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('under_review');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Filter Pipeline State
  const [pipelineJobFilter, setPipelineJobFilter] = useState<string>('all');
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>('all');

  const filteredPipeline = applications.filter((app) => {
    if (pipelineJobFilter !== 'all' && app.jobId !== pipelineJobFilter) return false;
    if (pipelineStatusFilter !== 'all' && app.status !== pipelineStatusFilter) return false;
    return true;
  });

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !description.trim()) return;

    setSubmittingJob(true);
    try {
      const requiredSkills = reqSkillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const preferredSkills = prefSkillsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await createJob({
        title: jobTitle,
        company,
        location,
        type,
        department,
        experienceLevel,
        salaryRange,
        description,
        requiredSkills,
        preferredSkills,
        status: 'open',
        recruiterId: currentUser?.uid || 'recruiter_system_seed',
        recruiterName: currentUser?.displayName || userProfile?.displayName || 'Talent Acquisition',
        recruiterEmail: currentUser?.email || 'recruiter@jobtracker.com',
        applicantsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setShowCreateModal(false);
      setJobTitle('');
      setDescription('');
      onRefresh();
    } catch (err) {
      console.error('Create job error:', err);
    } finally {
      setSubmittingJob(false);
    }
  };

  const handleToggleJobStatus = async (job: Job) => {
    const updatedStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await updateJob(job.id, { status: updatedStatus });
      onRefresh();
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await deleteJob(jobId);
      onRefresh();
    } catch (err) {
      console.error('Delete job error:', err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      await updateApplicationStatus(
        selectedApp.id,
        newStatus,
        statusNote,
        currentUser?.displayName || 'Recruiter Lead',
        selectedApp.statusHistory || [],
        selectedApp.candidateId,
        selectedApp.jobTitle,
        selectedApp.company
      );
      setSelectedApp(null);
      setStatusNote('');
      onRefresh();
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recruiter Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Recruiter &amp; Talent Portal
            </span>
            <span className="text-xs text-slate-400">• Pipeline Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Talent Acquisition &amp; Role Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Post opportunities, review candidate applications with AI match indices, and update candidate stages with audit notes.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition self-start sm:self-auto flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post a New Job</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900 px-4 rounded-xl text-xs">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Job Postings ({jobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`py-3 px-4 font-semibold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'pipeline'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Candidate Pipeline ({applications.length})</span>
        </button>
      </div>

      {/* Tab 1: Job Postings */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        job.status === 'open'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {job.status === 'open' ? 'Active / Open' : 'Closed'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {job.applicantsCount || 0} applicants
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{job.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>{job.company}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{job.salaryRange}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.requiredSkills.slice(0, 4).map((s, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => handleToggleJobStatus(job)}
                    className="text-slate-300 hover:text-white font-medium"
                  >
                    {job.status === 'open' ? 'Close Posting' : 'Re-open Posting'}
                  </button>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Candidate Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          {/* Pipeline Filters */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Filter Pipeline:</span>

            <select
              value={pipelineJobFilter}
              onChange={(e) => setPipelineJobFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Job Roles</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            <select
              value={pipelineStatusFilter}
              onChange={(e) => setPipelineStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="all">All Stages</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Pipeline Applications Grid */}
          {filteredPipeline.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-white">No Applicants Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No candidate submissions match this filter yet. When candidates apply from the marketplace, their submissions appear here with calculated TF-IDF match scores.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPipeline.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        {app.matchScore}% Match Index
                      </span>
                      <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        Stage: {app.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">
                      {app.candidateName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Applying for: <span className="text-slate-300 font-medium">{app.jobTitle}</span> ({app.company})
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{app.candidateEmail}</p>

                    {/* Candidate Skills pills */}
                    {app.candidateSkills && app.candidateSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {app.candidateSkills.slice(0, 5).map((s, i) => (
                          <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedApp(app);
                        setNewStatus(app.status);
                        setStatusNote(app.notes || '');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Review &amp; Update Stage</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Create New Job Posting</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Company</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Remote or City, State"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Employment Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as JobType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Remote">Remote</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Salary Compensation</label>
                  <input
                    type="text"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="৳১,০০,০০০ - ৳১,৪০,০০০ / month"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Required Skills (comma separated)</label>
                  <input
                    type="text"
                    value={reqSkillsInput}
                    onChange={(e) => setReqSkillsInput(e.target.value)}
                    placeholder="React, TypeScript, Tailwind CSS, REST APIs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Preferred Bonus Skills (comma separated)</label>
                  <input
                    type="text"
                    value={prefSkillsInput}
                    onChange={(e) => setPrefSkillsInput(e.target.value)}
                    placeholder="Docker, CI/CD, GraphQL, Next.js"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Job Description &amp; Responsibilities</label>
                  <textarea
                    rows={4}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide overview of key responsibilities, qualifications, and culture..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow disabled:opacity-50"
                >
                  {submittingJob ? 'Publishing...' : 'Publish Job Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Update Status Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Application Pipeline Action</h3>
                <p className="text-xs text-slate-400">{selectedApp.candidateName} • {selectedApp.jobTitle}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">TF-IDF Fit Score:</span>
                  <span className="font-bold text-indigo-400">{selectedApp.matchScore}% Match</span>
                </div>
                {selectedApp.cvSummary && (
                  <p className="text-slate-400 mt-2 text-[11px] leading-relaxed line-clamp-3">
                    {selectedApp.cvSummary}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Update Pipeline Stage</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="offer">Offer Extended</option>
                  <option value="rejected">Not Selected (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Recruiter Feedback / Progression Note
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Completed initial screening call. Scheduled technical interview for Thursday at 2 PM..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 text-xs">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow disabled:opacity-50 flex items-center gap-1.5"
              >
                {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Stage Progression</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
