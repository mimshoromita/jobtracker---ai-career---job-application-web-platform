import React, { useState, useEffect } from 'react';
import { Job, CV, MatchAnalysisResult } from '../types';
import { useAuth } from '../context/AuthContext';
import { getCvJobMatchAnalysis } from '../services/api';
import { submitApplication } from '../services/applicationService';
import {
  X,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Send,
  Loader2,
  FileText,
  Bookmark,
  Lock,
} from 'lucide-react';

interface JobDetailModalProps {
  job: Job | null;
  candidateCV: CV | null;
  hasApplied: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onClose: () => void;
  onApplicationSubmitted: () => void;
  onNavigateToCvBuilder: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  candidateCV,
  hasApplied,
  isSaved = false,
  onToggleSave,
  onClose,
  onApplicationSubmitted,
  onNavigateToCvBuilder,
}) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'ai-match'>('details');
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;
    setSubmitSuccess(hasApplied);
    setErrorMsg(null);

    // Compute TF-IDF match analysis if candidate has a CV
    if (candidateCV) {
      setLoadingMatch(true);
      getCvJobMatchAnalysis(candidateCV, job)
        .then((res) => {
          setMatchAnalysis(res);
        })
        .catch((err) => {
          console.warn('Match calculation err:', err);
        })
        .finally(() => {
          setLoadingMatch(false);
        });
    } else {
      setMatchAnalysis(null);
    }
  }, [job, candidateCV, hasApplied]);

  if (!job) return null;

  const handleApply = async () => {
    if (!currentUser) {
      setErrorMsg('Authentication Required: Please sign in or create an account to submit an application.');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'candidate', tab: 'signin' } }));
      return;
    }

    if (!candidateCV) {
      setErrorMsg('Please build and save your CV first to apply with 1-click matching.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        candidateId: currentUser.uid,
        candidateName: currentUser.displayName || candidateCV.fullName || 'Candidate',
        candidateEmail: currentUser.email || candidateCV.email || '',
        recruiterId: job.recruiterId,
        cvId: candidateCV.id,
        cvSummary: candidateCV.summary || '',
        candidateSkills: candidateCV.skills || [],
        matchScore: matchAnalysis?.matchScore || 75,
        status: 'submitted',
        statusHistory: [],
      });

      setSubmitSuccess(true);
      onApplicationSubmitted();
    } catch (err: any) {
      console.error('Failed to submit application:', err);
      setErrorMsg(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/80 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {job.department}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {job.type}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {job.experienceLevel}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                {job.company}
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {job.location}
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="font-bold text-emerald-400 text-sm">৳</span>
                <span>{job.salaryRange}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleSave && (
              <button
                onClick={onToggleSave}
                title={isSaved ? 'Remove from saved' : 'Save job to bookmarks'}
                className={`p-2 rounded-lg border transition ${
                  isSaved
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-rose-400' : ''}`} />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Job Description &amp; Requirements
          </button>
          <button
            onClick={() => setActiveTab('ai-match')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'ai-match'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI &amp; TF-IDF Skill-Gap Analysis
            {matchAnalysis && (
              <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                {matchAnalysis.matchScore}%
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-300">
          {activeTab === 'details' ? (
            <>
              {/* Job Overview */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Role Description
                </h3>
                <p className="text-slate-300 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
                  {job.description}
                </p>
              </div>

              {/* Required Skills */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  Required Skills &amp; Competencies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-indigo-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Skills */}
              {job.preferredSkills && job.preferredSkills.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Preferred / Bonus Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recruiter Details */}
              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Posted by recruiter: </span>
                  <span className="font-semibold text-white">{job.recruiterName || 'Talent Lead'}</span>
                </div>
                <div className="text-slate-500">
                  {job.applicantsCount || 0} active applicants
                </div>
              </div>
            </>
          ) : (
            /* AI & TF-IDF Match Analysis Tab */
            <div className="space-y-6">
              {!candidateCV ? (
                <div className="p-6 rounded-2xl bg-slate-800/40 border border-dashed border-slate-700 text-center">
                  <FileText className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <h4 className="font-semibold text-white text-base">No CV Found for Analysis</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                    Build and save your CV in the CV Builder tab to unlock real-time mathematical TF-IDF vector matching and automated skill-gap analysis.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToCvBuilder();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition"
                  >
                    Open CV Builder Now
                  </button>
                </div>
              ) : loadingMatch ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                  <p className="text-xs font-semibold text-slate-300">
                    Computing TF-IDF matrices &amp; Cosine Similarity...
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Analyzing lexical terms, experience text, and technical competencies
                  </p>
                </div>
              ) : matchAnalysis ? (
                <>
                  {/* Score Summary Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/50 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-extrabold text-indigo-400">
                        {matchAnalysis.matchScore}%
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-1">
                        Overall Match Score
                      </span>
                      <span className="text-[10px] text-slate-500">Weighted Academic Index</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold text-white">
                        {Math.round(matchAnalysis.cosineSimilarity * 100)}%
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-1">
                        Cosine Similarity
                      </span>
                      <span className="text-[10px] text-slate-500">TF-IDF Vector Space</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold text-emerald-400">
                        {matchAnalysis.skillCoverage}%
                      </span>
                      <span className="text-xs font-medium text-slate-300 mt-1">
                        Required Skill Coverage
                      </span>
                      <span className="text-[10px] text-slate-500">Explicit competency overlap</span>
                    </div>
                  </div>

                  {/* Skills Breakdown Grid */}
                  <div className="space-y-4">
                    {/* Matched Skills */}
                    <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                          Matched Skills ({matchAnalysis.matchedSkills.length})
                        </h4>
                      </div>
                      {matchAnalysis.matchedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {matchAnalysis.matchedSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No direct keyword overlap found.</p>
                      )}
                    </div>

                    {/* Missing Required Skills */}
                    {matchAnalysis.missingRequiredSkills.length > 0 && (
                      <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                            Missing Required Skills ({matchAnalysis.missingRequiredSkills.length})
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {matchAnalysis.missingRequiredSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Preferred Skills */}
                    {matchAnalysis.missingPreferredSkills.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            Missing Bonus Skills ({matchAnalysis.missingPreferredSkills.length})
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {matchAnalysis.missingPreferredSkills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendations */}
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                        Personalized Career &amp; Skill Recommendations
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {matchAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          {errorMsg && (
            <div className="text-xs text-rose-400 flex items-center gap-1.5 w-full sm:w-auto">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-3 ml-auto w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Close
            </button>

            {submitSuccess ? (
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Application Submitted!</span>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>Sign In to Apply</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply with Saved CV</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
