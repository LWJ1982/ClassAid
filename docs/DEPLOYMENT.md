# Class AId Deployment Guide

This guide covers deploying Class AId on the free-tier stack: Cloudflare Pages + Supabase + Groq.

## Prerequisites

You will need accounts on the following services (all have free tiers):

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Cloudflare](https://dash.cloudflare.com/sign-up) | Hosting (Pages) + Embeddings (Workers AI) | 100K requests/day |
| [Supabase](https://supabase.com) | PostgreSQL + Auth + Storage | 500MB DB, 1GB storage |
| [Groq](https://console.groq.com) | LLM (Llama 3.1 70B) | Rate-limited free access |
| [GitHub](https://github.com) | Source repository | Free |

You will also need:
- Node.js 22+ and pnpm 10+ installed locally (for builds)
- Git configured with access to the repository

---

## Step 1: Supabase Project Setup

### 1.1 Create a New Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Choose an organization (or create one).
4. Set a project name (e.g., `classaid`).
5. Set a strong database password (save it securely).
6. Choose a region close to your users.
7. Click **Create new project** and wait for provisioning.

### 1.2 Enable pgvector Extension

In the Supabase SQL Editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.3 Run Database Migrations

Run the following SQL in the Supabase SQL Editor (or via the Supabase CLI). The schema creates all required tables for the platform:

**Core tables created:**
- `users` - User accounts with roles (learner, instructor, admin)
- `domains` - Learning domains with compliance labels
- `modules` - Learning modules with versioning
- `competencies` - Module competencies with weights and thresholds
- `activities` - Guided activities within modules
- `questions` - Assessment and checkpoint questions
- `sources` - Uploaded source documents
- `source_chunks` - Document chunks with vector embeddings (768 dimensions)
- `attempts` - Learner assessment attempts
- `attempt_answers` - Individual answers within attempts
- `results` - Computed readiness results
- `conversations` - AI coach conversations
- `messages` - Conversation messages with citations
- `audit_events` - Append-only audit trail
- `checkpoint_progress` - Activity checkpoint tracking

Copy the migration SQL from `migrations/0001_initial_schema.sql` and run it in the SQL Editor.

If seed data is needed for testing, also run `migrations/0002_seed_demo_data.sql`.

> **Note:** The migrations were originally written for D1 (SQLite). For Supabase (PostgreSQL), replace `TEXT` date columns with `TIMESTAMPTZ DEFAULT now()` and adjust any SQLite-specific syntax as needed.

### 1.4 Enable Email Auth

1. Go to **Authentication > Providers** in the Supabase dashboard.
2. Ensure **Email** provider is enabled.
3. Configure email templates under **Authentication > Email Templates** if desired.
4. Under **Authentication > URL Configuration**, set the Site URL to your deployed Cloudflare Pages URL.

### 1.5 Configure Row-Level Security (RLS)

Enable RLS on all tables. Example policies:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Learners can only read their own attempts
CREATE POLICY "Learners read own attempts"
  ON attempts FOR SELECT
  USING (auth.uid()::text = learner_id);

-- Learners can only read published modules
CREATE POLICY "Learners read published modules"
  ON modules FOR SELECT
  USING (status = 'published');

-- Instructors can manage their own modules
CREATE POLICY "Instructors manage own modules"
  ON modules FOR ALL
  USING (auth.uid()::text = owner_id);
```

Refer to the `security.md` steering file for the complete set of required policies.

---

## Step 2: Groq API Setup

1. Go to [Groq Console](https://console.groq.com).
2. Create an account or log in.
3. Navigate to **API Keys**.
4. Click **Create API Key**.
5. Copy the key and store it securely. You will need it as `GROQ_API_KEY`.

The platform uses Groq's Llama 3.1 70B model for:
- Question generation from uploaded source material
- AI coach responses (RAG-grounded)
- Remediation text generation

---

## Step 3: Cloudflare Pages Setup

### 3.1 Connect GitHub Repository

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages > Create application > Pages**.
3. Click **Connect to Git**.
4. Select the GitHub repository containing Class AId.
5. Configure the build settings:
   - **Framework preset:** None
   - **Build command:** `pnpm run build`
   - **Build output directory:** `out`
   - **Root directory:** `/` (or the repo root)

### 3.2 Set Environment Variables

In the Cloudflare Pages project settings, go to **Settings > Environment variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Production + Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production + Preview (Encrypt) |
| `GROQ_API_KEY` | Your Groq API key | Production + Preview (Encrypt) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL | Production + Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | Production + Preview |

> **Important:** Mark `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` as encrypted. These must never be exposed to the client.

### 3.3 Workers AI Binding

Workers AI is automatically available on Cloudflare Pages projects. The `wrangler.toml` includes the `[ai]` binding configuration. No additional setup is needed for embeddings.

### 3.4 Deploy

After connecting the repository and setting environment variables:
1. Push to `main` to trigger an automatic deployment.
2. Or use the Cloudflare dashboard to trigger a manual deployment.

---

## Step 4: Environment Variables Reference

| Variable | Where Used | Required | Description |
|----------|-----------|----------|-------------|
| `SUPABASE_URL` | Pages Functions (server) | Yes | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Pages Functions (server) | Yes | Service role key for server-side DB access (bypasses RLS) |
| `GROQ_API_KEY` | Pages Functions (server) | Yes | Groq API key for LLM calls |
| `NEXT_PUBLIC_SUPABASE_URL` | Static build (client) | Yes | Same as SUPABASE_URL, embedded in client bundle |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Static build (client) | Yes | Supabase anon key (safe for client, respects RLS) |

### Security Notes

- Variables prefixed with `NEXT_PUBLIC_` are embedded in the static build and visible to users.
- `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are server-side only and must never be prefixed with `NEXT_PUBLIC_`.
- The anon key is safe for the client because Supabase RLS policies restrict access.

---

## Step 5: Supabase Storage Bucket

1. In the Supabase dashboard, go to **Storage**.
2. Click **New bucket**.
3. Name it `source-files`.
4. Set it as a **private** bucket (not public).
5. Configure a storage policy to allow authenticated instructors to upload:

```sql
CREATE POLICY "Instructors can upload source files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'source-files'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Instructors can read source files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'source-files');
```

---

## Step 6: Post-Deployment Verification

After deployment, verify each component:

- [ ] **Static site loads:** Visit your `*.pages.dev` URL and confirm the page renders.
- [ ] **Authentication works:** Try signing up with email. Check Supabase Auth dashboard for the new user.
- [ ] **API functions respond:** Call `/api/modules` and verify a JSON response (even if empty).
- [ ] **Demo mode works:** The app should function in demo/fallback mode even without Supabase connection (using local seed data).
- [ ] **Workers AI binding:** Upload a test document and verify embeddings are generated (check `source_chunks` table for vectors).
- [ ] **Groq integration:** Trigger question generation and verify the AI returns structured content.
- [ ] **RLS policies:** Attempt to access another user's data via the client and confirm it is blocked.

---

## Troubleshooting

### Build fails on Cloudflare Pages

- Ensure the build command is exactly `pnpm run build` (not `npm run build`).
- Ensure output directory is `out`.
- Check that `NEXT_PUBLIC_*` variables are set for the build environment (they are needed at build time, not just runtime).

### "Invalid API key" errors from Groq

- Verify `GROQ_API_KEY` is set in Cloudflare Pages environment variables.
- Check the key has not been revoked in the Groq console.
- Ensure it is NOT prefixed with `NEXT_PUBLIC_`.

### Supabase connection refused

- Confirm `SUPABASE_URL` is the full project URL (e.g., `https://abcdefgh.supabase.co`).
- Ensure the project is not paused (free-tier projects pause after 1 week of inactivity).
- Check that RLS policies do not block the operation you are testing.

### Workers AI returns errors

- Workers AI requires a Cloudflare Pages deployment (not available in local dev).
- For local development, mock the AI binding or skip embedding generation.

### Auth redirect issues

- Set the correct Site URL in Supabase Authentication settings.
- Ensure the `NEXT_PUBLIC_SUPABASE_URL` matches the actual Supabase project URL.

### Static export issues

- Next.js static export does not support API routes in `pages/api/`. All API logic must be in `functions/` (Cloudflare Pages Functions).
- Dynamic routes must use `generateStaticParams()` or fallback to client-side routing.

### Demo mode

The application includes a fallback demo mode that works without any external services. If Supabase or Groq are unavailable, the app uses local seed data. This is useful for development and testing.
