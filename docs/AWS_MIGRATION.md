# AWS Migration Plan

This document outlines the migration path from the current free-tier stack (Cloudflare Pages + Supabase + Groq) to a production AWS stack. This migration is planned for when budget becomes available.

## Architecture Comparison

### Current Stack (Free Tier)

```
Browser
  |
  v
Cloudflare Pages (Static Site + Pages Functions)
  |
  +---> Supabase PostgreSQL (pgvector, Auth, Storage)
  +---> Groq (Llama 3.1 70B)
  +---> Cloudflare Workers AI (BGE-base-en-v1.5 embeddings)
```

### Target Stack (AWS Production)

```
Browser
  |
  v
CloudFront (CDN) --> S3 (Static Site)
  |
  v
API Gateway --> Lambda Functions
  |
  +---> Aurora Serverless v2 (PostgreSQL + pgvector)
  +---> Amazon Bedrock (Claude 3.5 Sonnet)
  +---> Amazon Bedrock (Titan Embeddings)
  +---> Cognito (Auth)
  +---> S3 (File Storage)
  +---> Secrets Manager (API Keys)
```

---

## Service Mapping Table

| Concern | Current Service | AWS Target | Notes |
|---------|----------------|------------|-------|
| Static Hosting | Cloudflare Pages | S3 + CloudFront | Same `out/` directory deployed to S3 |
| API Routes | Cloudflare Pages Functions | API Gateway + Lambda | Same handler logic, different runtime adapter |
| Database | Supabase PostgreSQL | Aurora Serverless v2 (PostgreSQL) | Compatible SQL, same pgvector extension |
| Vector Search | Supabase pgvector | Aurora pgvector | Same extension, same query patterns |
| Authentication | Supabase Auth | Amazon Cognito | JWT-based, similar flow |
| File Storage | Supabase Storage | S3 | Private bucket with signed URLs |
| LLM (Generation) | Groq (Llama 3.1 70B) | Amazon Bedrock (Claude 3.5 Sonnet) | Better reasoning, structured output |
| Embeddings | Cloudflare Workers AI (BGE-base) | Amazon Bedrock (Titan Embeddings) | 1536 dimensions vs 768 - requires re-embedding |
| Secrets | Cloudflare env vars | AWS Secrets Manager | Centralized, rotatable |
| IaC | wrangler.toml | AWS CDK (TypeScript) | Full infrastructure as code |
| Monitoring | Cloudflare Analytics | CloudWatch + X-Ray | Detailed observability |
| DNS/CDN | Cloudflare | Route 53 + CloudFront | Custom domain + caching |

---

## Migration Steps Overview

### Phase 1: Infrastructure Provisioning

1. Deploy CDK stack (see `infrastructure/aws-cdk/`).
2. Provision Aurora Serverless v2 cluster with pgvector extension.
3. Set up Cognito User Pool with email authentication.
4. Create S3 buckets for static hosting and file storage.
5. Configure CloudFront distribution pointing to S3.
6. Set up API Gateway with Lambda integrations.
7. Store secrets in Secrets Manager.

### Phase 2: Database Migration

1. Export Supabase PostgreSQL data using `pg_dump`.
2. Adjust schema for Aurora (minimal changes expected since both are PostgreSQL).
3. Import schema and data into Aurora.
4. Re-generate embeddings with Titan (dimension change: 768 to 1536).
5. Update `source_chunks.embedding` column to `vector(1536)`.
6. Validate data integrity.

### Phase 3: Application Code Adaptation

The application code structure stays identical. Only infrastructure bindings change:

1. **Lambda handlers:** Wrap existing Pages Functions logic with Lambda event adapters. The core logic (validation, Zod schemas, scoring engine) remains unchanged.
2. **Database client:** Replace Supabase client with a direct PostgreSQL client (e.g., `@aws-sdk/client-rds-data` for Data API or `pg` with IAM auth).
3. **Auth client:** Replace `@supabase/supabase-js` auth with Cognito JWT verification.
4. **LLM client:** Replace Groq HTTP calls with Bedrock `InvokeModel` calls. Update prompt format for Claude.
5. **Embedding client:** Replace Workers AI calls with Bedrock Titan Embeddings.
6. **Storage client:** Replace Supabase Storage calls with S3 SDK.

