# ResumeLens

An AI-powered web application that analyzes resumes against job descriptions to estimate ATS (Applicant Tracking System) compatibility, identify keyword gaps, and generate intelligent, actionable resume improvements.

The system combines rule-based ATS heuristics with LLM-driven semantic analysis to deliver realistic match percentages, requirement-level breakdowns, and context-aware resume modification suggestions.

---

## Features

### Resume & Job Description Analysis

- Paste resume text or upload PDF / DOCX files
- Paste full job descriptions (responsibilities + requirements)
- Automatic text normalization and parsing

### ATS Scoring

- Match Percentage based on keyword and requirement coverage
- ATS Score combining weighted requirement matching and structural heuristics
- Scores are capped and normalized to reflect real ATS behavior

### Keyword Intelligence

- Present keywords (found in resume and JD)
- Missing keywords (filtered to remove stopwords and low-signal terms)
- Keyword impact is weighted and does not inflate scores artificially

### Requirement-Level Breakdown

- Must-have vs Nice-to-have requirements
- Weighted importance scoring
- Evidence extracted from both resume and job description
- Suggestions generated for missing requirements

### AI-Powered Resume Improvements

- Modification Suggestions
  - Original text → Improved text
  - Clear reasoning for each suggestion
  - Accept / Reject decisions per suggestion
  - Individual regeneration of suggestions
- Restructuring Recommendations
  - Section additions, removals, or reordering
  - Severity-based categorization
  - Informational only (non-destructive)

### Resume Regeneration

- Apply only accepted modifications
- Updated resume preview generated deterministically
- Original resume content preserved until explicitly applied

### UI / UX

- Clean, modern interface with dark mode
- Circular progress indicators for scores
- Keyword badges with visual distinction
- Tab-based navigation for clarity
- Smooth animations for feedback and state transitions

---

## Tech Stack

### Frontend

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- React Circular Progressbar

### Backend

- Next.js API Routes (Node runtime)
- Anthropic Claude API (Claude 3.5 Sonnet)
- Zod for schema validation

### Deployment

- AWS Amplify
- Vercel

### Parsing & Utilities

- pdf-parse for PDF extraction
- mammoth for DOCX extraction
- Custom keyword normalization and stopword filtering

### Tooling

- pnpm
- ESLint (Flat config)
- Corepack

---

## Project Structure

```
├── .github
│   └── workflows
│       ├── ci.yml
│       └── ci.yml.save
├── app
│   ├── api
│   │   ├── analyze
│   │   │   └── route.ts
│   │   ├── env-check
│   │   │   └── route.ts
│   │   ├── regenerate-suggestion
│   │   │   └── route.ts
│   │   └── upload
│   │       └── route.ts
│   ├── features
│   │   └── page.tsx
│   ├── apple-icon.svg
│   ├── favicon.ico
│   ├── globals.css
│   ├── icon.svg
│   ├── layout.tsx
│   └── page.tsx
├── public
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src
│   ├── components
│   │   ├── ui
│   │   ├── Footer.tsx
│   │   ├── KeywordBadge.tsx
│   │   ├── ModificationCard.tsx
│   │   ├── Navbar.tsx
│   │   ├── ScoreRing.tsx
│   │   └── Tabs.tsx
│   └── lib
│       ├── anthropic.ts
│       ├── claudeMatch.ts
│       ├── claudeSuggestions.ts
│       ├── loadEnv.ts
│       ├── schemas.ts
│       └── text.ts
├── .gitignore
├── Dockerfile
├── README.md
├── amplify.yml
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
└── tsconfig.json
```

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm
- Anthropic API key

### 1. Clone the Repository

```bash
git clone https://github.com/nishant-k02/ResumeLens.git
cd ResumeLens
```

### 2. Enable pnpm via Corepack

```bash
corepack enable
corepack prepare pnpm@10.26.0 --activate
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4.Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
touch .env.local
```

The following environment variables must be set at runtime:

```
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_MODEL=claude-model
```

### Run Development Server

```bash
pnpm dev
```
