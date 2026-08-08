# JobFit 🚀

> **AI-Powered ATS Resume Builder & Job Description Matching Engine**

JobFit is a full-stack SaaS application built with **Next.js 15** designed to help job seekers bypass Applicant Tracking Systems (ATS). By analyzing job descriptions in real-time, JobFit extracts top keywords, identifies skill gaps, rewrites experience bullets using Google's proven **X-Y-Z formula**, and generates ATS-optimized resumes guaranteed to hit **95+ match scores**.

---

## 🌟 Key Features

- 📄 **Multi-Format Resume Parsing**: Upload existing resumes in `.pdf` or `.docx` format. Extracts structured candidate profile data using `pdf-parse` and `mammoth`.
- 🎯 **Job Description Targeting**: Input any target job description. The AI engine analyzes required skills, top 20 keywords, core responsibilities, and seniority level.
- ⚡ **AI Bullet-Point Optimization**: Automatically rewrites experience bullet points following Google’s **X-Y-Z Formula** (*"Accomplished [X], as measured by [Y], by doing [Z]"*) with quantified metrics and action verbs.
- 📊 **10-Point ATS Score Calculator**: Calculates a real-time match score based on 10 critical checks (Title Alignment, Keyword Placement, Quantified Impact, Action Verbs, Skill Synonyms, Tools & Environment, Tech Stack, Soft Skills, Location, Section Order).
- ✏️ **Interactive Resume Editor**: Customize summary, experience, skills (hard, soft, tools), projects, and education with live validation.
- 📥 **ATS-Safe PDF Export**: One-click PDF generation using `@react-pdf/renderer` with clean, single/multi-page, machine-readable layouts.
- 🔒 **Authentication & User Dashboard**: Secure authentication via NextAuth.js v5 with Credentials provider and Prisma PostgreSQL adapter. Track past resumes and score improvements.
- 💳 **Credit & Subscription Billing**: Integrated payment gateway with Razorpay API for purchasing credits and upgrading to pro plans.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Actions, TypeScript) |
| **UI & Styling** | [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, Lucide Icons, `next-themes` |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) (Neon DB) with [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js v5](https://authjs.dev/) (`@auth/prisma-adapter`, `bcryptjs`) |
| **AI / LLM Engine** | [Groq SDK](https://groq.com/) (`llama-3.1-8b-instant`) |
| **Document Parsing** | `pdf-parse`, `mammoth` |
| **PDF Generation** | `@react-pdf/renderer`, `react-pdf`, `@napi-rs/canvas` |
| **Payments** | [Razorpay](https://razorpay.com/) API Integration |

---

## 📁 Project Structure

```
JobFit/
├── prisma/
│   └── schema.prisma         # Prisma ORM Schema (User, Account, Session, Resume)
├── public/                    # Static assets (logos, images)
├── src/
│   ├── actions/               # Next.js Server Actions
│   │   ├── login.ts           # Credentials authentication action
│   │   ├── register.ts        # User registration action
│   │   ├── resume.ts          # Resume CRUD actions
│   │   └── update-profile.ts  # User profile update action
│   ├── app/                   # App Router Pages & API Routes
│   │   ├── (auth)/            # Login & Registration pages
│   │   ├── api/               # REST API endpoints
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── razorpay/      # Payment order creation & verification
│   │   │   └── resume/        # Resume analysis & parsing endpoint
│   │   ├── ats-resume-checker/
│   │   ├── builder/           # Multi-step resume builder interface
│   │   ├── dashboard/         # Candidate dashboard
│   │   ├── subscription/      # Billing & credit purchase page
│   │   ├── globals.css        # Tailwind v4 styles & theme tokens
│   │   ├── layout.tsx         # Root layout with providers
│   │   └── page.tsx           # SEO Landing page with JSON-LD schema
│   ├── components/            # React Components
│   │   ├── ats-score-header.tsx    # Visual score badge & progress bar
│   │   ├── improvement-summary.tsx # AI improvement metrics breakdown
│   │   ├── pricing-section.tsx     # Razorpay pricing table
│   │   ├── resume-builder.tsx      # Main upload/analyze/edit workflow
│   │   ├── resume-editor.tsx       # Form fields for candidate details
│   │   ├── resume-preview.tsx      # PDF canvas preview
│   │   ├── resume-document.tsx     # @react-pdf document template
│   │   └── ui/                     # Radix UI primitive wrappers
│   ├── lib/                   # Utility modules & Services
│   │   ├── ai-service.ts      # Groq AI prompt logic & score evaluation
│   │   ├── file-parser.ts     # Document text extractor dispatcher
│   │   ├── pdf-parser.ts      # PDF parse wrapper
│   │   ├── prisma.ts          # Singleton Prisma Client
│   │   └── razorpay.ts        # Razorpay SDK initializer
│   └── middleware.ts          # Route protection middleware
├── .env                       # Environment variables (do not commit)
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies & scripts
└── tsconfig.json              # TypeScript configuration
```

---

## 🗄️ Database Schema Summary

Managed via **Prisma** (`prisma/schema.prisma`):

- **User**: Stores user profile, authentication credentials, pro status (`isPro`), credit balance (`credits`), and customer payment references.
- **Account**: NextAuth account provider linking.
- **Session** & **VerificationToken**: Session tokens for authenticated states.
- **Resume**: Stores parsed resume title, raw text, uploaded file URL, target job description, computed `atsScore`, `keywordMatch`, `missingSkills` array, `improvements` JSON, and full `structuredData` JSON object (personal info, summary, experience, skills, projects, education).

---

## 🤖 AI Prompting & Scoring Engine

The AI service (`src/lib/ai-service.ts`) executes three core LLM steps powered by Groq (`llama-3.1-8b-instant`):

1. **Extraction (`extractResumeFromText`)**: Converts raw text into normalized JSON format (personal info, skills categorized into hard/soft/tools, experience, projects, education).
2. **JD Analysis (`analyzeJobDescription`)**: Identifies target job title, top 20 ATS keywords, required skills, core responsibilities, and seniority level.
3. **Resume Rewrite & Scoring (`rewriteResume`)**:
   - Forces job title alignment for maximum ATS match.
   - Rewrites experience bullets with quantified metrics (percentages, numbers, time savings).
   - Evaluates a 10-point checklist to output a reliable 95+ score.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm**, **pnpm**, or **yarn**
- **PostgreSQL Database** (e.g. [Neon](https://neon.tech/), Supabase, or local PostgreSQL)

### 1. Clone the Repository

```bash
git clone https://github.com/Lokeshwaran2/JobFit.git
cd JobFit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/jobfit?schema=public"

# NextAuth Configuration
AUTH_SECRET="your_nextauth_secret_here"

# AI Service (Groq)
GROQ_API_KEY="gsk_your_groq_api_key_here"

# Razorpay Payments
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
```

### 4. Database Setup & Prisma Generation

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start using JobFit.

---

## 📜 Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Generates Prisma Client and builds the production bundle.
- `npm run start`: Runs the built production server.
- `npm run lint`: Runs ESLint check across all TypeScript and React files.

---

## 🌐 Deployment

JobFit is designed for seamless deployment on **Vercel**:

1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Add your environment variables (`DATABASE_URL`, `AUTH_SECRET`, `GROQ_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) in the Vercel dashboard.
3. The build step automatically runs `prisma generate && next build`.

---

## 📄 License

This project is private and proprietary. All rights reserved.
