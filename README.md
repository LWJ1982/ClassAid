# Class AId

**AI-Powered Readiness & Learning Assurance Platform**

Class AId is a configurable, text-first readiness platform that helps learners prepare for structured learning activities before entering advanced, instructor-led or practical sessions.

## Key Features

- **Learner Journey**: Dashboard -> Module Overview -> Guided Activity -> AI Coach -> Assessment -> Readiness Report
- **Instructor Dashboard**: Cohort readiness, misconceptions, intervention list
- **Admin Registry**: Module ownership, versions, publication status, audit trail
- **Deterministic Readiness Engine**: Critical-rule override, competency weights, configurable thresholds
- **AI Coach**: Grounded responses with citations (mocked for prototype)
- **Role Switching**: Demo-mode toggle between Learner / Instructor / Admin

## Architecture Principles

1. **AI explains, code decides** — the language model cannot determine readiness status
2. **Critical-rule override** — one safety failure prevents "Ready" regardless of total score
3. **Works without AI** — assessment and reporting function even if Dify is unavailable
4. **Cross-domain** — configurable for any discipline (engineering, sciences, languages, etc.)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Zod (validation)
- Supabase (planned - currently using static fixtures)
- Dify (planned - currently using mocked responses)

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Presentation Slides

The competition slides are available at `/slides.html` when running the dev server.

## Project Structure

```
src/
  app/                    # Next.js App Router entry
  components/
    learner/              # Learner flow components
    instructor/           # Instructor dashboard
    admin/                # Admin registry
    providers.tsx         # App state context
    navigation.tsx        # Role switcher & nav
    main-router.tsx       # View routing by role
  lib/
    domain/types.ts       # Domain type definitions
    engine/               # Deterministic readiness engine
    data/seed.ts          # Seeded demo module data
```

## Demo Module

**Digital Multimeter Fundamentals and Safety**
- 4 Learning Objectives
- 4 Competencies (including 1 Critical: Safety Compliance)
- 7 Guided Activities
- 5 Assessment Questions (2 Critical)
- Readiness threshold: 80%

## License

See [LICENSE](./LICENSE)
