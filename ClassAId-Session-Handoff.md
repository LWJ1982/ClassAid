# Class AId — Session Handoff Document

**Prepared:** 05 August 2026  
**Purpose:** Complete context for a new development session to continue building the Class AId MVP  
**Repository:** github.com/LWJ1982/ClassAid (main branch)

---

## 1. Product Definition

**Name:** Class AId  
**Type:** Configurable, text-first readiness and learning-assurance platform  
**Competition:** AI-Powered Virtual Laboratory Coach  
**Scope:** Cross-domain — works for any structured learning activity (engineering labs, sciences, languages, cybersecurity, professional training, business simulations)

### One-Liner

Class AId confirms learners understand foundational concepts, procedures, and safety requirements before entering advanced, instructor-led, or practical sessions.

### Core Problem

Providing manuals, videos, and learning resources does not confirm that learners actually understand the material. Instructors discover gaps during sessions — too late to fix. Time is wasted repeating fundamentals instead of focusing on advanced teaching.

### Core Rule

**"AI explains, code decides."**

- AI (Groq/LLM) handles: retrieval, grounded explanation, hints, citations, remediation wording, question generation
- Application code handles: correct answers, scoring, critical rules, readiness status, access control, persistence
- A safety-critical failure prevents "Ready" status regardless of overall score — deterministic, never AI-determined

---

## 2. Three User Roles

| Role | Journey |
|------|---------|
| **Learner** | Dashboard → Module Overview → Guided Activity (adaptive: min read time + checkpoint gates + auto-loop on failure) → AI Coach (RAG with cited sources) → Assessment (server-scored, critical rules) → Readiness Report |
| **Instructor** | Upload source files → AI auto-generates questions → Approve/reject/edit → Configure thresholds/weights/critical flags → View cohort insights, misconceptions, step friction, intervention list |
| **Admin** | Module registry, ownership, versions, publication status, governance warnings, audit trail |

---

## 3. Confirmed Tech Stack (Zero Budget)

| Layer | Service | Free Tier Limits |
|-------|---------|-----------------|
| Hosting | Cloudflare Pages | Unlimited bandwidth, 500 builds/month |
| API Routes | Cloudflare Pages Functions | Included with Pages |
| Database | Supabase PostgreSQL | 500MB, unlimited API requests |
| Vector Search | Supabase pgvector | Included with database |
| Auth | Supabase Auth | Unlimited users, email/password + roles |
| File Storage | Supabase Storage | 1GB |
| AI Generation | Groq (Llama 3.1 70B) | 30 RPM, 14,400 requests/day |
| Embeddings | Cloudflare Workers AI (BGE-base-en-v1.5) | 10K neurons/day |
| Validation | Zod | N/A |
| Frontend | Next.js 15.5.2, TypeScript strict, Tailwind CSS, React 18 | N/A |

**Total monthly cost: $0**

---

## 4. Architecture

```
Browser (Learner / Instructor / Admin)
    │
    ▼
Cloudflare Pages (Static Next.js export)
    │
    ├── Pages Functions (/api/*)
    │       │
    │       ├── Supabase (PostgreSQL + pgvector + Auth + Storage)
    │       │     • Modules, competencies, questions, attempts, results
    │       │     • Vector embeddings for RAG search
    │       │     • User authentication and role-based access
    │       │     • Uploaded source documents
    │       │
    │       ├── Groq API (Llama 3.1 70B)
    │       │     • AI Coach responses (RAG generation)
    │       │     • Question auto-generation (structured JSON output)
    │       │
    │       └── Cloudflare Workers AI (BGE-base)
    │             • Document chunk embeddings on upload
    │
    └── Deterministic Readiness Engine (TypeScript, client+server)
          • Competency weights, thresholds, critical-rule override
          • Scoring logic — AI cannot affect this
```

---

## 5. Key Features

| Feature | Description |
|---------|-------------|
| **Adaptive Learning** | Min read time per step, comprehension checkpoint gates, wrong answer = forced re-read with hint, retry tracking |
| **AI Question Generation** | System generates questions from uploaded content via Groq, stored as pending until instructor approves |
| **Instructor Approval Workflow** | Review, approve, reject, edit auto-generated questions |
| **RAG Chatbot with Citations** | Embed query → pgvector search → retrieve chunks with metadata → Groq generates answer → citations from chunk metadata (source, section, page) |
| **Deterministic Readiness Engine** | Competency weights, per-competency thresholds, critical-rule override, configurable overall threshold (default 80%) |
| **Module Configuration** | Instructor adjusts: threshold, weights, mandatory/critical flags, activity content |
| **File Upload Pipeline** | Upload → Supabase Storage → extract text → chunk → embed via Workers AI → store in pgvector |
| **Cohort Insights** | Readiness distribution, competency averages, step friction, misconceptions, intervention list |

---

## 6. Existing Repository State

**GitHub:** `LWJ1982/ClassAid` (main branch)

### What's Already Built

- Complete frontend (all 3 roles, adaptive learning, all UI components)
- Deterministic readiness engine (TypeScript)
- Seeded demo module (Digital Multimeter Fundamentals and Safety)
- Cloudflare Pages Functions (API routes for chat, upload, generate, assessments, modules, checkpoints, insights)
- D1 database migrations (to be converted to Supabase schema)
- localStorage persistence (fallback when no database)
- Presentation slides (`/slides.html`) and user guide (`/guide.html`)
- Working `npm run build:cf` for static export
- Demo reset button

### Key Directories

