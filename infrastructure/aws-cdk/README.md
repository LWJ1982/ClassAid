# Class AId - AWS CDK Infrastructure

This directory contains the AWS CDK (TypeScript) scaffold for the production AWS deployment of Class AId.

## Overview

This CDK project defines the target AWS infrastructure that replaces the current free-tier stack:

| Current | AWS Target |
|---------|-----------|
| Cloudflare Pages | S3 + CloudFront |
| Cloudflare Pages Functions | API Gateway + Lambda |
| Supabase PostgreSQL + pgvector | Aurora Serverless v2 |
| Supabase Auth | Amazon Cognito |
| Supabase Storage | S3 |
| Groq (Llama 3.1 70B) | Amazon Bedrock (Claude 3.5 Sonnet) |
| Cloudflare Workers AI | Amazon Bedrock (Titan Embeddings) |

## Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Node.js 22+](https://nodejs.org/)
- [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html): `npm install -g aws-cdk`
- An AWS account bootstrapped for CDK: `cdk bootstrap aws://ACCOUNT-ID/REGION`

## Setup

```bash
cd infrastructure/aws-cdk
npm install
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npx cdk synth` | Synthesize CloudFormation template |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk deploy` | Deploy the stack to AWS |
| `npx cdk destroy` | Remove the stack from AWS |

## Project Structure

```
infrastructure/aws-cdk/
  bin/
    classaid.ts          # CDK app entry point
  lib/
    classaid-stack.ts    # Main stack with all constructs
  package.json           # CDK dependencies
  tsconfig.json          # TypeScript configuration
  README.md              # This file
```

## Status

This is a **scaffold** for future use. The constructs are placeholder definitions with comments explaining their purpose and what they replace from the current stack. When budget is available, flesh out the constructs with production configuration.

## Deployment Checklist

Before deploying this stack:

1. [ ] Update `bin/classaid.ts` with your AWS account ID and region.
2. [ ] Configure Aurora database password in Secrets Manager.
3. [ ] Set up a custom domain in Route 53 (optional).
4. [ ] Request Bedrock model access for Claude 3.5 Sonnet and Titan Embeddings.
5. [ ] Review and adjust Aurora capacity settings for expected load.
6. [ ] Configure Cognito email templates.
7. [ ] Build and package Lambda functions from `functions/` directory.

## Cost Considerations

See `docs/AWS_MIGRATION.md` for detailed cost estimation. The stack uses serverless/pay-per-use services where possible to minimize idle costs.
