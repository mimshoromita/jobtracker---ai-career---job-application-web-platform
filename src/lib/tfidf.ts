import { CV, Job, MatchAnalysisResult } from '../types';

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

export function tokenize(text: string): string[] {
  if (!text) return [];
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
    idf.set(term, Math.log((1 + totalDocs) / (1 + df)) + 1);
  }
  return idf;
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

export function clientAnalyzeCvJobMatch(cv: Partial<CV>, job: Partial<Job>): MatchAnalysisResult {
  const cvExpText = (cv.experience || [])
    .map(e => `${e.title || ''} ${e.company || ''} ${e.description || ''}`)
    .join(' ');
  const cvEduText = (cv.education || [])
    .map(e => `${e.degree || ''} ${e.fieldOfStudy || ''}`)
    .join(' ');
  const cvSkillsList = cv.skills || [];
  const cvFullText = `${cv.targetRole || ''} ${cv.summary || ''} ${cvSkillsList.join(' ')} ${cvExpText} ${cvEduText}`;

  const reqSkillsList = job.requiredSkills || [];
  const prefSkillsList = job.preferredSkills || [];
  const fullJobText = `${job.title || ''} ${job.description || ''} ${reqSkillsList.join(' ')} ${prefSkillsList.join(' ')}`;

  const cvTokens = tokenize(cvFullText);
  const jobTokens = tokenize(fullJobText);

  const idf = computeIDF([cvTokens, jobTokens]);
  const tf1 = computeTF(cvTokens);
  const tf2 = computeTF(jobTokens);

  const vocab = Array.from(new Set([...cvTokens, ...jobTokens]));
  const vec1 = new Map<string, number>();
  const vec2 = new Map<string, number>();

  for (const term of vocab) {
    const termIdf = idf.get(term) || 1;
    vec1.set(term, (tf1.get(term) || 0) * termIdf);
    vec2.set(term, (tf2.get(term) || 0) * termIdf);
  }

  const cosineSim = computeCosineSimilarity(vec1, vec2, vocab);

  const normalizedCvSkills = new Set(cvSkillsList.map(s => normalizeSkill(s)));
  const cvLower = cvFullText.toLowerCase();

  const isMatched = (skill: string) => {
    if (normalizedCvSkills.has(normalizeSkill(skill))) return true;
    return cvLower.includes(skill.toLowerCase().trim());
  };

  const matchedSkills: string[] = [];
  const missingRequiredSkills: string[] = [];
  const missingPreferredSkills: string[] = [];

  for (const req of reqSkillsList) {
    if (isMatched(req)) matchedSkills.push(req);
    else missingRequiredSkills.push(req);
  }

  for (const pref of prefSkillsList) {
    if (isMatched(pref)) {
      if (!matchedSkills.includes(pref)) matchedSkills.push(pref);
    } else {
      missingPreferredSkills.push(pref);
    }
  }

  const totalWeightedSkills = reqSkillsList.length * 1.5 + prefSkillsList.length * 0.8;
  let matchedWeight = 0;
  for (const m of matchedSkills) {
    if (reqSkillsList.includes(m)) matchedWeight += 1.5;
    else matchedWeight += 0.8;
  }

  const skillCoverage = totalWeightedSkills > 0
    ? Math.round((matchedWeight / totalWeightedSkills) * 100)
    : 80;

  const weightedCosineScore = Math.round(cosineSim * 100);
  const rawScore = Math.round((weightedCosineScore * 0.45) + (skillCoverage * 0.55));
  const matchScore = Math.min(Math.max(rawScore, 5), 98);

  const recommendations: string[] = [];
  if (missingRequiredSkills.length > 0) {
    recommendations.push(
      `Primary Gap: Study and highlight key required skills (${missingRequiredSkills.slice(0, 3).join(', ')}). Demonstrating hands-on project work in these areas will raise your profile ranking.`
    );
  }
  if (missingPreferredSkills.length > 0) {
    recommendations.push(
      `Bonus Edge: Consider building familiarity with nice-to-have skills (${missingPreferredSkills.slice(0, 3).join(', ')}).`
    );
  }
  if (cosineSim < 0.35) {
    recommendations.push(
      `Semantic Keyword Optimization: Enhance your CV summary and experience points with relevant terminology matching the ${job.title || 'target'} role.`
    );
  } else {
    recommendations.push(
      `High Keyword Alignment: Your background shares strong context and domain overlap (${Math.round(cosineSim * 100)}%) with this listing.`
    );
  }

  return {
    matchScore,
    cosineSimilarity: Math.round(cosineSim * 100) / 100,
    skillCoverage,
    matchedSkills,
    missingRequiredSkills,
    missingPreferredSkills,
    recommendations,
    summary: `Profile demonstrates a ${matchScore}% alignment with ${matchedSkills.length} matching skills and ${Math.round(cosineSim * 100)}% cosine similarity.`,
  };
}
