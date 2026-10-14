# JobTracker — AI-Powered Career and Job Application Web Platform

JobTracker is a modern, production-grade full-stack web application designed for academic evaluation and real-world career application workflows. Built with React 19, TypeScript, Express, Tailwind CSS, Google Cloud Firestore, and Firebase Authentication, JobTracker bridges candidates, recruiters, and administrators with intelligent, explainable AI matching algorithms.

---

## 🚀 Key Feature Checklist

- [x] **Firebase Authentication & Profile Management**: Real Google OAuth sign-in, user profiles, persistent Firestore storage, and multi-role switching (Candidate, Recruiter, Admin).
- [x] **Role-Based Access Control (RBAC)**: Enforced via hardened Firestore Security Rules (`firestore.rules`) and intermediate data modeling (`firebase-blueprint.json`).
- [x] **Job Marketplace with Multi-Faceted Filters**: Search by title, company, skills, employment type (Full-time, Remote, Contract, etc.), department, and experience level.
- [x] **Recruiter Job Posting & Pipeline Hub**: Create and edit job postings with required and preferred skills tags, manage applicant pipelines, and progress statuses.
- [x] **CV Builder with Instant PDF Export**: Rich, multi-section resume composer (Work Experience, Education, Skills tags, Projects, Certifications) with real-time preview and client-side PDF generation via `jsPDF`.
- [x] **Application Tracker with Status Audit History**: Visual tracker logging chronological events (Submitted → Under Review → Interview → Offer → Rejected) with recruiter feedback notes and timestamps.
- [x] **Recent Activity Feed with Real-Time Snapshots**:
  - Live Firestore snapshot listener (`onSnapshot`) streaming events instantly without page refreshes.
  - Logs application submissions and status transitions made by recruiters.
  - Tracks saved / bookmarked job events with dedicated "Saved Roles" marketplace filter.
  - Profile & CV completion milestone engine (0% to 100%) celebrating milestones and recommending improvements.
- [x] **AI-Assisted CV–Job Matching**:
  - Academic implementation of **TF-IDF** (Term Frequency – Inverse Document Frequency) with augmented frequency scaling.
  - **Cosine Similarity** vector dot products calculated across full resume textual tokens and role requirements.
  - **Skill-Gap Analysis**: Categorizes exact matched competencies, missing required skills, and missing bonus skills.
  - Generates tailored career coaching and resume optimization advice (with server-side Gemini 2.5 Flash enhancement if configured).
- [x] **Protected CV Download & Job Apply Actions**: User authentication is strictly required. Unauthenticated visitors cannot download CV PDFs or submit job applications without logging in.
- [x] **Comprehensive Job Database (16+ Roles)**: Auto-seeded database with 16 diverse, high-demand positions across Frontend, Full Stack, AI/ML, DevOps, Python, Golang, Cybersecurity, Mobile, UI/UX, Big Data, and QA.
- [x] **Password-Protected Administrator Portal**:
  - Two-factor access control: Requires Google Sign-In followed by secret master password verification (`admin@jobtracker2026`).
  - No platform metrics, user directory, or moderation actions are accessible without entering the admin password.
  - Includes secure session unlocking and manual "Lock Admin Panel" controls.
- [x] **Robust Loading, Empty, and Error States**: Polished UX with skeleton screens, empty state CTAs, and defensive Firestore error serialization conforming to standard specifications.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, jsPDF
- **Backend**: Node.js, Express (`server.ts`), `@google/genai` TypeScript SDK
- **Database & Auth**: Google Cloud Firestore, Firebase Authentication
- **Information Retrieval**: Custom TF-IDF vectorizer and Cosine Similarity engine (`server/tfidf.ts` & `src/lib/tfidf.ts`)
- **Development Tooling**: Vite, tsx

---

## 📁 Key Files & Project Structure

```
├── firebase-applet-config.json     # Provisioned Firebase credentials and database ID
├── firebase-blueprint.json         # Intermediate data representation of entities & paths
├── firestore.rules                 # Hardened security rules enforcing RBAC & data safety
├── server.ts                       # Express backend server with Vite dev middleware
├── server/
│   └── tfidf.ts                   # Server-side TF-IDF & Cosine Similarity matching engine
├── src/
│   ├── App.tsx                    # Main app coordinator with tab router & modal states
│   ├── components/
│   │   ├── Navbar.tsx             # Responsive header with role switcher & Google Auth
│   │   ├── JobMarketplace.tsx     # Job discovery with real-time match scores & filters
│   │   ├── JobDetailModal.tsx     # Role overview + TF-IDF match tab & 1-click apply
│   │   ├── CVBuilder.tsx          # Resume composer, template loader, and PDF export
│   │   ├── ApplicationTracker.tsx # Kanban/list tracker with status audit log modal
│   │   ├── RecruiterPortal.tsx    # Job postings creator & applicant pipeline manager
│   │   ├── AdminDashboard.tsx     # User directory, role delegation & moderation
│   │   └── ProfileModal.tsx       # Profile editor (bio, headline, contact info)
│   ├── context/
│   │   └── AuthContext.tsx        # Firebase auth listener & role synchronization
│   ├── lib/
│   │   ├── firebase.ts            # Firebase SDK init & defensive error handlers
│   │   ├── tfidf.ts               # Client-side TF-IDF vectorizer & fallback engine
│   │   └── pdfExport.ts           # Formatted A4 PDF resume generation via jsPDF
│   ├── services/
│   │   ├── api.ts                 # Backend `/api/match` client
│   │   ├── jobService.ts          # Firestore queries for jobs & demo data seeding
│   │   ├── cvService.ts           # Firestore queries for candidate CVs
│   │   ├── applicationService.ts  # Application submissions & status log mutations
│   │   └── userService.ts         # User profiles and admin directory queries
│   └── types/
│       └── index.ts               # Shared TypeScript schemas
```

---

## ⚙️ Setup & Local Execution

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd jobtracker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   GEMINI_API_KEY="your-gemini-api-key-optional"
   ```

4. **Launch the Full-Stack Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 🧪 Testing the Core Features

1. **Test Candidate Experience**:
   - Navigate to the **CV Builder** tab and click **"Load Template"** to load a full engineering CV.
   - Click **"Save to Cloud"** to store your CV in Cloud Firestore.
   - Click **"Export PDF"** to test the resume export.
   - Return to the **Jobs** tab: notice that every job card now displays your personalized **TF-IDF Match %**.
   - Click any job, open the **"AI & TF-IDF Skill-Gap Analysis"** tab to inspect matched vs missing skills, then click **"Apply with Saved CV"**.
   - Open **"My Tracker"** to see your application logged with its initial status.

2. **Test Recruiter Experience**:
   - In the navigation bar, switch the **Role** dropdown to **Recruiter**.
   - Open the **Recruiter Hub** tab.
   - Click **"Post a New Job"** and fill in required skills.
   - Switch to the **Candidate Pipeline** tab to see applicants, their match scores, and change their pipeline stage (e.g., move to "Interview" or "Offer" with an interview note).

3. **Test Status Audit Trail**:
   - Switch back to **Candidate** role and visit **"My Tracker"**.
   - Click **"View Audit Timeline"** on the application: observe the step-by-step history log with timestamps and recruiter notes.

4. **Test Administrator Experience**:
   - Switch the **Role** dropdown to **Admin**.
   - Open the **Admin** tab to view total users, role distributions, job moderation controls, and system health checks.
