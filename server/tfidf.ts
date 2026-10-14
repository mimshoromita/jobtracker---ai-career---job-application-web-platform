/**
 * TF-IDF (Term Frequency - Inverse Document Frequency) & Cosine Similarity Engine
 * Engineered for Academic & Production CV-Job Matching and Skill-Gap Analysis
 */

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let\'s', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or',
  'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
]);

export interface MatchAnalysisResult {
  matchScore: number; // 0 - 100
  cosineSimilarity: number; // 0.0 - 1.0
  skillCoverage: number; // 0 - 100
  matchedSkills: string[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  recommendations: string[];
  summary: string;
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  // Normalize, preserve hyphens and dots in tech terms (e.g., node.js, c++, c#)
  return text
    .toLowerCase()
    .replace(/[^\w\s\+\#\.\-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

export function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  if (tokens.length === 0) return tf;

  const count = new Map<string, number>();
  for (const t of tokens) {
    count.set(t, (count.get(t) || 0) + 1);
  }

  for (const [term, freq] of count.entries()) {
    // Augmented frequency formulation to prevent bias towards long documents
    tf.set(term, 0.5 + (0.5 * freq) / tokens.length);
  }
  return tf;
}

export function computeIDF(documents: string[][]): Map<string, number> {
  const idf = new Map<string, number>();
  const totalDocs = documents.length;

  const docFreq = new Map<string, number>();
  for (const docTokens of documents) {
    const uniqueTerms = new Set(docTokens);
    for (const term of uniqueTerms) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  for (const [term, df] of docFreq.entries()) {
    // Smooth IDF formula: ln((1 + N) / (1 + df)) + 1
    idf.set(term, Math.log((1 + totalDocs) / (1 + df)) + 1);
  }
  return idf;
}

export function computeTFIDFVectors(doc1Tokens: string[], doc2Tokens: string[]): {
  vec1: Map<string, number>;
  vec2: Map<string, number>;
  vocabulary: string[];
} {
  const documents = [doc1Tokens, doc2Tokens];
  const idf = computeIDF(documents);

  const tf1 = computeTF(doc1Tokens);
  const tf2 = computeTF(doc2Tokens);

  const vocabSet = new Set([...doc1Tokens, ...doc2Tokens]);
  const vocabulary = Array.from(vocabSet);

  const vec1 = new Map<string, number>();
  const vec2 = new Map<string, number>();

  for (const term of vocabulary) {
    const termIdf = idf.get(term) || 1;
    vec1.set(term, (tf1.get(term) || 0) * termIdf);
    vec2.set(term, (tf2.get(term) || 0) * termIdf);
  }

  return { vec1, vec2, vocabulary };
}

export function computeCosineSimilarity(
  vec1: Map<string, number>,
  vec2: Map<string, number>,
  vocab: string[]
): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const term of vocab) {
    const val1 = vec1.get(term) || 0;
    const val2 = vec2.get(term) || 0;

    dotProduct += val1 * val2;
    norm1 += val1 * val1;
    norm2 += val2 * val2;
  }

  if (norm1 === 0 || norm2 === 0) return 0;
  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  return Math.min(Math.max(similarity, 0), 1);
}

function normalizeSkill(skill: string): string {
  return skill.toLowerCase().trim().replace(/[\.\-\s]/g, '');
}

export function analyzeCvJobMatch(
  cv: {
    skills?: string[];
    summary?: string;
    targetRole?: string;
    experience?: Array<{ title?: string; company?: string; description?: string }>;
    education?: Array<{ degree?: string; fieldOfStudy?: string }>;
  },
  job: {
    title: string;
    description: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    experienceLevel?: string;
  }
): MatchAnalysisResult {
  // Aggregate CV text representation
  const cvExperienceText = (cv.experience || [])
    .map(e => `${e.title || ''} ${e.company || ''} ${e.description || ''}`)
    .join(' ');
  const cvEducationText = (cv.education || [])
    .map(e => `${e.degree || ''} ${e.fieldOfStudy || ''}`)
    .join(' ');
  const cvSkillsList = cv.skills || [];
  const cvSkillsText = cvSkillsList.join(' ');

  const fullCvText = `${cv.targetRole || ''} ${cv.summary || ''} ${cvSkillsText} ${cvExperienceText} ${cvEducationText}`;

  // Aggregate Job text representation
  const reqSkillsList = job.requiredSkills || [];
  const prefSkillsList = job.preferredSkills || [];
  const fullJobText = `${job.title} ${job.description} ${reqSkillsList.join(' ')} ${prefSkillsList.join(' ')}`;

  // 1. Calculate TF-IDF Cosine Similarity
  const cvTokens = tokenize(fullCvText);
  const jobTokens = tokenize(fullJobText);
  const { vec1, vec2, vocabulary } = computeTFIDFVectors(cvTokens, jobTokens);
  const cosineSim = computeCosineSimilarity(vec1, vec2, vocabulary);

  // 2. Skill Gap Analysis
  const normalizedCandidateSkills = new Set(
    cvSkillsList.map(s => normalizeSkill(s))
  );

  // Also extract skills mentioned anywhere in CV text
  const cvFullLower = fullCvText.toLowerCase();

  const isSkillMatched = (skill: string) => {
    const norm = normalizeSkill(skill);
    if (normalizedCandidateSkills.has(norm)) return true;
    return cvFullLower.includes(skill.toLowerCase().trim());
  };

  const matchedSkills: string[] = [];
  const missingRequiredSkills: string[] = [];
  const missingPreferredSkills: string[] = [];

  for (const req of reqSkillsList) {
    if (isSkillMatched(req)) {
      matchedSkills.push(req);
    } else {
      missingRequiredSkills.push(req);
    }
  }

  for (const pref of prefSkillsList) {
    if (isSkillMatched(pref)) {
      if (!matchedSkills.includes(pref)) matchedSkills.push(pref);
    } else {
      missingPreferredSkills.push(pref);
    }
  }

  // 3. Compute Composite Score
  const totalImportantSkills = reqSkillsList.length * 1.5 + prefSkillsList.length * 0.8;
  let matchedSkillsWeight = 0;
  for (const m of matchedSkills) {
    if (reqSkillsList.includes(m)) matchedSkillsWeight += 1.5;
    else matchedSkillsWeight += 0.8;
  }

  const skillCoverage = totalImportantSkills > 0
    ? Math.round((matchedSkillsWeight / totalImportantSkills) * 100)
    : 85;

  // Composite match score: 45% TF-IDF Cosine Similarity + 55% Explicit Skill Coverage
  const weightedCosineScore = Math.round(cosineSim * 100);
  const rawScore = Math.round((weightedCosineScore * 0.45) + (skillCoverage * 0.55));
  const matchScore = Math.min(Math.max(rawScore, 5), 98);

  // 4. Generate Actionable Recommendations
  const recommendations: string[] = [];

  if (missingRequiredSkills.length > 0) {
    recommendations.push(
      `Primary Skill Gap: Add or study key required technologies (${missingRequiredSkills.slice(0, 3).join(', ')}). Building a portfolio project showcasing these will significantly boost your recruiter visibility.`
    );
  }

  if (missingPreferredSkills.length > 0) {
    recommendations.push(
      `Competitive Advantage: Consider gaining exposure to preferred skills (${missingPreferredSkills.slice(0, 3).join(', ')}), which will differentiate you from other candidates.`
    );
  }

  if (cosineSim < 0.35) {
    recommendations.push(
      `Vocabulary Alignment: Tailor your CV summary and experience bullet points to mirror standard industry keywords and phrasing found in this "${job.title}" posting.`
    );
  } else {
    recommendations.push(
      `Strong Alignment: Your profile shares substantial semantic similarity (${Math.round(cosineSim * 100)}%) with the position's core responsibilities.`
    );
  }

  if (cvExperienceText.length < 150) {
    recommendations.push(
      'Detail Impact: Expand your work history entries with measurable outcomes and project results (e.g., "improved performance by 25%").'
    );
  }

  const summary = `Candidate has a ${matchScore}% match score with ${matchedSkills.length} matched skills (${skillCoverage}% coverage) and a semantic cosine similarity of ${Math.round(cosineSim * 100)}%.`;

  return {
    matchScore,
    cosineSimilarity: Math.round(cosineSim * 100) / 100,
    skillCoverage,
    matchedSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    recommendations,
    summary,
  };
}
