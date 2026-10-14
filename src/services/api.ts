import { CV, Job, MatchAnalysisResult } from '../types';
import { clientAnalyzeCvJobMatch } from '../lib/tfidf';

export async function getCvJobMatchAnalysis(cv: Partial<CV>, job: Partial<Job>): Promise<MatchAnalysisResult> {
  try {
    const response = await fetch('/api/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cv, job }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data as MatchAnalysisResult;
  } catch (err) {
    console.warn('Backend match API error, utilizing client-side TF-IDF engine:', err);
    return clientAnalyzeCvJobMatch(cv, job);
  }
}
