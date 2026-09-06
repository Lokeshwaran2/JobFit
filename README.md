# JobFit 🚀

> Full-Spectrum AI Career Intelligence & 10-Factor ATS Resume Optimization Platform.  
> JobFit tailors resumes to job descriptions with Google X-Y-Z metrics, audits candidate GitHub & LinkedIn profiles for recruiter proof, tracks recurring skill gaps across applications, and builds personalized learning roadmaps with verified free resources.

[![Live Demo](https://img.shields.io/badge/Live_Demo-jobfit--mu.vercel.app-blue?style=for-the-badge&logo=vercel)](https://jobfit-mu.vercel.app)
[![Status](https://img.shields.io/badge/Status-🟢_Live-success?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

---

## 🌐 Live Application

👉 **[Try JobFit Live](https://jobfit-mu.vercel.app)**  
**Status:** 🟢 Live Production Deployment

---

## 🎯 The Problem

Most job seekers submit the exact same generic resume to dozens of applications. As a result:
- **Keyword Deficit**: Resumes fail to incorporate the specific semantic terminology required by modern Applicant Tracking Systems (ATS) like Workday, Taleo, and Greenhouse.
- **Unquantified Impact**: Bullet points describe daily tasks ("worked on checkout forms") instead of measurable business outcomes.
- **Unverified Digital Presence**: In competitive technical hiring, 80% of recruiters audit GitHub and LinkedIn. When candidate repositories or headline keywords don't match resume claims, applications stall.
- **Blind Job Hunting**: Candidates repeatedly apply to jobs without realizing which missing skills are systematically causing their auto-rejections.

---

## 💡 What JobFit Does

JobFit provides an end-to-end career intelligence and application optimization pipeline:

### 1. 10-Factor ATS Resume Tailoring & Rewriting
- **Target Role Extraction**: Analyzes unstructured job descriptions (JDs) to extract target titles, top 20 keywords, required tools, and seniority levels.
- **Google X-Y-Z Impact Bullets**: Automatically rewrites experience points into *"Accomplished [X], measured by [Y], by doing [Z]"* with concrete metrics (throughput, latency, percentages, scale).
- **10-Dimension Evaluation Engine**: Scores resumes across Title Alignment, Keyword Density, Impact Metrics, Action Verbs, Skill Synonyms, Dedicated Tools Section, Tech Stack Recency, Soft Skills, Location, and Section Hierarchy.
- **Machine-Readable PDF Engine**: Generates single-column vector PDFs via `@react-pdf/renderer` guaranteed to parse cleanly on corporate portals without formatting traps.

### 2. Multi-Platform Candidate Profiler (GitHub & LinkedIn)
- **GitHub Repository Audit**: Connects candidate public GitHub profiles, scanning repositories, languages, commit velocity, star counts, and topic tags to verify concrete code proof against the target JD.
- **LinkedIn Presence Audit**: Evaluates headline keyword density, About section clarity, and skill endorsements for maximum recruiter discoverability.
- **Unified 3-Way Match Matrix**: Cross-validates JD requirements side-by-side against Resume statements, GitHub code evidence, and LinkedIn endorsements to eliminate false positives.

### 3. Recurring Skill Gap Tracker & Priority Engine
- **Cross-Job Aggregation**: Automatically identifies and tallies missing skills detected across multiple job applications and resumes.
- **Priority Scoring**: Computes a dynamic demand score based on recurrence frequency, recency, and market hiring trends so candidates know what to learn next.
- **Status Tracking**: Tracks skills across "learning", "in progress", and "acquired" states.

### 4. Autonomous Skill Learning Engine
- **Curriculum Registry**: Built-in structured curriculums for high-demand technologies (PostgreSQL, Docker, Kubernetes, React, Python, Go, Node.js, Kafka, Redis, AWS, etc.).
- **User Level Detection**: Automatically assesses candidate baseline experience (Beginner, Intermediate, Advanced) from their resume background.
- **100% Free Verified Resources**: Curates official documentation, interactive browser sandboxes, and verified video courses.
- **Milestone Checkpoints & Capstones**: Provides hands-on coding challenges and real-world capstone projects designed to be committed to GitHub as portfolio proof.

### 5. Role & Company SEO Intelligence Hubs
- **86+ Role Guides**: Pre-built benchmark resume structures and keyword lists for roles like Software Engineer, Frontend, Backend, Full-Stack, DevOps, Data Science, and Product Management (`/resume-for/[slug]`).
- **IT Services Tracks**: Dedicated preparation guides for major IT recruiters (TCS, Infosys, Accenture, etc.).
- **Dedicated Diagnostic Tools**: Standalone hubs for `/ats-resume-checker`, `/job-fit-resume`, and `/resume-based-on-job-description`.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Actions, TypeScript) |
| **UI & Styling** | Tailwind CSS v4, Radix UI Primitives, Lucide Icons, next-themes |
| **Database & ORM** | PostgreSQL (Neon), Prisma ORM |
| **Authentication** | NextAuth.js v5 (Beta 25), Prisma Adapter, bcryptjs |
| **AI Engine** | Groq SDK (`llama-3.1-8b-instant`, `openai/gpt-oss-120b`), Structured JSON schema outputs |
| **Document Processing** | `pdf-parse`, `Mammoth` (DOCX) |
| **PDF Generation** | `@react-pdf/renderer`, `react-pdf` |
| **Payments & Billing** | Razorpay SDK (Order creation, webhook signature verification) |
| **Testing & Execution** | `tsx`, custom test suites for skills, learning engine, and profile scoring |
| **Deployment** | Vercel |

---

## 🏗️ Architecture

```text
                             ┌──────────────────────────────┐
                             │      Next.js App Router       │
                             │  (Landing, Dashboard, Builder) │
                             └──────────────┬───────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
       Authentication                  Resume Engine                Candidate Profiler
     NextAuth v5 (Auth.js)           Server Actions + APIs        GitHub & LinkedIn Services
              │                             │                             │
              │                             ▼                             ▼
              │                     AI Analysis Engine             3-Way Match Matrix
              │                     (Groq SDK / Llama)             (Resume vs Code vs JD)
              │                             │                             │
              │                 ┌───────────┴───────────┐                 │
              │                 ▼                       ▼                 │
              │          10-Factor ATS             Skill Gap              │
              │          Match Scoring             Tracker                │
              │                 │                       │                 │
              │                 ▼                       ▼                 │
              │          Google X-Y-Z              Autonomous             │
              │          Bullet Rewriter        Learning Engine           │
              │                 │                       │                 │
              └─────────────────┼───────────────────────┼─────────────────┘
                                ▼                       ▼
                             PostgreSQL Database (Neon) + Prisma ORM
```

---

## 🧠 Core Engineering Services

### 1. AI Service & Document Normalization (`src/lib/ai-service.ts`)
- **Document Text Normalization**: Ingests raw text from uploaded PDFs and DOCX files, normalizing it into a strict typed JSON candidate model (`personalInfo`, `skills`, `experience`, `projects`, `education`).
- **JD Requirement Extraction**: Extracts required role title, top 20 ATS keywords, hard/soft skills, tools, and seniority levels.
- **Google X-Y-Z Achievement Transformation**: Rewrites candidate bullets using action verbs and measurable metrics without hallucinating unmentioned skills.
- **Robust JSON Repair Engine**: Custom multi-pass JSON stream sanitizer that strips markdown fences, handles truncation repair, and balances nested bracket counts.

### 2. Candidate Profile Scoring Engine (`src/lib/profile-scoring/`)
- **GitHub Scoring Service (`github-scoring-service.ts`)**: Evaluates repository counts, commit activity, language distributions, star counts, topic tags, and technical stack overlap with target roles.
- **LinkedIn Scoring Service (`linkedin-scoring-service.ts`)**: Audits headline strength, about section keyword density, experience relevance, and endorsed competencies.
- **Unified Profile Scorer (`profile-scoring-engine.ts`)**: Merges resume claims with external code evidence and generates actionable, step-by-step recommendations.

### 3. Skill Gap Tracker & Priority Engine (`src/lib/skills/skill-gap-tracker.ts`)
- **Skill Normalization (`skill-normalization.ts`)**: Canonicalizes variations and synonyms (e.g. "ReactJS", "React.js" -> "React"; "Postgres" -> "PostgreSQL").
- **Priority Calculation (`priority-calculator.ts`)**: Weights missing skills by application recurrence frequency, recency of detection, and hiring market impact.

### 4. Autonomous Skill Learning Engine (`src/lib/skills/engine/`)
- **Curriculum Registry (`skill-curriculum-registry.ts`)**: Deep structured definitions for technical skills with modular learning topics and deliverables.
- **User Level Detector (`user-level-detector.ts`)**: Diagnoses candidate level (beginner, intermediate, advanced) using past experience and repository evidence.
- **JD-Aware Curriculum Service (`jd-aware-curriculum-service.ts`)**: Adapts roadmaps to emphasize the specific aspects required by the candidate's target job posting.
- **Resource Verification & Ranking (`resource-verification-service.ts`, `resource-ranking-service.ts`)**: Ensures all external links are live, free, and official documentation or verified sandboxes.

---

## 📁 Project Structure

```text
JobFit/
├── prisma/
│   └── schema.prisma                   # Full Prisma ORM Schema (User, Resume, ProfileScores, SkillGaps, Curricula)
├── public/                             # Static assets, logos, and icons
├── src/
│   ├── actions/                        # Next.js Server Actions (Auth, Resume CRUD, Profile)
│   ├── app/                            # App Router Pages & API Routes
│   │   ├── (auth)/                     # Auth routes (Login, Register)
│   │   ├── api/                        # API Endpoints
│   │   │   ├── auth/                   # NextAuth handlers
│   │   │   ├── profile-score/          # GitHub & LinkedIn scoring endpoints
│   │   │   ├── razorpay/               # Razorpay order, verify & webhook handlers
│   │   │   ├── resume/                 # Resume analysis & parsing
│   │   │   └── skills/                 # Skill gap tracking & learning path APIs
│   │   ├── ats-resume-checker/         # Diagnostic ATS scanner landing page
│   │   ├── builder/                    # Interactive multi-step resume builder
│   │   ├── checkout/                   # Razorpay plan checkout interface
│   │   ├── dashboard/                  # Candidate dashboard (Resumes, Profile Scores, Skill Roadmaps)
│   │   ├── job-fit-resume/             # SEO landing page for job-fit resumes
│   │   ├── resume-based-on-job-description/ # SEO landing page for JD-based tailoring
│   │   ├── resume-for/                 # 86+ SEO role and company resume guides
│   │   ├── subscription/               # Billing and credit purchase management
│   │   ├── layout.tsx                  # Root application layout
│   │   └── page.tsx                    # Production landing page
│   ├── components/                     # React UI Components
│   │   ├── dashboard/                  # Dashboard cards (ProfileScoreCheck, SkillPriorities, ResumeList)
│   │   ├── landing/                    # Interactive product showcase widget
│   │   ├── ui/                         # Radix UI primitives (Dialog, Tabs, Badge, Button, Card, etc.)
│   │   ├── ats-score-header.tsx        # Live ATS match score indicators
│   │   ├── download-resume-button.tsx  # PDF downloader trigger
│   │   ├── improvement-summary.tsx     # AI rewrite statistics card
│   │   ├── pricing-section.tsx         # Razorpay pricing table
│   │   ├── profile-strength-card.tsx   # GitHub & LinkedIn audit summary
│   │   ├── resume-builder.tsx          # Main builder state machine
│   │   ├── resume-document.tsx         # @react-pdf vector document layout
│   │   ├── resume-editor.tsx           # Field-by-field interactive resume editor
│   │   └── resume-preview.tsx          # Real-time PDF preview canvas
│   ├── data/
│   │   └── resumePages.json            # Role and company SEO dataset
│   ├── lib/                            # Business Logic & Core Engines
│   │   ├── ai-service.ts               # Groq Llama AI prompts & ATS matching
│   │   ├── file-parser.ts              # PDF and DOCX file text extractors
│   │   ├── prisma.ts                   # Singleton Prisma Client
│   │   ├── razorpay.ts                 # Razorpay SDK client initialization
│   │   ├── profile-scoring/            # GitHub & LinkedIn Scoring Engine
│   │   │   ├── github-scoring-service.ts   # GitHub repository & commit audit
│   │   │   ├── linkedin-scoring-service.ts # LinkedIn headline & skills audit
│   │   │   ├── profile-scoring-engine.ts   # Unified candidate match matrix
│   │   │   └── url-validator.ts            # Social profile URL sanitizers
│   │   └── skills/                     # Skill Gap & Autonomous Learning Engine
│   │       ├── engine/                 # Curriculum registry & learning path generator
│   │       ├── priority-calculator.ts  # Gap frequency & priority calculator
│   │       ├── skill-gap-tracker.ts    # Cross-application gap tracker
│   │       └── skill-normalization.ts  # Canonical skill dictionary
│   └── middleware.ts                   # Route protection & authentication middleware
├── package.json                        # Dependencies & scripts
└── tsconfig.json                       # TypeScript compiler configuration
```

---

## 🗄️ Database Design (Prisma ORM)

The PostgreSQL database schema (`prisma/schema.prisma`) manages the complete career intelligence lifecycle:

- **User**: Authentication credentials, `isPro` subscription status, `credits` balance, Stripe/Razorpay customer identifiers, and connected profile links (`githubUrl`, `linkedinUrl`).
- **Resume**: Parsed resume text, target job description, computed `atsScore`, `keywordMatch`, `missingSkills` array, AI rewrite `improvements` JSON, and full `structuredData` JSON schema.
- **ProfileScore & ProfileScoreCheck**: Detailed candidate audit snapshots containing GitHub scores, LinkedIn scores, category breakdowns, matched code repositories, and actionable recommendations.
- **UserSkillGap & SkillGapOccurrence**: Tracks canonical missing skills across multiple resumes and target jobs, storing detection timestamps, recurrence counts, and acquisition status.
- **SkillCurriculum, LearningModule & LearningTopic**: Structured curriculum definitions for canonical skills, detailing topic prerequisites, estimated hours, and level targets.
- **CuratedResource, LearningPractice & LearningImplementation**: Curated official documentation, interactive sandbox exercises, verification checkpoints, and capstone projects.
- **LearningProgress & UserSkillLevel**: Tracks step completion status and diagnostic candidate skill levels (beginner, intermediate, advanced).

---

## 🔐 Security & Reliability

- **Machine-Readable PDF Guarantee**: Eliminates complex graphics and multi-column tables that crash enterprise ATS parsers, outputting single-column vector PDFs.
- **Strict Output Schema Enforcement**: Constrains AI generation to validated JSON models to prevent hallucinations or broken downstream rendering.
- **Environment Secret Isolation**: API keys (Groq, Razorpay, NextAuth) are strictly maintained in `.env` configurations.
- **Authentication & Protected Routes**: Enforced via NextAuth.js v5 with session-backed server action verification.
- **Payment Verification**: Razorpay order HMAC SHA256 signatures are validated server-side before updating user credits or pro access.

---

## 💳 Global Multi-Currency Recurring Billing Architecture

JobFit features an enterprise dual-payment provider architecture supporting domestic Indian INR transactions via **Razorpay** and global multi-currency recurring billing via **Dodo Payments**.

```
                           BillingService (Facade)
                               /            \
                PaymentProviderRouter (Deterministic)
                             /                \
    India + INR (RazorpayProvider)        Global / Non-INR (DodoPaymentsProvider)
    • Domestic UPI AutoPay & Cards       • Global Cards & Local Payment Methods
    • RBI e-Mandate Compliant            • Merchant of Record (MoR) & Tax Handling
    • Minor Unit: Paise (₹299 = 29900)    • Dodo Hosted Checkout & Customer Portal
    • Razorpay Webhooks & Verify         • Minor Units: Cents/Pence ($12 = 1200)
                                         • Standard Webhooks with Cryptographic Unwrap
```

### 1. Deterministic Provider Routing
- **INR Transactions (India)**: Routed authoritatively to `Razorpay` for seamless UPI AutoPay, domestic NetBanking, and Indian card standing instructions.
- **International Transactions (USD, EUR, GBP, Adaptive)**: Routed to `Dodo Payments` for global recurring subscriptions, recurring billing, international cards, and automatic adaptive currency localization.

### 2. Float-Free Currency Architecture
- All monetary operations throughout JobFit use **integer minor units** (`amountMinor`) paired with explicit 3-letter ISO `currency` codes to eliminate IEEE 754 floating-point rounding errors.
  - INR 99 → `amountMinor: 9900, currency: "INR"`
  - INR 299 → `amountMinor: 29900, currency: "INR"`
  - USD 2.99 → `amountMinor: 299, currency: "USD"`
  - USD 12.00 → `amountMinor: 1200, currency: "USD"`
  - EUR 11.00 → `amountMinor: 1100, currency: "EUR"`
  - GBP 10.00 → `amountMinor: 1000, currency: "GBP"`

### 3. Autopay & Subscription Lifecycle
- Real subscription billing utilizing Dodo Checkout Sessions (`client.checkoutSessions.create`) and Dodo Customer Portal (`client.customers.customerPortal.create`).
- State Machine: `pending` → `active` ⇄ `renewed` / `past_due` / `on_hold` → `cancelled`.
- Cancel at period end supported with automated entitlement preservation until the billing cycle expires.

### 4. Cryptographic Webhook Verification & Idempotency
- **Dodo Webhook (`/api/webhooks/dodo`)**: Cryptographically unwrapped using `dodopayments` SDK checking `webhook-id`, `webhook-signature`, and `webhook-timestamp`.
- **Idempotency Ledger**: Every incoming event is recorded in the `WebhookEvent` database model with SHA-256 payload hashing and unique `(provider, providerEventId)` constraints to guarantee that duplicate deliveries are safely ignored.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.x or v20.x
- **PostgreSQL Database** (e.g., Neon PostgreSQL or local instance)

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

# Razorpay (Domestic INR Payments)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# Dodo Payments (Global Multi-Currency Recurring Billing)
DODO_PAYMENTS_API_KEY="test_..."
DODO_PAYMENTS_WEBHOOK_KEY="whsec_..."
DODO_PAYMENTS_ENVIRONMENT="test_mode" # 'test_mode' | 'live_mode'
DODO_PRODUCT_JOBHUNT_USD="p_jobhunt_usd"
DODO_PRODUCT_STARTER_USD="p_starter_usd"
```

### 3. Database Migration & Client Generation

```bash
npx prisma db push
npx prisma generate
```

### 4. Running Test Suites

```bash
npm run test:billing         # Run Dodo & Razorpay provider routing, currency & minor unit tests
npm run test:skills          # Run skill gap aggregation tests
npm run test:engine          # Run autonomous learning engine tests
npm run test:profile-score   # Run GitHub & LinkedIn profile scoring tests
npm run test:profile-check   # Run unified match matrix tests
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 License

This repository is publicly available for viewing and educational/reference purposes.

The source code is proprietary. No permission is granted to copy, modify, distribute, or use the software commercially without explicit permission from the author.
