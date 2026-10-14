import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { analyzeCvJobMatch } from './server/tfidf.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'JobTracker Backend',
    timestamp: new Date().toISOString(),
  });
});

// TF-IDF & Cosine Similarity Match Endpoint with Skill Gap Analysis
app.post('/api/match', async (req, res) => {
  try {
    const { cv, job } = req.body;

    if (!cv || !job) {
      return res.status(400).json({ error: 'Both cv and job payloads are required.' });
    }

    // 1. Deterministic Academic TF-IDF & Cosine Similarity Matching
    const baseAnalysis = analyzeCvJobMatch(cv, job);

    // 2. Optional AI-Augmented Qualitative Career Advice via Gemini if configured
    let aiAdvice: string[] = [];
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a senior career advisor and technical recruiter reviewing a candidate for the job: "${job.title}" at "${job.company}".
Candidate target role: ${cv.targetRole || 'Not specified'}
Candidate skills: ${(cv.skills || []).join(', ')}
Missing required skills: ${baseAnalysis.missingRequiredSkills.join(', ') || 'None'}
Missing preferred skills: ${baseAnalysis.missingPreferredSkills.join(', ') || 'None'}
Calculated TF-IDF Cosine Match: ${baseAnalysis.matchScore}%

Provide 2-3 concise, high-impact, professional recommendations (max 2 sentences each) for the candidate on how to bridge the skill gap, improve their CV impact, and succeed in this application. Return as bullet points.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          aiAdvice = response.text
            .split('\n')
            .map(line => line.replace(/^[\*\-\•\d\.]+\s*/, '').trim())
            .filter(line => line.length > 20)
            .slice(0, 3);
        }
      } catch (aiErr: any) {
        // Fall back gracefully to base TF-IDF recommendations
        console.info('Gemini enhancement fallback to TF-IDF recommendations:', aiErr?.message || aiErr);
      }
    }

    // Merge AI advice if available
    const finalRecommendations = aiAdvice.length > 0 
      ? [...aiAdvice, ...baseAnalysis.recommendations.slice(0, 2)]
      : baseAnalysis.recommendations;

    return res.json({
      ...baseAnalysis,
      recommendations: finalRecommendations,
    });
  } catch (error: any) {
    console.error('Error in /api/match:', error);
    return res.status(500).json({
      error: 'Failed to compute CV-job match analysis',
      message: error?.message || 'Internal server error',
    });
  }
});

// Setup Frontend Vite middlewares or Static distribution
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JobTracker full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
