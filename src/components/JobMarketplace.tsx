import React, { useState, useMemo } from 'react';
import { Job, CV, Application } from '../types';
import { clientAnalyzeCvJobMatch } from '../lib/tfidf';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Building2,
  MapPin,
  Sparkles,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Bookmark,
} from 'lucide-react';

interface JobMarketplaceProps {
  jobs: Job[];
  candidateCV: CV | null;
  applications: Application[];
  savedJobIds: Set<string>;
  loading: boolean;
  onSelectJob: (job: Job) => void;
  onToggleSaveJob: (job: Job) => void;
  onRefreshJobs: () => void;
  onNavigateToCvBuilder: () => void;
  onNavigateToRecruiter: () => void;
}

export const JobMarketplace: React.FC<JobMarketplaceProps> = ({
  jobs,
  candidateCV,
  applications,
  savedJobIds,
  loading,
  onSelectJob,
  onToggleSaveJob,
  onRefreshJobs,
  onNavigateToCvBuilder,
  onNavigateToRecruiter,
}) => {
  const { role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [onlySaved, setOnlySaved] = useState(false);

  // Pre-calculate candidate match scores for all jobs for quick badge display
  const matchScoresMap = useMemo(() => {
    const scores = new Map<string, number>();
    if (!candidateCV || jobs.length === 0) return scores;

    for (const job of jobs) {
      const analysis = clientAnalyzeCvJobMatch(candidateCV, job);
      scores.set(job.id, analysis.matchScore);
    }
    return scores;
  }, [candidateCV, jobs]);

  // Set of applied job IDs
  const appliedJobIds = useMemo(() => {
    return new Set(applications.map((app) => app.jobId));
  }, [applications]);

  // Distinct departments
  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department).filter(Boolean));
    return Array.from(set);
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Status filter
      if (job.status !== 'open') return false;

      // Saved only filter
      if (onlySaved && !savedJobIds.has(job.id)) {
        return false;
      }

      // Search query (title, company, skills, description)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCompany = job.company.toLowerCase().includes(query);
        const matchesSkills = (job.requiredSkills || []).some((s) =>
          s.toLowerCase().includes(query)
        );
        const matchesDesc = job.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCompany && !matchesSkills && !matchesDesc) {
          return false;
        }
      }

      // Bangladesh Location filter
      if (selectedLocation !== 'all') {
        if (!job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && job.type !== selectedType) {
        return false;
      }

      // Experience Level filter
      if (selectedLevel !== 'all' && job.experienceLevel !== selectedLevel) {
        return false;
      }

      // Department filter
      if (selectedDepartment !== 'all' && job.department !== selectedDepartment) {
        return false;
      }

      return true;
    });
  }, [
    jobs,
    searchQuery,
    selectedLocation,
    selectedType,
    selectedLevel,
    selectedDepartment,
    onlySaved,
    savedJobIds,
  ]);

  return (
    <div className="space-y-6">
      {/* Top Hero / Marketplace Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI-Assisted Career Marketplace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Discover Opportunities with Real-Time Fit Scoring
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Our TF-IDF vector space engine compares your CV competencies, summary, and experience against role specifications to calculate precision match indices and actionable skill-gap insights.
          </p>

          {!candidateCV && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={onNavigateToCvBuilder}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition flex items-center gap-2"
              >
                <span>Build / Import Your CV to See Scores</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company, or skills (e.g., React, TypeScript, Docker)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            onClick={onRefreshJobs}
            title="Refresh jobs"
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center justify-center shrink-0 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Badges Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1 text-slate-400 mr-2 font-medium">
            <Filter className="w-3 h-3 text-slate-500" />
            <span>Filters:</span>
          </div>

          {/* Saved Roles Toggle */}
          <button
            onClick={() => setOnlySaved(!onlySaved)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
              onlySaved
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>Saved Roles ({savedJobIds.size})</span>
          </button>

          {/* Bangladesh Location Dropdown */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Bangladesh Locations</option>
            <option value="Dhaka">Dhaka (Gulshan, Banani, Mohakhali, Uttara, etc.)</option>
            <option value="Chittagong">Chittagong</option>
            <option value="Sylhet">Sylhet</option>
            <option value="Gazipur">Gazipur</option>
            <option value="Remote">Remote (Bangladesh)</option>
          </select>

          {/* Job Type Dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Employment Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Remote">Remote</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>

          {/* Experience Level Dropdown */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Experience Levels</option>
            <option value="Entry Level">Entry Level</option>
            <option value="Mid Level">Mid Level</option>
            <option value="Senior Level">Senior Level</option>
            <option value="Lead">Lead</option>
          </select>

          {/* Department Dropdown */}
          {departments.length > 0 && (
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}

          {(selectedLocation !== 'all' ||
            selectedType !== 'all' ||
            selectedLevel !== 'all' ||
            selectedDepartment !== 'all' ||
            onlySaved ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedLocation('all');
                setSelectedType('all');
                setSelectedLevel('all');
                setSelectedDepartment('all');
                setOnlySaved(false);
                setSearchQuery('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid / List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              <div className="h-12 bg-slate-800 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Matching Jobs Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {role === 'candidate'
              ? 'Try adjusting your search criteria, clearing filters, or exploring other skills.'
              : 'Try adjusting your search criteria, clearing filters, or post a new job as a recruiter.'}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('all');
                setSelectedType('all');
                setSelectedLevel('all');
                setSelectedDepartment('all');
                setOnlySaved(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition"
            >
              Clear All Filters
            </button>
            {(role === 'recruiter' || role === 'admin') && (
              <button
                onClick={onNavigateToRecruiter}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Post a Role
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const matchScore = matchScoresMap.get(job.id);
            const isApplied = appliedJobIds.has(job.id);
            const isSaved = savedJobIds.has(job.id);

            return (
              <div
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="group relative bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges & Bookmark */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {job.department}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {job.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* TF-IDF Fit Badge or Applied status */}
                      {isApplied ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Applied
                        </span>
                      ) : matchScore !== undefined ? (
                        <span
                          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            matchScore >= 75
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : matchScore >= 50
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                          title="TF-IDF Cosine Match with your CV"
                        >
                          <Sparkles className="w-3 h-3" />
                          {matchScore}% Match
                        </span>
                      ) : null}

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveJob(job);
                        }}
                        title={isSaved ? 'Remove from saved' : 'Save job to bookmarks'}
                        className={`p-1.5 rounded-lg border transition ${
                          isSaved
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Company */}
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition tracking-tight">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.company}</span>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{job.location}</span>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {job.requiredSkills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 4 && (
                      <span className="text-[10px] text-slate-500 px-1 py-0.5">
                        +{job.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                    <span className="text-[11px] font-bold px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">৳ BDT</span>
                    <span>{job.salaryRange}</span>
                  </div>

                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition">
                    View Details &amp; Match
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
