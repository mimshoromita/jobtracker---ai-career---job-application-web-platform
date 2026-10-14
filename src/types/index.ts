export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  headline?: string;
  bio?: string;
  phone?: string;
  location?: string;
  skills?: string[];
  company?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type JobType = 'Full-time' | 'Part-time' | 'Remote' | 'Contract' | 'Internship';
export type ExperienceLevel = 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Lead' | 'Executive';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: JobType;
  department: string;
  experienceLevel: ExperienceLevel;
  salaryRange: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  status: 'open' | 'closed';
  recruiterId: string;
  recruiterName: string;
  recruiterEmail: string;
  applicantsCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export interface StatusLog {
  status: ApplicationStatus;
  timestamp: string;
  note?: string;
  updatedBy: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  recruiterId: string;
  cvId?: string;
  cvSummary?: string;
  candidateSkills: string[];
  matchScore: number;
  status: ApplicationStatus;
  notes?: string;
  statusHistory: StatusLog[];
  createdAt: string;
  updatedAt: string;
}

export interface CVExperience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface CVEducation {
  id: string;
  degree: string;
  fieldOfStudy: string;
  institution: string;
  graduationYear: string;
}

export interface CVProject {
  id: string;
  title: string;
  description: string;
  technologies: string;
  link?: string;
}

export interface CVCertification {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface CV {
  id: string;
  userId: string;
  title: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  summary: string;
  skills: string[];
  experience: CVExperience[];
  education: CVEducation[];
  projects: CVProject[];
  certifications: CVCertification[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchAnalysisResult {
  matchScore: number;
  cosineSimilarity: number;
  skillCoverage: number;
  matchedSkills: string[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  recommendations: string[];
  summary: string;
}

export type ActivityType =
  | 'application_update'
  | 'job_saved'
  | 'job_unsaved'
  | 'profile_milestone'
  | 'cv_updated';

export interface ActivityEvent {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    jobId?: string;
    jobTitle?: string;
    company?: string;
    status?: ApplicationStatus;
    milestonePercent?: number;
    skillsCount?: number;
  };
}

export interface SavedJob {
  id: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  createdAt: string;
}
