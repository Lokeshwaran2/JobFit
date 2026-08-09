# JobFit 🚀

> AI-powered resume optimization platform that helps job seekers tailor their resumes to specific job descriptions.

[![Live Demo](https://img.shields.io/badge/Live_Demo-jobfit--mu.vercel.app-blue?style=for-the-badge&logo=vercel)](https://jobfit-mu.vercel.app)
[![Status](https://img.shields.io/badge/Status-🟢_Live-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

---

## 🌐 Live Demo

👉 **[Try JobFit Live](https://jobfit-mu.vercel.app)**  
**Status:** 🟢 Live Production

---

## 🎯 The Problem

Most job seekers submit the exact same resume to dozens of different applications. As a result:
- **Keyword Mismatch**: Resumes fail to incorporate the specific terminology required by modern Applicant Tracking Systems (ATS).
- **Unquantified Impact**: Bullet points describe daily tasks instead of measurable achievements.
- **Low Callback Rates**: Candidates are filtered out by screening tools before a hiring manager ever reads their application.

---

## 💡 What JobFit Does

JobFit analyzes a candidate's resume against a target job description to:

- **Extract Relevant Skills & Keywords**: Parses unstructured JDs to identify top 20 keywords, required skills, and core responsibilities.
- **Identify Missing Skills**: Highlights missing or underrepresented technical and soft skills.
- **Evaluate Resume-to-Job Alignment**: Calculates an AI-assisted 0–100 match score across 10 evaluation dimensions.
- **Improve Bullet Points**: Rewrites experience bullets using an X-Y-Z style achievement framework with action-oriented and measurable outcomes.
- **Generate ATS-Friendly Resumes**: Produces clean, machine-readable resumes exported as PDFs.
- **Manage Tailored Resumes**: Enables users to save and track multiple resume versions inside a personal dashboard.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, TypeScript) |
| **UI & Styling** | Tailwind CSS v4, Radix UI, Lucide Icons, next-themes |
| **Database & ORM** | PostgreSQL (Neon), Prisma ORM |
| **Authentication** | NextAuth.js v5, Prisma Adapter, bcryptjs |
| **AI Engine** | Groq SDK, Llama 3.1 8B Instant |
| **Document Processing** | pdf-parse, Mammoth (DOCX) |
| **PDF Generation** | @react-pdf/renderer, react-pdf |
| **Payments** | Razorpay |
| **Deployment** | Vercel |

---

## 📸 Screenshots

### Landing Page
![JobFit Landing Page](./docs/images/landing-page.png)

### Resume Analysis & JD Matching
![Resume Analysis](./docs/images/resume-analysis.png)

### Resume Builder & Editor
![Resume Builder](./docs/images/resume-builder.png)

### ATS Match Score Engine
![ATS Score](./docs/images/ats-score.png)

### Candidate Dashboard
![Dashboard](./docs/images/dashboard.png)

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │   Web Application   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Authentication     Resume APIs       Payments
          NextAuth          Server Actions    Razorpay
             │                 │
             │                 ▼
             │            AI Service
             │                 │
             │          ┌──────┴──────┐
             │          │             │
             │       Resume         JD
             │      Analysis      Analysis
             │          │             │
             │          └──────┬──────┘
             │                 ▼
             │          Match Analysis
             │                 │
             └────────────┬────┘
                          ▼
                     PostgreSQL
                       + Prisma
```

---

## 🧠 Responsible AI Architecture

The AI service (`src/lib/ai-service.ts`) uses structured LLM outputs via Groq (`llama-3.1-8b-instant`):

1. **Document Normalization**: Converts raw PDF/DOCX text into typed JSON schema (`personalInfo`, `skills`, `experience`, `projects`, `education`).
2. **JD Requirement Extraction**: Identifies target job title, top 20 ATS keywords, required skills, and core responsibilities from job descriptions.
3. **Targeted Bullet Improvement**: Rewrites experience bullet points using action-oriented language and encourages measurable outcomes when supported by the candidate's original information.
4. **Terminology Alignment**: Evaluates job-title alignment and suggests relevant terminology when appropriate without fabricating candidate experience.
5. **0–100 ATS Match Scoring**: Evaluates candidate resumes against 10 dimensions (Title Alignment, Keyword Placement, Impact Metrics, Action Verbs, Skill Synonyms, Tools Section, Tech Stack, Soft Skills, Location, Section Order).

---

## 🧠 Engineering Challenges

### 1. Resume → Structured Data
Resumes vary drastically in structure and format. JobFit converts extracted document text from `.pdf` and `.docx` files into a normalized candidate schema before analysis.

### 2. Job Description → Structured Requirements
The system processes unstructured job posts to extract title, technical skills, soft skills, keywords, and seniority levels for deterministic matching.

### 3. AI Output Reliability
LLM outputs are constrained into structured JSON formats so that downstream scoring and resume generation remain predictable and schema-safe.

### 4. Machine-Readable PDF Generation
Generated resumes preserve machine-readable text and standard section hierarchy required by automated Applicant Tracking Systems while maintaining visual layout consistency using `@react-pdf/renderer`.

### 5. Usage & Billing State
User credit balances and subscription states are validated server-side through Razorpay order and payment verification flows.

---

## 📁 Project Structure

```text
JobFit/
├── prisma/
│   └── schema.prisma         # Prisma ORM Schema (User, Account, Session, Resume)
├── public/                    # Public static assets & branding
├── src/
│   ├── actions/               # Next.js Server Actions
│   │   ├── login.ts           # Authentication action
│   │   ├── register.ts        # Registration action
│   │   ├── resume.ts          # Resume CRUD actions
│   │   └── update-profile.ts  # User profile update action
│   ├── app/                   # App Router Pages & API Endpoints
│   │   ├── (auth)/            # Auth routes (Login, Register)
│   │   ├── api/               # API endpoints (Auth, Resume, Razorpay)
│   │   ├── builder/           # Multi-step resume builder interface
│   │   ├── dashboard/         # User dashboard & resume history
│   │   ├── subscription/      # Billing & credit purchase interface
│   │   ├── layout.tsx         # Root application layout
│   │   └── page.tsx           # SEO Landing page with FAQ schema
│   ├── components/            # UI Components
│   │   ├── ats-score-header.tsx    # ATS score indicator
│   │   ├── improvement-summary.tsx # AI rewrite statistics
│   │   ├── pricing-section.tsx     # Razorpay pricing table
│   │   ├── resume-builder.tsx      # Main state machine workflow
│   │   ├── resume-editor.tsx       # Field-by-field resume form
│   │   ├── resume-preview.tsx      # Interactive PDF previewer
│   │   ├── resume-document.tsx     # @react-pdf layout document
│   │   └── ui/                     # Radix UI primitive wrappers
│   ├── lib/                   # Utility modules & Services
│   │   ├── ai-service.ts      # Groq AI prompts & ATS match scoring
│   │   ├── file-parser.ts     # Document text extractor
│   │   ├── pdf-parser.ts      # PDF parse handler
│   │   ├── prisma.ts          # Singleton Prisma Client
│   │   └── razorpay.ts        # Razorpay SDK initialization
│   └── middleware.ts          # Authentication middleware
├── env-example.txt            # Environment variable template
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🗄️ Database Design

Managed via **Prisma ORM** (`prisma/schema.prisma`):

- **User**: Authentication details, `isPro` status, credit balance (`credits`), and customer payment references.
- **Account**: NextAuth account provider linking.
- **Session** & **VerificationToken**: NextAuth session tokens.
- **Resume**: Parsed resume title, raw text, file URL, target job description, computed `atsScore`, `keywordMatch`, `missingSkills` list, `improvements` summary, and full `structuredData` JSON.

---

## 🔐 Security

- **Environment Secret Isolation**: Secrets and API keys are stored outside the repository in `.env` files.
- **Authentication**: User access control is enforced via NextAuth.js v5.
- **Route Protection**: Protected application routes require valid user session authentication.
- **Server-Side Payment Verification**: Razorpay order HMAC signatures are verified server-side before granting credits or pro access.
- **Database Query Safety**: Database access is handled through Prisma's parameterized query APIs, reducing exposure to SQL injection risks.

---

## 💳 Billing & Monetization

- **Free Tier**: 3 initial credits upon registration to test resume analysis.
- **Credit Purchases & Subscriptions**: Integrated with Razorpay order creation (`/api/razorpay/order`) and server-side signature verification (`/api/razorpay/verify`) endpoints.

---

## ☁️ Deployment

| Component | Platform |
|---|---|
| **Frontend / Web Application** | Vercel |
| **Database** | Neon PostgreSQL |
| **AI Provider** | Groq |
| **Payments** | Razorpay |

### Production Site
👉 **[Open JobFit Live](https://jobfit-mu.vercel.app)**

---

## 📊 Project Highlights

- 🚀 Live production deployment
- 📄 PDF/DOCX resume processing
- 🤖 AI-assisted match scoring & targeted bullet improvement
- 💳 Active Razorpay subscription & credit monetization

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **PostgreSQL Database** (e.g., Neon PostgreSQL or local PostgreSQL instance)

### 2. Installation & Setup

```bash
# Clone the repository
git clone https://github.com/Lokeshwaran2/JobFit.git
cd JobFit

# Install dependencies
npm install

# Setup environment variables
cp env-example.txt .env
```

Configure `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/jobfit?schema=public"
AUTH_SECRET="your_nextauth_secret_here"
GROQ_API_KEY="gsk_your_groq_api_key"
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

```bash
# Push database schema & generate client
npx prisma db push
npx prisma generate

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

This repository is publicly available for viewing and educational/reference purposes.

The source code is proprietary. No permission is granted to copy, modify, distribute, or use the software commercially without explicit permission from the author.
