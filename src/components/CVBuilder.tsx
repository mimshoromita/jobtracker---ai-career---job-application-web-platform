import React, { useState, useEffect } from 'react';
import { CV, CVExperience, CVEducation, CVProject, CVCertification } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveUserCV } from '../services/cvService';
import { exportCVToPDF } from '../lib/pdfExport';
import { logActivity } from '../services/activityService';
import {
  FileText,
  Save,
  Download,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Loader2,
  FolderGit2,
  Lock,
} from 'lucide-react';

interface CVBuilderProps {
  cv: CV | null;
  onCVSaved: (savedCV: CV) => void;
}

const DEFAULT_SAMPLE_CV: Omit<CV, 'id'> = {
  userId: '',
  title: 'Full Stack Software Engineer CV',
  fullName: 'Tanvir Ahmed',
  email: 'tanvir.ahmed@example.com',
  phone: '+880 1712-345678',
  location: 'Dhanmondi, Dhaka, Bangladesh',
  targetRole: 'Full Stack Software Engineer',
  summary:
    'Dedicated Full Stack Software Engineer with 4+ years of professional experience building scalable web applications and distributed cloud services for leading Bangladeshi fintech and tech platforms. Proficient in TypeScript, React, Node.js, Next.js, and modern AI tool integrations. Proven track record of improving system latency by 35% and mentoring junior CSE graduates.',
  skills: [
    'React',
    'TypeScript',
    'Node.js',
    'Express',
    'Tailwind CSS',
    'Firebase',
    'MongoDB / Firestore',
    'Docker',
    'Git',
    'REST APIs',
    'TF-IDF',
    'GraphQL',
    'CI/CD Pipelines',
    'PostgreSQL',
  ],
  experience: [
    {
      id: 'exp-1',
      title: 'Senior Software Developer',
      company: 'Brain Station 23',
      startDate: '2023-01',
      endDate: 'Present',
      current: true,
      description:
        'Architected modern single-page applications using React 19 and TypeScript for enterprise fintech clients in Bangladesh and Europe. Implemented automated CI/CD deployment pipelines on Docker containers, reducing deployment cycle times by 40%.',
    },
    {
      id: 'exp-2',
      title: 'Full Stack Engineer',
      company: 'Pathao',
      startDate: '2021-06',
      endDate: '2022-12',
      current: false,
      description:
        'Designed high-throughput REST APIs using Express, Node.js, and Redis for food and parcel logistics. Collaborated across multidisciplinary product teams to deliver merchant analytics dashboards serving 100k+ active users across Dhaka.',
    },
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Bachelor of Science (B.Sc.)',
      fieldOfStudy: 'Computer Science & Engineering (CSE)',
      institution: 'Bangladesh University of Engineering and Technology (BUET)',
      graduationYear: '2021',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'AI Resume & Job Match Engine (Bangladesh Tech Hub)',
      description:
        'Developed an end-to-end vector matching pipeline utilizing TF-IDF cosine similarity and skill gap analytics tailored for the Bangladeshi software engineering job market.',
      technologies: 'TypeScript, React, Node.js, Cloud Firestore',
      link: 'https://github.com/example/resume-match-bd',
    },
  ],
  certifications: [
    {
      id: 'cert-1',
      name: 'AWS Certified Solutions Architect - Associate',
      issuer: 'Amazon Web Services',
      year: '2023',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const SUGGESTED_SKILLS = [
  'React',
  'TypeScript',
  'JavaScript',
  'Node.js',
  'Express',
  'Python',
  'Docker',
  'Kubernetes',
  'AWS',
  'Tailwind CSS',
  'Next.js',
  'Firebase',
  'Firestore',
  'Git',
  'CI/CD',
  'GraphQL',
  'SQL',
  'REST APIs',
  'Machine Learning',
  'TF-IDF',
];

export const CVBuilder: React.FC<CVBuilderProps> = ({ cv, onCVSaved }) => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [formData, setFormData] = useState<Omit<CV, 'id'>>(() => {
    if (cv) {
      const { id, ...rest } = cv;
      return rest;
    }
    return {
      ...DEFAULT_SAMPLE_CV,
      userId: currentUser?.uid || '',
      fullName: currentUser?.displayName || DEFAULT_SAMPLE_CV.fullName,
      email: currentUser?.email || DEFAULT_SAMPLE_CV.email,
    };
  });

  const [activeSection, setActiveSection] = useState<'info' | 'experience' | 'education' | 'skills' | 'projects'>('info');
  const [newSkillInput, setNewSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (cv) {
      const { id, ...rest } = cv;
      setFormData(rest);
    } else if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        userId: currentUser.uid,
        fullName: prev.fullName || currentUser.displayName || '',
        email: prev.email || currentUser.email || '',
      }));
    }
  }, [cv, currentUser]);

  const handleSave = async () => {
    if (!currentUser) {
      setSaveMessage('Authentication Required: Please sign in or create an account to save your CV.');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'candidate', tab: 'signin' } }));
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const payload: Omit<CV, 'id'> = {
        ...formData,
        userId: currentUser.uid,
        updatedAt: new Date().toISOString(),
      };

      const docId = await saveUserCV(payload, cv?.id);
      const saved: CV = { id: docId, ...payload };
      onCVSaved(saved);

      // Calculate Profile Completion Milestone
      let score = 0;
      if (formData.fullName && formData.email) score += 20;
      if (formData.targetRole && formData.summary) score += 20;
      if (formData.skills.length >= 3) score += 20;
      if (formData.experience.length >= 1) score += 20;
      if (formData.education.length >= 1) score += 20;

      try {
        await logActivity({
          userId: currentUser.uid,
          type: score >= 90 ? 'profile_milestone' : 'cv_updated',
          title: score >= 90 ? 'Milestone: 100% Profile Complete! 🎉' : `Profile Milestone: ${score}% Complete`,
          description: `CV updated with ${formData.skills.length} technical competencies and ${formData.experience.length} work positions.`,
          timestamp: new Date().toISOString(),
          metadata: {
            milestonePercent: score,
            skillsCount: formData.skills.length,
          },
        });
      } catch (logErr) {
        console.warn('Could not log milestone activity:', logErr);
      }

      setSaveMessage('CV saved securely to Cloud Firestore!');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error('Save CV error:', err);
      setSaveMessage(`Error saving CV: ${err?.message || 'Check connection'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    if (!currentUser) {
      setSaveMessage('Authentication Required: Please sign in or create an account to download your CV as a PDF.');
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'candidate', tab: 'signin' } }));
      return;
    }
    const fullCV: CV = {
      id: cv?.id || 'temp_cv',
      ...formData,
    };
    exportCVToPDF(fullCV);
  };

  const handleLoadSample = () => {
    setFormData({
      ...DEFAULT_SAMPLE_CV,
      userId: currentUser?.uid || '',
      fullName: currentUser?.displayName || DEFAULT_SAMPLE_CV.fullName,
      email: currentUser?.email || DEFAULT_SAMPLE_CV.email,
    });
    setSaveMessage('Loaded starter academic tech CV template!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || formData.skills.includes(trimmed)) return;
    setFormData({
      ...formData,
      skills: [...formData.skills, trimmed],
    });
    setNewSkillInput('');
  };

  const removeSkill = (index: number) => {
    const updated = [...formData.skills];
    updated.splice(index, 1);
    setFormData({ ...formData, skills: updated });
  };

  // Experience handlers
  const addExperience = () => {
    const newExp: CVExperience = {
      id: `exp-${Date.now()}`,
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    };
    setFormData({
      ...formData,
      experience: [newExp, ...formData.experience],
    });
  };

  const updateExperience = (index: number, updates: Partial<CVExperience>) => {
    const updated = [...formData.experience];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, experience: updated });
  };

  const removeExperience = (index: number) => {
    const updated = [...formData.experience];
    updated.splice(index, 1);
    setFormData({ ...formData, experience: updated });
  };

  // Education handlers
  const addEducation = () => {
    const newEdu: CVEducation = {
      id: `edu-${Date.now()}`,
      degree: 'Bachelor of Science',
      fieldOfStudy: '',
      institution: '',
      graduationYear: '',
    };
    setFormData({
      ...formData,
      education: [...formData.education, newEdu],
    });
  };

  const updateEducation = (index: number, updates: Partial<CVEducation>) => {
    const updated = [...formData.education];
    updated[index] = { ...updated[index], ...updates };
    setFormData({ ...formData, education: updated });
  };

  const removeEducation = (index: number) => {
    const updated = [...formData.education];
    updated.splice(index, 1);
    setFormData({ ...formData, education: updated });
  };

  return (
    <div className="space-y-6">
      {/* CV Builder Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Interactive Resume Engine
            </span>
            <span className="text-xs text-slate-400">• PDF Ready</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            CV Builder &amp; Competency Portfolio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Design your professional profile, calibrate your skill tags for TF-IDF matching, and export clean PDF resumes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleLoadSample}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
            title="Load realistic developer template"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Template</span>
          </button>

          <button
            onClick={handleExportPDF}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${
              !currentUser
                ? 'bg-amber-950/30 text-amber-300 border-amber-800/60 hover:bg-amber-900/40'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
            title={!currentUser ? 'Login required to download PDF' : 'Download CV as PDF'}
          >
            {!currentUser ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{currentUser ? 'Export PDF' : 'Export PDF (Login Required)'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save to Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-center gap-2 text-xs text-indigo-300 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Editor & Preview Toggle for Mobile / Tablets */}
      <div className="flex sm:hidden border-b border-slate-800 bg-slate-900 p-1 rounded-xl">
        <button
          onClick={() => setPreviewTab('edit')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg ${
            previewTab === 'edit' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Editor Form
        </button>
        <button
          onClick={() => setPreviewTab('preview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg ${
            previewTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          Live Preview
        </button>
      </div>

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className={`lg:col-span-7 space-y-5 ${previewTab === 'preview' ? 'hidden sm:block' : ''}`}>
          {/* Section Navigation Tabs */}
          <div className="flex overflow-x-auto gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs scrollbar-none">
            <button
              onClick={() => setActiveSection('info')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium shrink-0 transition ${
                activeSection === 'info' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Personal Info
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium shrink-0 transition ${
                activeSection === 'skills' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Skills ({formData.skills.length})
            </button>
            <button
              onClick={() => setActiveSection('experience')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium shrink-0 transition ${
                activeSection === 'experience' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Experience ({formData.experience.length})
            </button>
            <button
              onClick={() => setActiveSection('education')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium shrink-0 transition ${
                activeSection === 'education' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Education ({formData.education.length})
            </button>
            <button
              onClick={() => setActiveSection('projects')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium shrink-0 transition ${
                activeSection === 'projects' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              Projects
            </button>
          </div>

          {/* Section: Personal Info */}
          {activeSection === 'info' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                Personal &amp; Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Tanvir Ahmed"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Target Role Headline</label>
                  <input
                    type="text"
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Full Stack Software Engineer | React & Node.js"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="tanvir@example.com"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="+880 1712-345678"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Dhanmondi, Dhaka, Bangladesh"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500 leading-relaxed text-xs"
                    placeholder="Executive career synopsis highlighting domain expertise, accomplishments, and tech stack..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Skills */}
          {activeSection === 'skills' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  Skills &amp; Competencies
                </h3>
                <span className="text-[11px] text-slate-500">
                  Used directly in TF-IDF cosine matching
                </span>
              </div>

              {/* Add custom skill input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(newSkillInput);
                    }
                  }}
                  placeholder="Type a skill and press Enter (e.g., GraphQL, Docker, Python)..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => addSkill(newSkillInput)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              {/* Active Skill Tags */}
              <div className="flex flex-wrap gap-2 pt-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-indigo-400 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick suggestions */}
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Quick Click Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.filter((s) => !formData.skills.includes(s)).slice(0, 12).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700/60"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section: Experience */}
          {activeSection === 'experience' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Work Experience ({formData.experience.length})
                </h3>
                <button
                  type="button"
                  onClick={addExperience}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Position
                </button>
              </div>

              <div className="space-y-4">
                {formData.experience.map((exp, index) => (
                  <div
                    key={exp.id || index}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">Position #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Job Title</label>
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => updateExperience(index, { title: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Lead Frontend Engineer"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, { company: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Brain Station 23 / Pathao / bKash"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, { startDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="YYYY-MM"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">End Date</label>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? 'Present' : exp.endDate}
                          onChange={(e) => updateExperience(index, { endDate: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white disabled:opacity-50 focus:outline-none focus:border-indigo-500"
                          placeholder="YYYY-MM or Present"
                        />
                        <label className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(index, { current: e.target.checked })}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          Currently working here
                        </label>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1">Responsibilities &amp; Achievements</label>
                        <textarea
                          rows={3}
                          value={exp.description}
                          onChange={(e) => updateExperience(index, { description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                          placeholder="Key achievements, technologies utilized, measurable project impacts..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Education */}
          {activeSection === 'education' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-400" />
                  Education History
                </h3>
                <button
                  type="button"
                  onClick={addEducation}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Degree
                </button>
              </div>

              <div className="space-y-4">
                {formData.education.map((edu, index) => (
                  <div
                    key={edu.id || index}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">Education #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Degree</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, { degree: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Bachelor of Science"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Field of Study</label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(index, { fieldOfStudy: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. Computer Science"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, { institution: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. BUET / University of Dhaka / BRAC / NSU"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Graduation Year</label>
                        <input
                          type="text"
                          value={edu.graduationYear}
                          onChange={(e) => updateEducation(index, { graduationYear: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                          placeholder="e.g. 2022"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Projects */}
          {activeSection === 'projects' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-indigo-400" />
                  Key Projects &amp; Accomplishments
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const newProj: CVProject = {
                      id: `proj-${Date.now()}`,
                      title: 'New Web Project',
                      description: 'Project architecture and impact...',
                      technologies: 'React, Node.js',
                    };
                    setFormData({ ...formData, projects: [...formData.projects, newProj] });
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Project
                </button>
              </div>

              <div className="space-y-4">
                {formData.projects.map((proj, idx) => (
                  <div key={proj.id || idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400">Project #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.projects];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, projects: updated });
                        }}
                        className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Project Title</label>
                        <input
                          type="text"
                          value={proj.title}
                          onChange={(e) => {
                            const updated = [...formData.projects];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, projects: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Technologies Used</label>
                        <input
                          type="text"
                          value={proj.technologies}
                          onChange={(e) => {
                            const updated = [...formData.projects];
                            updated[idx].technologies = e.target.value;
                            setFormData({ ...formData, projects: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1">Description</label>
                        <textarea
                          rows={2}
                          value={proj.description}
                          onChange={(e) => {
                            const updated = [...formData.projects];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, projects: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Column */}
        <div className={`lg:col-span-5 ${previewTab === 'edit' ? 'hidden sm:block' : ''}`}>
          <div className="sticky top-20 bg-white text-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            {/* Resume Preview Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 border-b-4 border-indigo-600">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {formData.fullName || 'Candidate Name'}
              </h2>
              <p className="text-xs text-indigo-300 font-medium mt-0.5">
                {formData.targetRole || 'Professional'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-300">
                {formData.email && <span>{formData.email}</span>}
                {formData.phone && <span>• {formData.phone}</span>}
                {formData.location && <span>• {formData.location}</span>}
              </div>
            </div>

            {/* Resume Preview Content */}
            <div className="p-5 sm:p-6 space-y-5 text-xs text-slate-700 max-h-[650px] overflow-y-auto">
              {/* Summary */}
              {formData.summary && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Professional Summary
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-[11.5px]">
                    {formData.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              {formData.skills.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Core Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-medium border border-slate-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {formData.experience.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Experience
                  </h4>
                  <div className="space-y-3">
                    {formData.experience.map((exp, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-start font-semibold text-slate-900 text-[11.5px]">
                          <span>{exp.title || 'Role'} - {exp.company || 'Company'}</span>
                          <span className="text-[10.5px] text-slate-500 font-normal">
                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {formData.education.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Education
                  </h4>
                  <div className="space-y-2">
                    {formData.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-start text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-900">{edu.degree} in {edu.fieldOfStudy}</span>
                          <span className="block text-slate-500">{edu.institution}</span>
                        </div>
                        <span className="text-slate-500">{edu.graduationYear}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {formData.projects.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
                    Key Projects
                  </h4>
                  <div className="space-y-2">
                    {formData.projects.map((proj, idx) => (
                      <div key={idx} className="text-[11px]">
                        <span className="font-semibold text-slate-900">{proj.title}</span>
                        {proj.technologies && (
                          <span className="text-slate-500 ml-1.5 italic">({proj.technologies})</span>
                        )}
                        <p className="text-slate-600 mt-0.5">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