```
src/
  app/page.tsx                    — Main entry (client-side SPA)
  components/
    learner/                      — Dashboard, overview, activity, coach, assessment, report
    instructor/                   — Dashboard, module-config, checkpoint-approval, content-management
    admin/                        — Registry
    providers.tsx                 — App state context
    main-router.tsx               — View routing by role
    navigation.tsx                — Role switcher + reset
  lib/
    domain/types.ts               — All TypeScript types
    engine/readiness-engine.ts    — Deterministic scoring logic
    data/seed.ts                  — Seeded demo data
    api-client.ts                 — Frontend API client
    cloudflare.ts                 — Cloudflare binding types
    persistence.ts                — localStorage helper
functions/
  api/                            — Cloudflare Pages Functions (7 routes)
migrations/
  0001_initial_schema.sql         — 14 tables (convert to Supabase)
  0002_seed_demo_data.sql         — Demo data
public/
  slides.html                     — Presentation (2 slides)
  guide.html                      — User guide (Learner/Instructor/Admin)
```

---

## 7. What the New Session Must Build

| # | Task | Description |
|---|------|-------------|
| 1 | **Supabase project setup** | Create project, configure schema from migrations, set up RLS policies, configure Auth |
| 2 | **Integrate Supabase client** | Replace localStorage with Supabase JS client for real persistence |
| 3 | **Integrate Groq** | Replace mocked AI with real Llama 3.1 70B for coach + question generation |
| 4 | **Integrate Workers AI embeddings** | BGE-base embeddings on file upload, store in pgvector |
| 5 | **Integrate Supabase pgvector** | Vector search for RAG (similarity query filtered by module_id) |
| 6 | **Wire Supabase Auth** | Replace demo role switcher with real login/signup/roles |
| 7 | **Deploy end-to-end** | Cloudflare Pages + Functions → Supabase + Groq |
| 8 | **Document AWS CDK path** | IaC scaffold for future migration when budget available |

---

## 8. Accounts Required

| Account | URL | Action |
|---------|-----|--------|
| **Supabase** | https://supabase.com | Sign up free → Create project → Get URL + anon key + service role key |
| **Groq** | https://console.groq.com | Sign up free → Get API key (no credit card needed) |
| **Cloudflare** | https://dash.cloudflare.com | Already exists — "classaid" Pages project created |
| **GitHub** | github.com/LWJ1982/ClassAid | Already exists |

---

## 9. Seeded Demo Module

**Title:** Digital Multimeter Fundamentals and Safety

- **4 Competencies:** Measurement Theory (25%), Connection Procedures (30%), Safety Compliance (30% — CRITICAL), Error Awareness (15%)
- **7 Guided Activities** with adaptive comprehension checkpoints
- **5 Assessment Questions** (2 critical — safety-related)
- **7 Approved checkpoint questions** + 2 pending instructor approval
- **Overall threshold:** 80% (configurable by instructor)
- **Fallback:** Mock coach responses work without any AI connection

---

## 10. Design Decisions (Confirmed)

1. Supabase for database + auth + vector + storage (all-in-one, free)
2. Groq for AI generation (Llama 3.1 70B — free, high quality)
3. Cloudflare Workers AI for embeddings only (BGE-base, 768-dim)
4. Cloudflare Pages for hosting + API functions
5. Fresh infrastructure build, same product concept and frontend
6. AWS CDK documented for future migration (when budget becomes available)
7. Static export from Next.js (works on Windows)
8. Zero monthly cost — all services within free tiers

---

## 11. Competition Context

- **Deadline:** Submission of slides + working prototype
- **Format:** 10-minute finalist presentation + live demo
- **Slides:** 2-page deck at `/slides.html`
- **User Guide:** At `/guide.html` (tabbed: Learner/Instructor/Admin)
- **Demo must show:** Critical failure preventing Ready, AI coach with citations, instructor insights, adaptive learning checkpoint
- **Demo script:** Under 6 minutes — Learner flow → Instructor config/insights → Admin registry

---

## 12. Steering Files Purpose

The following `.kiro/steering/` files provide persistent context to every Kiro task in the new session. They ensure the agent:

- Understands the product boundaries (what AI can and cannot do)
- Follows the correct architecture (Supabase + Groq + Cloudflare)
- Maintains security standards (secrets server-side, scoring deterministic)
- Uses consistent coding standards (TypeScript strict, small modules, interfaces)
- Tests the right things (scoring boundaries, critical rules, AI fallback)
- Stays cross-domain (no hardcoded lab assumptions)

**Files created:**
- `product.md` — Product definition, outcomes, user layers, boundaries
- `architecture.md` — Stack, component responsibilities, trust boundaries
- `ai-boundaries.md` — What AI may/must not do, grounding rules, citation requirements
- `security.md` — Secrets, access control, input validation, data handling
- `domain-model.md` — Entities, readiness statuses, minimum fields
- `coding-standards.md` — TypeScript conventions, module structure, testing approach
- `testing.md` — Required test areas, definition of done

---

## 13. Future AWS Migration (When Budget Available)

When budget allows, migrate to:
- Aurora Serverless v2 (PostgreSQL + pgvector) — replaces Supabase DB
- Bedrock Claude 3.5 Sonnet — replaces Groq
- Bedrock Titan Embeddings — replaces Workers AI
- CloudFront + S3 — replaces Cloudflare Pages
- API Gateway + Lambda — replaces Pages Functions
- Cognito — replaces Supabase Auth
- CDK (TypeScript) for full IaC

The application code structure remains identical — only the infrastructure bindings change.

---

*End of handoff document.*