### Phase 4: Testing and Validation

1. Run all unit tests (readiness engine, validation) -- these should pass without changes.
2. Run integration tests against Aurora + Bedrock.
3. Validate auth flows with Cognito.
4. Performance test under expected load.
5. Verify fallback/demo mode still works.

### Phase 5: Cutover

1. Set up Route 53 DNS for custom domain.
2. Configure CloudFront with the domain and SSL certificate (ACM).
3. Deploy static build to S3.
4. Switch DNS from Cloudflare to Route 53.
5. Monitor for errors and performance.
6. Decommission Cloudflare and Supabase resources after validation period.

---

## Cost Estimation Framework

### Fixed Costs (Monthly)

| Service | Estimated Cost | Notes |
|---------|---------------|-------|
| Aurora Serverless v2 | $15-50 | Scales to zero when idle, min 0.5 ACU |
| CloudFront | $1-5 | 1TB free tier first year |
| S3 | $1-3 | Static site + file storage |
| Cognito | $0 | First 50K MAU free |
| Secrets Manager | $1 | Per secret per month |
| API Gateway | $1-5 | First 1M requests free |
| Lambda | $0-5 | First 1M requests free |

### Variable Costs (Per-Use)

| Service | Cost | Notes |
|---------|------|-------|
| Bedrock Claude 3.5 Sonnet | ~$3/1M input tokens, ~$15/1M output tokens | Question generation + coach |
| Bedrock Titan Embeddings | ~$0.02/1M tokens | Document embedding |
| Aurora I/O | $0.20/1M requests | Read/write operations |
| Data Transfer | $0.09/GB | After first 100GB/month |

### Estimated Monthly Total

- **Low usage** (< 100 users, light activity): $20-40/month
- **Medium usage** (100-1000 users): $50-150/month
- **High usage** (1000+ users): $150-500/month

---

## What Stays the Same

The following parts of the codebase remain unchanged during migration:

- **Domain types** (`src/lib/domain/types.ts`) - All type definitions
- **Readiness engine** (`src/lib/engine/readiness-engine.ts`) - Deterministic scoring logic
- **React components** (`src/components/`) - All UI components
- **Validation schemas** - Zod schemas for input validation
- **API client** (`src/lib/api-client.ts`) - Browser-to-API communication
- **Seed data** (`src/lib/data/seed.ts`) - Demo/fallback mode
- **Business rules** - Critical failure handling, competency scoring, approval workflow

The architecture was designed from the start with this migration in mind. The application code talks to typed interfaces, and only the infrastructure binding implementations change.

---

## CDK Scaffold

The `infrastructure/aws-cdk/` directory contains a TypeScript CDK scaffold that outlines the target AWS infrastructure. See `infrastructure/aws-cdk/README.md` for setup instructions.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Embedding dimension change (768 to 1536) | Requires re-embedding all documents | Batch re-embedding script, run before cutover |
| Prompt format differences (Llama vs Claude) | May affect output quality | Test prompts with Claude, adjust system prompts |
| Cognito vs Supabase Auth differences | Session handling changes | Abstract auth behind interface, swap implementation |
| Cold start latency (Lambda) | First request slow | Provisioned concurrency for critical paths |
| Aurora cold start | First connection slow | Minimum capacity setting (0.5 ACU) |

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Aurora Serverless v2 over RDS | Scales to near-zero, pay-per-use, supports pgvector |
| Bedrock over self-hosted | Managed service, no GPU infrastructure to maintain |
| Claude 3.5 Sonnet over Llama on Bedrock | Better structured output, reasoning quality |
| CDK over Terraform | TypeScript consistency with application code |
| API Gateway + Lambda over ECS | Simpler for request/response API, scales to zero |
| Cognito over custom auth | Managed JWT, integrates with API Gateway authorizers |
