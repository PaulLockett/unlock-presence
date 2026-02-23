# PRE-1: Requirements & Detailed Design

## Digital Presence Operating System

**Activity:** X-01 | **Status:** In Progress | **Phase:** 1 — Foundation + Identity
**Linear Issue:** PRE-1 | **Critical Path:** Yes (Float: 0.0)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
   - [1.0 Vision, Objectives & Mission Statement](#10-vision-objectives--mission-statement)
   - [1.1 Volatility Identification](#11-volatility-identification)
   - [1.2 Overview](#12-overview)
2. [Service Architecture & Monorepo Structure](#2-service-architecture--monorepo-structure)
3. [Temporal Architecture](#3-temporal-architecture)
4. [API & Contract Design](#4-api--contract-design)
5. [Auth & RBAC Model](#5-auth--rbac-model)
6. [Data Model (R1-R5)](#6-data-model-r1-r5)
7. [Platform Integration](#7-platform-integration)
8. [Developer Experience](#8-developer-experience)
9. [Cross-Cutting Concerns](#9-cross-cutting-concerns)
10. [Testing, Observability & Operational Readiness](#10-testing-observability--operational-readiness)
11. [Acceptance Criteria Checklist](#11-acceptance-criteria-checklist)

---

## 1. Executive Summary

### 1.0 Vision, Objectives & Mission Statement

**Vision:** Enable any brand operator — regardless of marketing expertise — to maintain a consistent, strategic, high-performing digital presence across all platforms, with AI handling the craft of content creation while the human retains strategic control.

**Objectives:**
1. Reduce time-to-publish from hours/days to minutes through AI-assisted content production
2. Ensure brand voice consistency across all channels via a learnable, evolvable identity model
3. Progressively graduate operational workflows from human-supervised to autonomous as performance earns trust
4. Provide actionable performance insights that close the feedback loop between creation and learning
5. Support multi-tenant, multi-brand operation from a single platform instance

**Mission Statement:** Build a system of composable building blocks — Engines for domain reasoning, ResourceAccess for storage mediation, Managers for sequence orchestration — that combine to operate brand presences autonomously, evolve identity through accumulated feedback, and graduate workflows as empirical performance proves readiness. The architecture decomposes by volatility, not function: each component encapsulates an area of likely change and can be modified independently without rippling through the system.

### 1.1 Volatility Identification

Each component in this architecture was selected because it encapsulates a distinct area of change. The table below maps each core building block to its primary volatility and assesses it across the two axes from Righting Software (Chapter 2): whether the same customer will need changes over time, and whether different customers need different behavior at the same time.

| Component | Encapsulated Volatility | Same Customer Over Time | Same Time Across Customers |
|-----------|------------------------|------------------------|---------------------------|
| **E1: Content Engine** | Content production rules, quality criteria, platform format constraints | High — quality standards evolve with feedback | High — each brand needs different content styles |
| **E2: Identity Engine** | Brand identity representation and evolution methodology | High — identity deepens as signals accumulate | High — every brand has a unique voice |
| **E3: Analytics Engine** | Performance measurement, statistical methods, metric definitions | High — platform metrics change without notice | Moderate — measurement methods similar but KPIs differ |
| **E4: Knowledge Engine** | Strategic reasoning frameworks, trend analysis, knowledge synthesis | High — strategy evolves with market conditions | High — different domains need different frameworks |
| **RA1: Channel Access** | Platform API contracts, auth flows, rate limits, data formats | High — platforms deprecate and change APIs frequently | High — each platform has entirely different APIs |
| **RA2: Service Access** | External service contracts (billing, deployment providers) | Moderate — vendor APIs evolve | Low — billing/deploy patterns consistent across tenants |
| **RA3: Content Process Artifact Access** | Content lifecycle storage patterns (versioning, annotations, task coordination) for R1-R3 | Moderate — storage patterns evolve with feature growth | Low — storage access patterns are tenant-agnostic |
| **RA4: Perf & Knowledge Artifact Access** | Analytics/knowledge storage patterns (time-series, embeddings, aggregation) for R4-R5 | Moderate — query patterns evolve as analytics deepen | Low — analytics storage patterns consistent |
| **M1: Presence Manager** | Content workflow sequences — which Engines run in what order, approval gates | High — workflows graduate and sequences change | Moderate — workflow sequences similar but configurable |
| **M2: Process Manager** | Automation execution patterns — when to run, how to monitor, when to degrade | High — automation confidence grows over time | Moderate — automation patterns similar across brands |
| **M3: Tenant Manager** | Account lifecycle sequences — onboarding, billing, team management | Moderate — business model may evolve | Low — account management consistent across tenants |
| **C1: Task Interface** | Operator interaction patterns — task presentation, review workflows | High — UX evolves with user feedback | Moderate — operators have different workflow preferences |
| **C2: Admin Portal** | Administration interaction patterns — configuration, monitoring | Moderate — admin needs grow with features | Low — admin patterns largely consistent |
| **C3: API Gateway** | External integration contracts — webhook formats, REST surface, rate policies | High — integration needs grow as platform adopts partners | Moderate — different integrations need different endpoints |
| **I1: Message Bus** | Real-time delivery mechanism — SSE protocol, channel management, pub/sub | Low — delivery mechanism is stable once chosen | Low — real-time delivery consistent across tenants |

**Validation:** Every component maps to a volatility (not a function). No component is named after what it does — each is named after what might change. The 3 Core Use Cases (Operate a Presence, Evolve Understanding, Graduate Workflow) are satisfied by different combinations of the same ~15 building blocks, confirming composable design.

### 1.2 Overview

This document formalizes the detailed design for the Digital Presence Operating System — an AI-powered autonomous agent platform for managing social media presences across multiple brands and channels. It translates 23 use case documents (with Mermaid sequence diagrams) into buildable contracts: service boundaries, Temporal workflow/activity definitions, API schemas, data models, testing/observability specifications, and developer experience specifications. The architecture contains 26 components across 4 layers + utilities: 3 Clients, 1 Infrastructure service, 3 Managers, 4 Engines, 4 ResourceAccess components, 5 Resources, and 6 Utilities (U1-U6). Utilities include Auth, Scheduling, Logging, Notification, AI (Vercel AI SDK via OpenRouter), and Conversation (Honcho SDK for conversational memory).

### Key Architecture Decisions (Resolved)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Orchestration | **Temporal Cloud** | Managers = Workflows, Engines/RA = Activities. Durable, observable, debuggable. |
| ORM | **Drizzle ORM** | Lightweight, TypeScript-native, explicit SQL control for RLS |
| Database | **Supabase PostgreSQL + pgvector** | Managed, branching per PR, RLS built-in, vector search |
| Blob Storage | **Supabase Object Storage** | Co-located with DB, no separate S3 config |
| AI Integration | **Vercel AI SDK + OpenRouter** | Unified model interface, provider-agnostic |
| Message Bus (I1) | **Thin REST/SSE layer** | Temporal handles durable orchestration; I1 is just real-time client updates |
| Cache / Rate Limit | **Upstash Redis** | Serverless Redis, no infra management |
| Frontend | **Next.js on Vercel** | PR preview deploys, SSR, App Router |
| App Hosting | **Railway** | Separate services, internal networking, PR environments |
| Platforms v1 | **X, LinkedIn, Substack** | Native APIs for full control |
| AI Models v1 | **Single model via OpenRouter** | Baseline, experiment later |
| Monorepo | **pnpm workspaces + Turborepo** | Task orchestration, caching, works with Temporal Cloud |

---

## 2. Service Architecture & Monorepo Structure

### 2.1 Monorepo Directory Layout

```
presence-os/
│
├── apps/                                 # Deployable frontend applications
│   ├── task-ui/                          # C1: Task Interface
│   │   ├── src/
│   │   │   ├── app/                      #   Next.js App Router
│   │   │   ├── components/               #   UI components
│   │   │   ├── hooks/                    #   React hooks (SSE, auth, etc.)
│   │   │   └── lib/                      #   Client-side utilities
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── vercel.json
│   │
│   ├── admin-portal/                     # C2: Admin Portal
│   │   ├── src/
│   │   │   ├── app/                      #   Next.js App Router
│   │   │   ├── components/               #   Admin-specific UI
│   │   │   └── lib/                      #   Client-side utilities
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── vercel.json
│   │
│   └── api-gateway/                      # C3: API Gateway
│       ├── src/
│       │   ├── routes/                   #   Route handlers (webhooks, REST API)
│       │   ├── middleware/               #   Auth, rate limiting, validation
│       │   └── index.ts                  #   Hono server entry
│       ├── package.json
│       └── railway.json
│
├── workers/                              # Deployable Temporal worker services
│   ├── presence/                         # Presence subsystem worker
│   │   ├── src/
│   │   │   ├── worker.ts                 #   Worker entry: registers M1 workflows + activities
│   │   │   └── config.ts                 #   Task queue, connection config
│   │   ├── package.json
│   │   └── railway.json
│   │
│   ├── automation/                       # Automation subsystem worker
│   │   ├── src/
│   │   │   ├── worker.ts                 #   Worker entry: registers M2 workflows + activities
│   │   │   └── config.ts
│   │   ├── package.json
│   │   └── railway.json
│   │
│   ├── account/                          # Account subsystem worker
│   │   ├── src/
│   │   │   ├── worker.ts                 #   Worker entry: registers M3 workflows + activities
│   │   │   └── config.ts
│   │   ├── package.json
│   │   └── railway.json
│   │
│   └── realtime/                         # I1: Real-time SSE server
│       ├── src/
│       │   ├── sse.ts                    #   SSE endpoint handlers
│       │   ├── channels.ts              #   Channel subscription management
│       │   └── index.ts                  #   Hono server entry
│       ├── package.json
│       └── railway.json
│
├── packages/                             # Shared libraries (not independently deployed)
│   ├── temporal-workflows/               # Temporal workflow definitions (V8 sandbox)
│   │   ├── src/
│   │   │   ├── presence/                 #   M1: Presence Manager workflows
│   │   │   │   ├── operate.workflow.ts
│   │   │   │   ├── evolve.workflow.ts
│   │   │   │   ├── content-approval.workflow.ts
│   │   │   │   ├── campaign.workflow.ts
│   │   │   │   ├── engagement.workflow.ts
│   │   │   │   ├── growth-tasks.workflow.ts
│   │   │   │   ├── voice-discovery.workflow.ts
│   │   │   │   ├── multi-brand-batch.workflow.ts
│   │   │   │   ├── microsite.workflow.ts
│   │   │   │   ├── ab-test.workflow.ts
│   │   │   │   ├── user-correction.workflow.ts
│   │   │   │   ├── cross-brand-transfer.workflow.ts
│   │   │   │   ├── workflow-creation.workflow.ts
│   │   │   │   └── index.ts
│   │   │   ├── automation/               #   M2: Process Manager workflows
│   │   │   │   ├── execute.workflow.ts
│   │   │   │   ├── monitor.workflow.ts
│   │   │   │   ├── degrade.workflow.ts
│   │   │   │   └── index.ts
│   │   │   ├── account/                  #   M3: Tenant Manager workflows
│   │   │   │   ├── onboard.workflow.ts
│   │   │   │   ├── configure-brand.workflow.ts
│   │   │   │   ├── billing.workflow.ts
│   │   │   │   ├── team.workflow.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts                  #   Root export
│   │   └── package.json
│   │
│   ├── temporal-activities/              # Temporal activity implementations (Node.js)
│   │   ├── src/
│   │   │   ├── engines/                  #   E1-E4 Engine activities
│   │   │   │   ├── content.activities.ts       # E1: Content Engine
│   │   │   │   ├── identity.activities.ts      # E2: Identity Engine
│   │   │   │   ├── analytics.activities.ts     # E3: Analytics Engine
│   │   │   │   ├── knowledge.activities.ts     # E4: Knowledge Engine
│   │   │   │   └── index.ts
│   │   │   ├── resource-access/          #   RA1-RA4 ResourceAccess activities
│   │   │   │   ├── channel.activities.ts            # RA1: Channel Access
│   │   │   │   ├── service.activities.ts            # RA2: Service Access
│   │   │   │   ├── content-process.activities.ts    # RA3: Content Process Artifact Access (R1-R3)
│   │   │   │   ├── perf-knowledge.activities.ts     # RA4: Performance & Knowledge Artifact Access (R4-R5)
│   │   │   │   └── index.ts
│   │   │   ├── utilities/                #   U1-U4 as activities
│   │   │   │   ├── notification.activities.ts  # U4: Notification
│   │   │   │   └── index.ts
│   │   │   └── index.ts                  #   Root export (all activities)
│   │   └── package.json
│   │
│   ├── db/                               # Database layer
│   │   ├── src/
│   │   │   ├── schema/                   #   Drizzle schema definitions
│   │   │   │   ├── brand.ts              #     R1: Brand Store tables
│   │   │   │   ├── content.ts            #     R2: Content Store tables
│   │   │   │   ├── task.ts               #     R3: Task Store tables
│   │   │   │   ├── knowledge.ts          #     R4: Knowledge Store tables
│   │   │   │   ├── performance.ts        #     R5: Performance Store tables
│   │   │   │   ├── tenant.ts             #     Tenant + auth tables
│   │   │   │   └── index.ts              #     Aggregated schema export
│   │   │   ├── client.ts                 #   Drizzle client initialization
│   │   │   ├── rls.ts                    #   RLS policy helpers
│   │   │   └── migrate.ts               #   Migration runner
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   │
│   ├── schemas/                          # Zod schemas (shared types)
│   │   ├── src/
│   │   │   ├── brand.schemas.ts          #   Brand-related types
│   │   │   ├── content.schemas.ts        #   Content lifecycle types
│   │   │   ├── task.schemas.ts           #   Task queue types
│   │   │   ├── knowledge.schemas.ts      #   Knowledge framework types
│   │   │   ├── performance.schemas.ts    #   Analytics/performance types
│   │   │   ├── auth.schemas.ts           #   Auth/RBAC types
│   │   │   ├── events.schemas.ts         #   SSE event payloads
│   │   │   ├── temporal.schemas.ts       #   Workflow/activity input/output types
│   │   │   ├── platform.schemas.ts       #   Platform-specific types (X, LinkedIn, Substack)
│   │   │   ├── api.schemas.ts            #   API request/response types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── auth/                             # U1: Auth utilities
│   │   ├── src/
│   │   │   ├── supabase.ts               #   Supabase Auth client
│   │   │   ├── jwt.ts                    #   JWT utilities (decode, validate)
│   │   │   ├── rbac.ts                   #   Role-based access control helpers
│   │   │   ├── middleware.ts             #   Auth middleware for Hono
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── temporal-client/                  # Temporal client utilities
│   │   ├── src/
│   │   │   ├── connection.ts             #   Connection factory (local vs. Cloud)
│   │   │   ├── client.ts                 #   Workflow client helpers
│   │   │   ├── schedules.ts              #   U2: Schedule management
│   │   │   ├── task-queues.ts            #   Task queue name constants
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ui/                               # Shared UI library
│   │   ├── src/
│   │   │   ├── components/               #   Reusable components (Shadcn-based)
│   │   │   ├── hooks/                    #   Shared React hooks
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── ai/                               # U5: AI Utility
│   │   ├── src/
│   │   │   ├── complete.ts              #   Text completion (Vercel AI SDK + OpenRouter)
│   │   │   ├── structure.ts             #   Structured output (schema-constrained generation)
│   │   │   ├── embed.ts                 #   Embedding generation (text-embedding-3-small)
│   │   │   ├── providers.ts             #   OpenRouter provider configuration
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── testing/                          # Shared test utilities and fixtures
│   │   ├── fixtures/
│   │   │   ├── ai/                      #   Deterministic AI response fixtures
│   │   │   ├── platforms/               #   Mock platform API responses
│   │   │   └── billing/                 #   Mock Stripe webhook payloads
│   │   ├── factories/                   #   Test data factories (TypeScript)
│   │   ├── helpers/                     #   Temporal test env, Supabase helpers, auth
│   │   └── package.json
│   │
│   └── config/                           # Shared configurations
│       ├── eslint/
│       ├── tsconfig/
│       └── tailwind/
│
├── tests/                                # System-level tests (not in packages)
│   ├── e2e/                             #   End-to-end use case tests
│   └── load/                            #   k6 load test scenarios
│       ├── scenarios/
│       ├── helpers/
│       └── thresholds.json
│
├── supabase/                             # Supabase project config
│   ├── config.toml                       #   Supabase project settings
│   ├── migrations/                       #   SQL migrations (generated by Drizzle)
│   ├── seed.sql                          #   Development seed data
│   └── functions/                        #   Supabase Edge Functions (if needed)
│
├── .devcontainer/                        # Dev container specification
│   ├── devcontainer.json
│   ├── docker-compose.yml                #   Full local dev stack
│   └── post-create.sh                    #   Setup script
│
├── .github/
│   └── workflows/
│       ├── ci.yml                        #   Test + lint on every push
│       ├── preview.yml                   #   PR preview environment orchestration
│       └── deploy.yml                    #   Production deploy on main merge
│
├── pnpm-workspace.yaml
├── turbo.json                            #   Turborepo pipeline config
├── package.json                          #   Root package.json
└── tsconfig.base.json                    #   Base TypeScript config
```

### 2.2 Package Dependency Graph

```
apps/task-ui          → packages/schemas, packages/auth, packages/ui, packages/temporal-client
apps/admin-portal     → packages/schemas, packages/auth, packages/ui, packages/temporal-client
apps/api-gateway      → packages/schemas, packages/auth, packages/temporal-client

workers/presence      → packages/temporal-workflows, packages/temporal-activities, packages/db, packages/schemas
workers/automation    → packages/temporal-workflows, packages/temporal-activities, packages/db, packages/schemas
workers/account       → packages/temporal-workflows, packages/temporal-activities, packages/db, packages/schemas
workers/realtime      → packages/schemas, packages/auth, packages/db

packages/temporal-workflows   → packages/schemas (types only — V8 sandbox, no runtime deps)
packages/temporal-activities  → packages/db, packages/schemas, packages/auth, packages/ai
packages/db                   → packages/schemas
packages/auth                 → packages/schemas
packages/ai                   → packages/schemas (U5: AI Utility, Vercel AI SDK + OpenRouter)
packages/temporal-client      → packages/schemas
packages/testing              → packages/schemas, packages/db, packages/auth, packages/ai
```

### 2.3 Railway Service Topology

Each service is a separate Railway deployment in the same project, communicating via Railway's internal private network.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Railway Project: presence-os                                        │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ api-gateway      │  │ realtime         │  │ presence-worker  │  │
│  │ (C3)             │  │ (I1)             │  │ (M1 workflows)   │  │
│  │                  │  │                  │  │                  │  │
│  │ Public domain    │  │ Public domain    │  │ Internal only    │  │
│  │ Port: 8000       │  │ Port: 8001       │  │ Long-running     │  │
│  │ Hono server      │  │ SSE endpoints    │  │ Temporal worker  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ automation-worker │  │ account-worker   │                        │
│  │ (M2 workflows)   │  │ (M3 workflows)   │                        │
│  │                  │  │                  │                        │
│  │ Internal only    │  │ Internal only    │                        │
│  │ Long-running     │  │ Long-running     │                        │
│  │ Temporal worker  │  │ Temporal worker  │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                                                                      │
│  Shared via Railway reference variables:                             │
│   • TEMPORAL_ADDRESS  → Temporal Cloud endpoint                      │
│   • DATABASE_URL      → Supabase PostgreSQL connection               │
│   • REDIS_URL         → Upstash Redis connection                     │
│   • SUPABASE_URL      → Supabase API endpoint                       │
│   • OPENROUTER_API_KEY → OpenRouter model access                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Vercel: presence-os-frontends                                       │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │ task-ui          │  │ admin-portal     │                        │
│  │ (C1)             │  │ (C2)             │                        │
│  │                  │  │                  │                        │
│  │ app.presence.io  │  │ admin.presence.io│                        │
│  │ Next.js SSR      │  │ Next.js SSR      │                        │
│  │ PR previews      │  │ PR previews      │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Service Communication Patterns

| From | To | Mechanism | Route |
|------|----|-----------|-------|
| C1/C2 (Vercel) → Temporal | Start workflow, query, signal | HTTPS → API Gateway → Temporal Client | Vercel → Railway api-gateway → Temporal Cloud |
| C1/C2 → Real-time updates | SSE subscription | HTTPS → Realtime service | Vercel → Railway realtime (public domain) |
| API Gateway → Temporal | Start workflow on webhook | Temporal Client SDK | Railway internal → Temporal Cloud |
| Workers → Temporal Cloud | Poll for tasks, complete | gRPC (Temporal SDK) | Railway → Temporal Cloud |
| Workers → Supabase | Database queries | PostgreSQL connection | Railway → Supabase (connection pooler) |
| Workers → Upstash Redis | Cache, rate limit | Redis protocol over TLS | Railway → Upstash endpoint |
| Workers → OpenRouter | AI model calls | HTTPS | Railway → OpenRouter API |
| Workers → Honcho | Conversation memory | HTTPS | Railway → Honcho API |
| Workers → Platform APIs | Publish, pull analytics | HTTPS | Railway → X/LinkedIn/Substack |
| Realtime → Upstash Redis | Pub/sub for SSE events | Redis Pub/Sub | Railway internal → Upstash |

### 2.5 pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'workers/*'
  - 'packages/*'
```

### 2.6 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "node_modules/.cache/turbo/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

---

## 3. Temporal Architecture

### 3.1 Core Mapping: Architecture → Temporal

| Architecture Layer | Temporal Concept | Deployment |
|--------------------|------------------|------------|
| **Managers** (M1, M2, M3) | Temporal Workflows | Registered on subsystem workers |
| **Engines** (E1-E4) | Temporal Activities | Registered on subsystem workers |
| **ResourceAccess** (RA1-RA4) | Temporal Activities | Registered on subsystem workers |
| **Utilities** (U2: Scheduling) | Temporal Schedules | Managed via Temporal Client |
| **Utilities** (U4: Notification) | Temporal Activity | Registered on all workers |
| **Utilities** (U5: AI) | Library (not Temporal) | Imported directly by activities |
| **Utilities** (U6: Conversation) | Library (not Temporal) | Imported directly by activities |
| **Manager → Manager** (QUEUED) | Child Workflows or Signals | Cross-queue via workflow ID |
| **I1: Message Bus** | Thin SSE layer (NOT Temporal) | Separate Railway service |

### 3.2 Task Queues

The system uses three Temporal task queues, each aligned with a subsystem boundary. The **presence queue** handles M1 workflows and all Engine and ResourceAccess activities needed by the Presence subsystem. The **automation queue** handles M2 workflows and the Engine/RA activities needed for workflow graduation, schedule management, and experiment conclusion. The **account queue** handles M3 workflows and the RA2/RA3/RA4 activities needed for onboarding, billing, and team management.

Engine and ResourceAccess activities are registered on each subsystem's worker because they are stateless and need to be callable from that subsystem's workflows. This replicates activity code across workers but avoids cross-queue latency for the common execution path. If activity scaling becomes a bottleneck, a dedicated activity queue can be introduced later without architectural changes — only worker registration configuration would change.


### 3.3 Workflow Definitions (Managers)

#### M1: Presence Manager Workflows

| Workflow Type ID | Use Case | Input | Output | Signals |
|-----------------|----------|-------|--------|---------|
| `presence.operate` | CUC1: Operate a Presence | `{ tenantId, brandId, input: UserInput }` | `{ tasks: Task[], content?: Content[] }` | `approval.response`, `revision.request` |
| `presence.evolve` | CUC2: Evolve Understanding | `{ tenantId, brandId, trigger: 'scheduled' \| 'book_upload' }` | `{ knowledgeUpdates: KnowledgeUpdate[] }` | — |
| `presence.assessGraduation` | CUC3 Phase A+B | `{ tenantId, brandId, workflowId }` | `{ ready: boolean, proposal?: GraduationProposal }` | `graduation.approve`, `graduation.reject` |
| `presence.contentApproval` | VUC-P1 | `{ tenantId, brandId, contentId }` | `{ status: 'approved' \| 'revised' \| 'rejected' }` | `approval.response` |
| `presence.campaign` | VUC-P2 | `{ tenantId, brandId, campaignConfig }` | `{ campaignId, contentPlan: ContentItem[] }` | `campaign.pause`, `campaign.resume` |
| `presence.engagementResponse` | VUC-P3 | `{ tenantId, brandId, engagementEvent }` | `{ response?: Content, logged: boolean }` | — |
| `presence.growthTasks` | VUC-P4 | `{ tenantId, brandId }` | `{ tasks: Task[] }` | — |
| `presence.voiceDiscovery` | VUC-P5 | `{ tenantId, brandId, samples: VoiceSample[] }` | `{ voiceModel: VoiceModelUpdate }` | — |
| `presence.multiBrandBatch` | VUC-P6 | `{ tenantId, brandIds: string[] }` | `{ results: Map<brandId, ContentBatch> }` | — |
| `presence.micrositeGeneration` | VUC-P7 | `{ tenantId, brandId, micrositeConfig }` | `{ deploymentUrl: string }` | — |
| `presence.abTest` | VUC-K1 | `{ tenantId, brandId, testConfig }` | `{ testId, variants: Variant[] }` | `test.evaluate` |
| `presence.userCorrection` | VUC-K2 | `{ tenantId, brandId, correction }` | `{ updated: boolean }` | — |
| `presence.crossBrandTransfer` | VUC-K3 | `{ tenantId, sourceBrandId, targetBrandId, frameworkIds }` | `{ transferred: string[] }` | — |
| `presence.workflowCreation` | VUC-W1 | `{ tenantId, brandId, workflowDef }` | `{ workflowId, status: 'experimental' }` | — |

#### M2: Process Manager Workflows

| Workflow Type ID | Use Case | Input | Output | Signals |
|-----------------|----------|-------|--------|---------|
| `automation.execute` | CUC3 Phase C | `{ tenantId, brandId, workflowId, workflowDef }` | `{ contentProduced: Content[], published: boolean }` | `execution.cancel` |
| `automation.monitor` | VUC-W3 | `{ tenantId, brandId, workflowId }` | `{ status, metrics }` | — |
| `automation.degrade` | VUC-W2 | `{ tenantId, brandId, workflowId, reason }` | `{ degraded: boolean, handedBackTo: 'presence' }` | — |

#### M3: Tenant Manager Workflows

| Workflow Type ID | Use Case | Input | Output | Signals |
|-----------------|----------|-------|--------|---------|
| `account.onboard` | VUC-A1 | `{ email, plan, paymentMethod }` | `{ tenantId, brandId }` | — |
| `account.configureBrand` | VUC-A2 | `{ tenantId, brandConfig }` | `{ brandId, channelsConnected: string[] }` | — |
| `account.billing` | VUC-A3 | `{ tenantId, action: 'upgrade' \| 'downgrade' \| 'cancel', planId? }` | `{ success: boolean, newPlan? }` | — |
| `account.team` | VUC-A4 | `{ tenantId, action: 'invite' \| 'remove' \| 'updateRole', member }` | `{ success: boolean }` | — |

### 3.4 Activity Definitions (Engines + ResourceAccess + Utilities)

Activity definitions encode the atomic business verbs that drive the Digital Presence Operating System. These verbs represent the smallest units of meaningful work that Engines perform or that ResourceAccess components mediate. By designing around these verbs rather than generic CRUD operations, we preserve semantic clarity: every action has business significance and can be audited, versioned, and reasoned about independently. The system's flexibility emerges not from omnipotent abstractions but from the careful composition of these focused, well-defined activities.

#### The Annotation Pattern

Engines do not communicate with one another directly. Instead, they communicate through versioned, timestamped annotations that are written to and read from the database via ResourceAccess components. An annotation is a first-class entity: it carries metadata about when it was created, which Engine created it, what version of the source artifact it was based on, and what analysis or recommendation it contains.

When one Engine needs to incorporate context or feedback from another, it reads those annotations as part of its own work cycle. For example, when the Content Engine revises a piece, it explicitly queries for and reads VoiceAlignment annotations written by the Identity Engine, PerformanceInsight annotations written by the Analytics Engine, and StrategicGuidance annotations written by the Knowledge Engine. This explicit read-and-incorporate pattern is far clearer than hidden dependencies or event streams. The Manager orchestrates the sequence of Engine invocations—deciding which Engines run when and in what order—but the Manager does not orchestrate data flow. Each Engine knows what annotations it needs and retrieves them itself.

Consider a practical example: a user wants to refine their brand voice. The workflow proceeds as follows. First, the Identity Engine's **absorb** activity extracts signal samples from user feedback and stores them as IdentitySignal annotations. Later, the **refine** activity reads those accumulated signals and generates a new version of the brand identity prompt. Meanwhile, the Content Engine may have already produced content based on the previous identity version. When the Manager invokes the Content Engine's **revise** activity, the Engine queries for any new VoiceAlignment annotations (checking the timestamp to find only those written after the content was originally produced). These annotations contain explicit mismatch flags and suggestions. The Content Engine then revises the content in light of these recommendations. Only after all Engines have annotated does the Manager potentially invoke cleanup or archive activities.

This pattern has three major advantages. First, it decouples Engines completely: no Engine needs to know about any other Engine's existence or API. Adding a new Engine—say, a Regulatory Compliance Engine that writes ComplianceFlag annotations—requires no changes to existing Engines; they simply read the new annotations if they choose to. Second, the entire history of analysis is preserved: every annotation is immutable and timestamped, creating an audit trail that explains why content evolved the way it did. Third, the Manager remains simple: it is a scheduler, not a data plumber. The complexity of contextual reasoning is distributed into the Engines themselves, where domain logic belongs.

#### E1: Content Engine — Encapsulates content production volatility

The Content Engine is responsible for the actual creation and revision of content artifacts. It encapsulates the volatility of content production: the fact that drafts are generated, refined, sometimes discarded, and the criteria for "good content" evolve as feedback accumulates and performance data arrives. The Engine treats content as fundamentally mutable during the production cycle, yet maintains full version history so earlier drafts can always be recovered or compared.

The Content Engine reads high-level direction (brand identity, strategic guidance, performance insights, voice alignment feedback) and transforms it into concrete content suitable for specific platforms. It does not decide *whether* to produce content or *which* angles to explore; that is the Knowledge Engine's role. Instead, given a ContentBrief annotation and a brand identity prompt, it generates multiple candidate drafts, evaluates them, and stages the strongest one.

**produce**: Creates initial content drafts for one or more target platforms. Reads the ContentBrief annotation (written by the Knowledge Engine) and the current brand identity prompt. Generates draft content in platform-appropriate formats (e.g., tweet thread, LinkedIn article, email copy) with multiple candidate variations. Writes each candidate as an immutable content version to R2 via RA3. Includes metadata: platform, length, tone markers, target audience signal. Constraint: a single produce call may generate multiple candidates, but each candidate is a separate immutable version. The Engine must not overwrite; only RA3 decides which version becomes "current."

**revise**: Revises existing content in light of accumulated feedback annotations. Reads the current content version and queries for all relevant annotations written since the content was created: VoiceAlignment annotations (from E2), PerformanceInsight annotations (from E3), and StrategicGuidance annotations (from E4). Synthesizes these into a revision plan (e.g., "strengthen evidence for claim A," "reduce jargon to match target audience," "shift tone from educational to urgent"). Writes a new content version incorporating these changes. Constraint: the Engine must preserve the timestamp of the original content as a reference; revisions explicitly point back to their source version. The Engine does not delete or overwrite; RA3 and the Manager decide lifecycle transitions.

**compose**: Composes a cohesive multi-page microsite from the brand identity prompt and an approved content plan. Reads the identity prompt and the sequence of approved content pieces from R2. Generates HTML/CSS structure, navigation, information architecture, and visual direction (color palette, typography signals to send to the design system). Outputs as a composed artifact stored in R2. Constraint: compose is deterministic given its inputs; if the identity prompt changes or content order changes, compose must be re-run to produce an updated site.

**sequence**: Sequences a multi-part email series from an approved content plan and brand identity prompt. Reads the identity prompt and the marked-for-email content pieces. Determines email order, subject lines, send-window recommendations, and email-specific formatting (headers, footers, unsubscribe text). Writes sequenced email artifact to R2. Constraint: each email in the sequence is independent and can be sent on its own schedule, but the sequence itself forms a coherent narrative arc; the Engine must respect and communicate this.

#### E2: Identity Engine — Encapsulates brand identity volatility

The Identity Engine manages the brand identity prompt, which is the canonical representation of the brand's voice, personality, and values. This prompt is not static; it evolves as the system observes user corrections and as content performance reveals misalignments. The Identity Engine encapsulates this volatility, ensuring that identity changes are principled, versioned, and tied to evidence.

**evaluate**: Evaluates a piece of content against the current brand identity prompt. Reads the identity prompt and the content to evaluate. Produces an analysis: a VoiceAlignment annotation that includes an alignment score (0-100), a list of specific misalignments (e.g., "tone is too formal, identity calls for conversational"), and concrete revision suggestions. Writes the annotation to R2 via RA3 with references to both the identity version and the content version being evaluated. Constraint: evaluate must be quick and suitable for running on every piece of produced content; it is not a bottleneck.

**refine**: Refines the brand identity prompt by synthesizing accumulated IdentitySignal annotations. Runs periodically (e.g., weekly) or on-demand. Reads all IdentitySignal annotations created since the last refinement. These signals come from the **absorb** activity and represent user corrections and feedback. Generates a new version of the identity prompt that incorporates this feedback. Writes the new prompt version to R1 via RA3, explicitly citing which signals influenced which changes. Constraint: refinement is conservative; contradictory signals do not produce radical swings. The Engine must maintain continuity while allowing drift.

**absorb**: Extracts personality, vocabulary, tone, and value signals from raw user input (e.g., user edits content and adds a comment, or user approves one draft and rejects another with feedback). Parses the input to identify signal patterns (e.g., "user prefers active voice," "user adds academic references," "user changes 'customers' to 'partners'"). Writes each signal as an IdentitySignal annotation to R1 via RA3. Annotations include the signal type, source input, confidence level, and timestamp. Constraint: absorb must be non-invasive; it does not block user workflows. Signals are captured asynchronously and accumulated for later refinement.

#### E3: Analytics Engine — Encapsulates performance analysis volatility

The Analytics Engine translates raw platform metrics into actionable insights for content improvement and workflow graduation. It encapsulates the volatility of platform APIs (which change, sometimes without notice), the varying definitions of engagement across platforms, and the statistical uncertainty inherent in analyzing performance data. The Engine normalizes messy metrics into clean insights.

**assess**: Analyzes a piece of content and produces predictive performance insights. Reads the content, platform identity, target audience, and comparable historical content. Writes a PerformanceInsight annotation to R5 via RA4 that includes predicted engagement metrics (likes, shares, comments, click-through), optimal posting time windows, audience fit assessment, comparable benchmarks from similar prior content, and risk factors (e.g., "this angle historically underperforms with this audience," "timing may conflict with competitor activity"). Constraint: predictions are point-in-time; they become less relevant as external conditions (trends, competitor activity, platform algorithm changes) evolve.

**synthesizePerformance**: Produces a monthly cross-channel performance synthesis report. Reads normalized metrics from R5 (harvested by RA1), broken down by content piece, channel, audience segment, and date. Generates a MonthlyAnalysis report that identifies top-performing content types, emerging audience segments, seasonal patterns, and comparative performance across channels. Writes the report to R5 via RA4. Constraint: synthesis is backward-looking and retrospective; it explains what happened, not what will happen.

**evaluateWorkflow**: Assesses whether the workflow is ready to graduate to the next automation level. Reads workflow performance history, user intervention rates, content approval rates, and engagement outcomes. Writes an assessment annotation to R5 that includes a readiness score against defined thresholds (e.g., "autonomous content production is ready if approval rate >95% for eight consecutive weeks"). Constraint: this is a gate-keeping activity; it must be conservative and transparent about its thresholds.

**recordEngagement**: Records a single platform engagement event (e.g., user liked a post, clicked a link, viewed a story). Reads the event from an inbound webhook or harvest call. Updates running metrics in R5: incrementing engagement counters, recording timestamps, updating audience segment records. Constraint: this is high-volume and must be fast; it should not block the inbound webhook handler.

**concludeExperiment**: Evaluates an A/B test to statistical significance and declares a winner. Reads the test configuration (two content variants, control/treatment split, success metric, planned duration). Reads the accumulated metrics from R5. Performs statistical test (e.g., chi-squared for proportions, t-test for means). Writes a ConcludeExperiment annotation to R5 that includes the p-value, effect size, and winner declaration. Constraint: the Engine must refuse to conclude a test before minimum sample size is reached, even if one variant is clearly ahead.

#### E4: Knowledge Engine — Encapsulates domain knowledge and strategic reasoning volatility

The Knowledge Engine is the strategist. It reads performance data, market trends, and internal knowledge frameworks, then synthesizes recommendations about which content angles to pursue, how to position them, and what strategic guidance existing content should receive. It encapsulates volatility in strategy: what works changes, frameworks are refined, and the system must continuously reconcile empirical evidence against predictions.

**brief**: Produces a ContentBrief annotation before content production begins. Reads performance data (from prior content), trend signals, internal knowledge frameworks, and brand context. Synthesizes this into a recommendation annotation written to R4 via RA4 that includes recommended content angles (with ranking), relevant frameworks to apply, audience insights (who should see this, what they care about), timing recommendations (when to publish for maximum impact), and risk flags (e.g., "this angle conflicts with prior positioning," "this trend may be saturated"). The brief anchors content production; the Content Engine uses it to decide what to create. Constraint: a brief is a point-in-time recommendation; if external conditions change significantly before content is produced, a new brief should be requested.

**annotate**: Writes a StrategicGuidance annotation on existing content. Reads the content and current strategic context. Produces analysis: does this content align with current strategy? What strategic value does it have? How should it be positioned or amplified? Writes the annotation to R4 via RA4. Constraint: guidance is asynchronous and non-blocking; it does not prevent content from being published.

**ingest**: Ingests a knowledge source (a book chapter, research article, external URL, or user upload). Extracts semantic frameworks, key concepts, evidence structures. Generates embeddings for semantic search. Writes the ingested knowledge to R4 via RA4 as a KnowledgeSource record with metadata (source type, ingestion date, framework tags, embedding vectors). Constraint: ingestion is idempotent; ingesting the same source twice must not create duplicates.

**reconcile**: Reconciles empirical performance evidence against framework predictions. Reads a framework stored in R4 (e.g., "audiences in the healthcare sector respond to evidence-based positioning"). Reads performance data from R5 for content created using that framework. Compares predictions to outcomes. Writes a ReconcileEvidence annotation to R4 that updates confidence scores: if evidence strongly supports the framework, confidence increases; if evidence contradicts it, confidence decreases. Constraint: reconciliation is conservative; a single conflicting data point does not overturn a well-validated framework.

#### RA1: Channel Access — Encapsulates platform API volatility

RA1 is the interface between the system and external social platforms, email services, and publishing networks. Platforms are notoriously unstable: APIs change, rate limits are imposed, undocumented endpoints are discovered and then closed, webhook behaviors shift. RA1 encapsulates this volatility behind a consistent interface, enabling the system to adopt new platforms or swap implementations without changes to Engines.

RA1 provides per-platform adapters. Each adapter hides platform-specific authentication, API quirks, rate limiting, format translation, and pagination. An adapter for Twitter encapsulates Twitter-specific OAuth flow, tweet length limits, media attachment rules, and the Twitter v2 API's idiosyncrasies. An adapter for LinkedIn encapsulates LinkedIn's different authentication model, document format requirements, and more permissive rate limits. An adapter for email encapsulates SMTP, template rendering, delivery confirmation, and bounce handling.

**distribute**: Distributes a content artifact to a specified platform. Receives the content (formatted as generic content artifact), target platform identifier, and scheduling metadata (post now, schedule for specific time, or draft). The adapter translates content into platform-native format, handles authentication and retries, enforces platform constraints (e.g., character limits), manages rate limiting, stores platform-specific identifiers (tweet ID, post URL, email message ID). Writes distribution metadata and platform response to R2 via RA3. Constraint: distribution is idempotent; attempting to distribute the same content twice to the same platform must be safe (no duplicates).

**harvest**: Harvests performance metrics from a platform. The adapter handles platform-specific pagination (fetching all historical data despite cursor limits), normalizes disparate metrics (Twitter's "likes" vs. LinkedIn's "reactions" vs. email's "open rate") into a canonical schema, respects platform rate limits, and retries transient failures. Writes normalized metrics to R5 via RA4. Each metric record includes platform source, content identifier, metric type, value, and harvest timestamp. Constraint: harvest is eventually consistent; partial failures (e.g., one platform's API is down) must not block harvesting from other platforms.

**connect**: Executes the full OAuth lifecycle for a new platform connection. Receives platform identifier and user context. Initiates OAuth flow (generates authorization URL, handles callback, exchanges code for token). Stores token securely. Registers webhooks if the platform supports them (for real-time event delivery). Writes a ChannelConnection record to R1 via RA3. Constraint: tokens must be stored in a secrets manager, never in plaintext logs or code.

**disconnect**: Revokes a platform connection. Reads the ChannelConnection record. Revokes tokens at the platform (if supported). Unregisters webhooks. Writes a revocation record to R1 via RA3 (marking the connection as inactive). Constraint: disconnection must be immediate; any in-flight posts or harvests for this platform must be aborted.

#### RA2: Service Access — Encapsulates external non-AI service volatility

RA2 provides access to external services that are not content platforms and not AI services. These are critical operational services—billing, deployment, asset hosting—that change on their own cadences.

**processBilling**: Encapsulates Stripe API. Handles customer creation, subscription management (create, upgrade, cancel, retry billing), invoice generation, and webhook reconciliation (when Stripe sends webhook events, the system must update its internal state consistently). Receives billing requests from the system (e.g., "create subscription for user X at tier Y") and executes them through Stripe, translating Stripe's data model to the system's schema. Writes billing records to an external resource (not one of the five core resources R1-R5). Constraint: billing is transactional; a failed billing operation must not leave the system in an inconsistent state.

**deployAsset**: Encapsulates Vercel deployment. Receives a microsite artifact (HTML, CSS, assets) or content asset (image, video). Deploys to Vercel, obtains a public URL, updates DNS if needed, and handles versioning (prior deployments remain accessible at version-specific URLs). Writes deployment metadata and public URLs to R2 via RA3. Constraint: deployments are immutable; once deployed at a version URL, that version must never change.

#### RA3: Content Process Artifact Access — Encapsulates storage volatility for content creation

RA3 is one of two ResourceAccess components that mediates access to the system's internal artifact storage. Where the old RA4 combined all storage concerns, RA3 now focuses specifically on artifacts central to the content creation process: brand configuration (R1), content versions (R2), and human tasks (R3). These artifacts have a different lifecycle cadence (hours to days) from performance and knowledge artifacts, which change on a different rhythm (minutes for metrics, days to weeks for knowledge). This split allows for independent optimization of storage strategies: R1-R3 prioritize consistency and versioning; R4-R5 prioritize write throughput and temporal queries.

**R1 Brand verbs:**

**configureBrand**: Writes or updates brand configuration: autonomous agent settings, autonomy level (from fully manual to fully autonomous), core brand pillars, mission statement, audience segments, and channel permissions (which platforms the agent is allowed to use). Immutable versions. Constraint: configuration changes may cascade to other systems; a change in autonomy level, for instance, may trigger a re-evaluation of the workflow graduation thresholds.

**evolveIdentity**: Writes a new version of the brand identity prompt (the synthesized result of the Identity Engine's **refine** activity). Each version is immutable and explicitly timestamps when it supersedes the prior version. Constraint: the identity prompt is the most frequently read artifact in the system; versions must be queryable by timestamp so Engines can ask "what was the identity when this content was created?"

**registerChannel**: Records a successful channel connection (OAuth integration). Writes a ChannelConnection record to R1 including platform name, OAuth tokens (stored securely, never read except by RA1), webhook URLs, and registration timestamp. Constraint: this is written by RA1 after a successful **connect** activity.

**revokeChannel**: Marks a channel connection as inactive. Updates the ChannelConnection record to indicate revocation. Constraint: revocation is immediate; any pending distributions or harvests must be aborted.

**R2 Content verbs:**

**stageContent**: Writes an immutable new content version to R2. Receives content artifact (formatted text, media references, metadata), platform target, and source information (which Engine created it, which brief it was based on). Creates an immutable version record with unique ID, creation timestamp, content hash (for deduplication), and blob reference to the actual content bytes. Constraint: stagingContent never updates existing content; every change is a new version. This preserves history and enables comparing versions.

**advanceContent**: Moves a content version through the lifecycle state machine: draft → review → approved → scheduled → published → archived. Receives the content ID and target state. Updates the state in R2 and returns the new state to the caller. Constraint: transitions must respect the state machine; you cannot advance from draft directly to published; it must pass through review and approved. Reversions (e.g., published back to draft) are typically not allowed without explicit intervention. Note: advanceContent does not trigger distribution or any other cross-component side effects. The Manager workflow is responsible for orchestrating the next step (e.g., calling RA1's **distribute** after a successful advance to "scheduled").

**annotateContent**: Writes an annotation record to R2 for a specific content version. Annotations are created by Engines (VoiceAlignment from E2, PerformanceInsight from E3, StrategicGuidance from E4). Immutable. Includes Engine identifier, creation timestamp, annotation type, and content. Constraint: annotations are queryable by type and timestamp; when the Content Engine's **revise** activity wants to re-evaluate, it queries for all annotations of types it cares about that were written after the content was originally created.

**readAnnotations**: Retrieves all annotations for a specific content version, optionally filtered by type and creation timestamp. Used by the Content Engine's **revise** activity and by UI components showing annotation history. Constraint: this is a read operation; it must be fast and must include all annotations without loss.

**archiveMedia**: Stores media (images, videos) associated with content in object storage. Receives media bytes and metadata. Returns object storage reference (S3 key, CDN URL). Content versions can reference archived media. Constraint: archived media is immutable and eternally accessible; dead links are a serious failure mode.

**R3 Task verbs:**

**dispatchTask**: Creates a human task for a human to review content, make a decision, or provide input. Receives task type (approve-content, edit-identity, resolve-conflict), context (what is the task about), and urgency. Writes a Task record to R3 with unique ID, creation timestamp, assignee, due date, and context. Constraint: dispatch is used when the system reaches a decision boundary and cannot proceed autonomously.

**fulfillTask**: Completes a task with human response. Receives task ID and response (approval, rejection, feedback text, new content, etc.). Writes the response to R3. Marks task as complete and returns the task outcome to the caller. The Manager workflow decides what happens next based on the outcome (e.g., calling **advanceContent** after an approval). Constraint: a task can only be fulfilled once; double-submission is a user-interface problem to prevent, not a system problem to handle.

#### RA4: Performance & Knowledge Artifact Access — Encapsulates storage volatility for analytics and knowledge management

RA4 is the second storage ResourceAccess component, focused on high-volume, time-series, and semantic artifacts: performance metrics (R5) and ingested knowledge frameworks (R4). Unlike R1-R3, which prioritize consistency and versioning, R4-R5 prioritize write throughput, temporal queries (metrics from the last week, framework updates in the last month), and semantic search (finding relevant frameworks by embedding similarity). This justifies independent storage strategies.

**R4 Knowledge verbs:**

**catalogFramework**: Ingests and catalogs a knowledge framework or source material. Receives framework (extracted by the Knowledge Engine's **ingest** activity), metadata (source, framework tags, concepts, confidence level), and embeddings (generated by U5). Writes a Framework record to R4 with immutable content, searchable tags, and embedding vectors. Constraint: frameworks are rarely deleted; old frameworks are marked as archived when superseded, preserving them for historical reference and debugging.

**discoverKnowledge**: Semantic search for relevant frameworks. Receives a query (text or embedding vector). Searches R4 for semantically similar frameworks using embedding similarity. Returns ranked results with relevance scores. Constraint: discovery is read-only and does not block; result ranking can be imperfect without breaking functionality.

**reconcileEvidence**: Updates confidence scores in a framework based on empirical evidence. Receives framework ID and evidence (from the Knowledge Engine's **reconcile** activity). Adjusts confidence scores in the framework record and writes a reconciliation audit record. Constraint: confidence scores are updated incrementally; they do not flip based on a single conflicting observation.

**linkSourceMaterial**: Associates source documents (books, articles, PDFs) with a framework. Stores source material in object storage, links it to the framework, and enables retrieval of sources that back up a particular framework. Constraint: source links must be permanent; broken source links are a regression.

**R5 Performance verbs:**

**captureMetric**: Appends a single metric data point to R5. Receives metric (content ID, platform, metric type, value, timestamp). Writes to an append-only log in R5. Constraint: this is high-volume and must be extremely fast; it is called on every webhook event from platforms and every periodic harvest. Append-only design ensures no updates or deletes; only inserts.

**snapshotAudience**: Takes a point-in-time snapshot of audience characteristics. Reads current audience data (accumulated through metric captures and harvest calls), aggregates it (demographics, interest categories, engagement patterns, growth trends), and writes a snapshot record to R5. Snapshots are immutable; each snapshot is timestamped. Constraint: snapshots are expensive to compute and are taken on a schedule (e.g., daily), not on every event.

**trackExperiment**: Creates, updates, or concludes an A/B test. Receives experiment configuration (two content variants, success metric, planned duration). Writes a new Experiment record to R5. Later, as the Analytics Engine's **conclude-Experiment** activity runs, the Engine updates the record with outcomes. Constraint: experiments can overlap; multiple experiments can run concurrently as long as they use different content pieces or different audience segments.

**assessWorkflowHealth**: Computes and stores a composite health metric for the workflow. Reads performance history, approval rates, automation success rates, and user satisfaction signals from R5. Writes a HealthAssessment record to R5. Constraint: this is an aggregation operation analogous to **snapshotAudience** — it consolidates existing stored data into a summary record. Health assessment is asynchronous and does not block any operational activity.

#### U4: Notification — Cross-cutting notification infrastructure

Notification is a cross-cutting concern: Engines and ResourceAccess components need to alert humans (the user, team members, administrators) about significant events without being blocked by notification delivery. U4 provides two complementary notification verbs.

**alert**: Sends a one-way, real-time notification to a user's browser via SSE. Receives alert type (content-ready-for-review, experiment-concluded, platform-error, workflow-graduated) and context. Writes the alert to the user's SSE channel in Upstash Redis so the browser receives it without polling. Constraint: alerts are fire-and-forget delivery; if the user's browser is not connected, the alert is lost. This is acceptable because alerts are informational, not critical. Note: U4 does not publish domain events or trigger downstream workflows — it is a one-way notification channel. Only Managers decide what events are significant; U4 merely delivers the notification they request.

**notify**: Sends a templated email notification. Receives notification type (weekly-summary, approval-required, new-engagement-threshold-reached) and context. Renders a template with context data. Sends via email. Includes unsubscribe link. Constraint: email notifications are non-blocking and asynchronous. The system must not wait for email delivery; emails are queued and sent in the background.

#### U5: AI — Cross-cutting AI model access

U5 is a configuration and integration layer for AI capabilities. The system uses the Vercel AI SDK, which provides a language-agnostic interface for text generation, structured output generation, embeddings, and streaming. U5 does not define a custom abstraction on top of the Vercel SDK; it is a thin layer that configures the SDK to use OpenRouter as the provider, sets default model identifiers and parameters, and exposes the Vercel SDK interface directly to Engines and other components.

Engines that need to generate text (Content Engine's **produce** activity, Knowledge Engine's **brief** activity) use the Vercel SDK's generateText function directly, passing a prompt and receiving text output. Engines that need structured output (Identity Engine's **absorb** activity extracting signals from user input, Analytics Engine's **assess** activity producing structured predictions) use the Vercel SDK's generateObject function, passing a Zod schema that constrains the output shape. Engines that need embeddings (Knowledge Engine's **ingest** activity, RA4's **discoverKnowledge** activity) use the Vercel SDK's embed function. Engines that need streaming (for real-time content generation shown to the user as it is produced) use the Vercel SDK's streamText function.

All calls are routed through OpenRouter, which provides model abstraction and allows switching between Claude, GPT, and other providers without code changes. Default model settings (temperature, max tokens, top-p) are configured once in U5 and inherited by all callers. Constraint: U5 is not a bottleneck; it performs no blocking operations and does not rate-limit caller requests (rate limiting happens at the OpenRouter level or in the caller's retry logic).

#### U6: Conversation — Cross-cutting conversational memory

U6 wraps the Honcho SDK for conversational memory and social cognition. Like U5, this is a cross-cutting utility available to any component that needs it. Many Engines benefit from remembering prior interactions: the Identity Engine benefits from recalling past user corrections to avoid repeating them, the Content Engine benefits from remembering user preferences and past content decisions, the Knowledge Engine benefits from remembering prior frameworks the user has approved.

U6 manages session lifecycle transparently: when a component requests conversation context for a brand, U6 either retrieves an existing conversation session or creates a new one. Sessions are keyed by brand ID, enabling the system to maintain separate conversation histories for different brands.

**remember**: Stores an interaction in conversational memory. Receives interaction (user action, Engine decision, feedback, or preference signal) and brand context. Sends to Honcho to store in the brand's conversation session. The interaction is serialized and indexed for later retrieval. Constraint: remember is non-blocking and should be fast; it should not be a bottleneck to user workflows.

**recall**: Retrieves contextually relevant prior interactions from conversational memory. Receives a query context (what is the Engine about to do, what decision is it making) and brand ID. Sends query to Honcho, which uses dialectic retrieval to find semantically similar prior interactions from the session history. Returns ranked interactions in most-relevant-first order. The calling Engine can then incorporate this context into its own decision-making. Constraint: recall is approximate; it is not guaranteed to find all relevant prior interactions, but it should find most of them. This is acceptable because Engines use recall as input to their reasoning, not as a definitive decision.


### 3.5 Worker Registration

Each Temporal worker is a standalone process deployed as a Railway service. A worker registers its subsystem's workflows and the activities those workflows call, then connects to Temporal Cloud using its namespace and task queue.

The **presence worker** registers all M1 workflow definitions and all E1-E4, RA1, RA3, RA4, U4, U5, and U6 activities. It connects to the presence task queue and configures concurrency limits appropriate for AI-heavy workloads (higher timeout tolerances, moderate parallelism for LLM calls).

The **automation worker** registers all M2 workflow definitions and the subset of Engine and RA activities that automation workflows require (primarily E3, RA3, RA4). It connects to the automation task queue with tighter concurrency limits since automation workflows are less frequent but more sensitive to ordering.

The **account worker** registers all M3 workflow definitions and the RA2, RA3, and RA4 activities needed for onboarding, billing, and team management. It connects to the account task queue with standard concurrency settings.

Worker configuration (Temporal namespace, task queue name, connection credentials, concurrency limits) is externalized to environment variables, not hardcoded. Each worker reads its configuration at startup and fails fast if required environment variables are missing.

### 3.6 Manager-to-Manager Communication (Queued)

Per Löwy's closed architecture, Managers never call each other synchronously. All Manager-to-Manager communication is asynchronous, using Temporal's built-in cross-queue mechanisms. When a workflow in one Manager needs to trigger a workflow in another Manager, it uses one of two patterns.

**Child Workflow pattern**: The calling Manager starts a child workflow on the target Manager's task queue. For example, when M1's graduation assessment workflow approves a workflow for full automation, it starts an M2 automation execution workflow as a child. The parent close policy is set to ABANDON, meaning the child continues independently even if the parent workflow completes. This pattern is used when the caller needs a handle to monitor or cancel the downstream workflow.

**Signal pattern**: The calling Manager sends a signal to an already-running workflow in the target Manager. For example, when M3's billing workflow downgrades a tenant's plan, it signals any running M1 workflows for that tenant to adjust their behavior. This pattern is used for coordination with existing long-running workflows.

Both patterns use Temporal's built-in durability guarantees — if a worker crashes between starting a child and recording the result, Temporal replays the workflow and deduplicates the child workflow start.

### 3.7 Temporal Schedules (U2: Scheduling)

Temporal Schedules replace the U2 Scheduling utility for all recurring triggers. Rather than building a custom scheduling service, the system registers schedules directly with Temporal Cloud. Each schedule specifies a workflow type, input arguments, task queue, cron-like calendar spec, and an overlap policy.

Key schedules include a monthly knowledge evolution cycle (triggering M1's knowledge ingestion workflow on the first of each month), a weekly workflow graduation assessment (triggering M1's assessment workflow every Monday), and a daily metrics harvest (triggering M1's analysis cycle workflow). All schedules use the SKIP overlap policy to prevent duplicate runs if a previous execution is still in progress.

Schedules are created and managed programmatically through the Temporal Client package. When a new brand is onboarded, the account onboarding workflow (M3) creates the brand's initial schedules. When a brand is deactivated, schedules are paused. Schedule configuration (timing, overlap policy) is stored in the schedule definition, not in the application database, making Temporal Cloud the single source of truth for recurring triggers.


---

## 4. API & Contract Design

### 4.1 Inter-Service HTTP Endpoints

The API Gateway exposes the following endpoints to clients and internal services. All authenticated endpoints require either a valid JWT in the Authorization header (user-facing) or an API key (service-to-service). The endpoint structure follows REST conventions organized by resource domain.

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/v1/workflows/start | Initiate a Temporal workflow execution | JWT |
| GET | /api/v1/workflows/:id/status | Poll workflow status and execution history | JWT |
| POST | /api/v1/workflows/:id/signal | Send a signal to a running workflow (e.g., approval, cancellation) | JWT |
| POST | /api/v1/webhooks/stripe | Inbound Stripe billing events | Signature verification |
| POST | /api/v1/webhooks/x | Inbound X/Twitter account activity webhooks | Signature verification |
| POST | /api/v1/webhooks/linkedin | Inbound LinkedIn platform notifications | Signature verification |
| POST | /api/v1/content/submit | External submission of content ideas (partner integrations) | API Key |
| GET | /api/v1/analytics/export | Retrieve analytics and performance metrics in bulk | API Key |
| GET | /api/v1/auth/callback/:platform | OAuth callback redirect target (X, LinkedIn, Stripe, etc.) | State validation |
| GET | /events/:tenantId | Server-Sent Events stream for all events in a tenant | JWT |
| GET | /events/:tenantId/:brandId | Server-Sent Events stream filtered to a specific brand | JWT |
| GET | /health | Service health check and readiness status | None |

### 4.2 Schema Organization

All data validation and type definitions live in `packages/schemas/` as Zod schema definitions. These schemas serve triple duty: they provide runtime validation when data enters the system, generate TypeScript types automatically for type-safe development, and serve as the source of truth for OpenAPI documentation generation via the zod-to-openapi toolchain.

The system defines several key entity schemas. The **Brand** schema represents a customer account and includes fields for the platform ecosystem (an enumeration of supported platforms like X, LinkedIn, Substack), the autonomy level determining what decisions the system can make independently, and demographic metadata describing the brand's audience and niche. The **Content** schema models a piece of content through its full lifecycle and includes a status field tracking progression through states (drafted, approved, scheduled, published, archived), a type enumeration (thread, article, short-form, long-form), the target platform, and versioned metadata capturing content parameters, approval notes, and publishing decisions.

The **Task** schema represents units of work triggered by workflows and includes a type enumeration (review, approval, scheduling, analysis), a status lifecycle (open, in-progress, completed, failed), priority level, and a context field (stored as JSONB) allowing arbitrary structured metadata. Tasks also carry a reference to their originating workflow so signals can be coordinated.

The **Knowledge Framework** schema captures learned patterns and decision rules, including a confidence score (0-1 scale) derived from evidence accumulation, a list of evidence items with sources, and vector embeddings enabling semantic search and similarity matching.

Response type schemas define the shape of workflow status responses (including current state, pending signals, completion status, and error details), content submission acknowledgments (containing generated IDs and next-step guidance), and analytics exports (supporting multiple date ranges, aggregation levels, and metric subsets).

Workflow input and output schemas define strict contracts for Temporal workflows. Workflow start requests must specify the tenant ID, brand ID, workflow type, and type-specific parameters as a JSONB context object. Status responses include the current workflow state, a timeline of completed activities, any pending signal requests, and completion results if finished. Signal requests specify the signal name and signal-specific payload, enabling the workflow to receive approvals, rejections, or other external directives.

All schemas enforce type safety and validation constraints at the boundary between external callers and internal services. The Zod definitions include field-level constraints (required vs. optional, string length limits, numeric ranges, enum values) but these are not enumerated here—refer to the schema source files for current constraints. New fields or entities are added to schemas in `packages/schemas/` without requiring changes to clients; schemas evolve with the system's capabilities.

### 4.3 SSE Event Taxonomy

Server-Sent Events provide real-time, one-way streaming of system events to authenticated clients. Every event follows a common envelope structure containing an event ID (for deduplication), event type, tenant ID (for routing), optional brand ID (for filtering), ISO 8601 timestamp, and a type-specific data payload.

Events are categorized by business domain:

- **Task Lifecycle**: task_created (a new task is assigned), task_updated (task properties changed), task_completed (task finished), task_failed (task encountered an error)
- **Content Lifecycle**: content_drafted (first version created), content_revised (updated by author), content_approved (approved by reviewer), content_scheduled (scheduled for publication), content_published (successfully posted), content_failed (posting failed)
- **Workflow Lifecycle**: workflow_started (execution began), workflow_completed (reached terminal success state), workflow_failed (execution failed), workflow_graduation_proposed (autonomy promotion recommended), workflow_graduation_applied (autonomy level increased)
- **Knowledge Updates**: knowledge_updated (a learned rule or pattern was added or refined), knowledge_conflict_detected (multiple contradictory decisions detected)
- **Notifications**: alert (actionable system alert), notification (informational message)
- **System**: heartbeat (periodic keep-alive), error (system error occurred)

Typed event payloads are defined per event type—for example, a task_created event includes the task ID, task type, priority, and assigned brand; a content_approved event includes the content ID, approver identity, and approval notes; a workflow_completed event includes completion status, result data, and execution duration. Clients subscribe to streams and filter by event type, tenant, or brand as needed.

### 4.4 OpenAPI Specification Generation

OpenAPI specifications are not hand-written. Instead, they are automatically generated at build time from the Zod schemas using the zod-to-openapi integration. The API Gateway build step processes all Zod definitions in `packages/schemas/`, extracts descriptions and constraints, maps them to OpenAPI 3.1 types, and outputs a complete specification. This ensures the OpenAPI spec is always synchronized with actual validation logic and never falls out of sync through manual drift. The generated specification includes endpoint definitions, request/response schemas, authentication requirements, and examples derived from the Zod schemas.


---

## 5. Auth & RBAC Model

### 5.1 Authentication Flow

The authentication system delegates credential management to Supabase Auth, which handles user signup, login, password resets, and multi-factor authentication according to industry best practices. When a user authenticates through Supabase Auth, they receive a JWT token. This JWT is included in the Authorization header of API requests. The API Gateway validates the JWT signature and expiration, then passes the token's claims (especially the tenant_id) downstream to services. Temporal workflows and activities receive the tenant ID from the workflow input structure, which is populated by the API Gateway after JWT validation—this ensures activities never have to validate user identity themselves, only operate within the boundary of the assigned tenant.

### 5.2 JWT Structure

Supabase Auth issues JWT tokens containing standardized claims. The system augments these with custom claims via a database trigger that runs on user insert/update. The JWT includes the following key claims:

- **sub**: The user's UUID (subject identifier)
- **email**: The user's email address
- **tenant_id**: The UUID of the tenant (workspace) this user belongs to
- **role**: The user's role within the tenant (one of: owner, operator, viewer, api)
- **brand_permissions**: A map structure where keys are brand UUIDs and values are arrays of permission strings (e.g., {"brand-uuid-1": ["read", "write", "approve"], "brand-uuid-2": ["read"]})
- **aud**: Token audience (the API Gateway service)
- **exp**: Token expiration timestamp (typically 1 hour from issuance)

The custom claims are injected before the token is issued, so all downstream services can rely on their presence. If claims are missing, the JWT is treated as invalid.

### 5.3 RBAC Roles

The system recognizes four distinct roles within a tenant:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Account administrator; has implicit full access to all tenant data and brand operations. Can invite users, configure integrations, and adjust autonomy levels. | All; no per-brand restrictions |
| **Operator** | Day-to-day content reviewer and approval authority. Can review tasks, approve/reject content, and trigger workflows. Cannot modify brand configuration. | Limited by brand_permissions; typically read, write, approve, publish within assigned brands |
| **Viewer** | Read-only access; can view content, analytics, and workflow status but cannot make changes. | Limited by brand_permissions; read-only on assigned brands |
| **API** | Service-level access for external integrations and tool connections. Uses API keys instead of interactive login. | Scoped to a single brand; typically post, harvest, and analytics operations |

### 5.4 Brand-Level Permissions

Users may have different permission levels across different brands within the same tenant. Permissions are assigned on a per-brand, per-user basis and are stored in the brand_permissions JWT claim as a map. The system recognizes the following permission types:

- **read**: View content, tasks, and analytics for the brand
- **write**: Create and edit draft content and tasks
- **approve**: Review and approve/reject submitted content and tasks
- **publish**: Trigger publishing (moving content from approved to published state)
- **configure**: Modify brand settings, autonomy levels, and platform connections

Authorization checks follow a consistent pattern: Owners have implicit full access to all resources within their tenant; all other users are checked against their brand_permissions map. An operation on a specific brand is allowed only if the user's brand_permissions entry for that brand includes the required permission string. The API Gateway enforces these checks before allowing requests to proceed; services need not re-check permissions for the calling user.

### 5.5 RLS Policy Design

Every table in the PostgreSQL database includes a tenant_id column to enable row-level security (RLS). Supabase's RLS engine automatically enforces policies, preventing any query from returning data belonging to other tenants unless explicitly bypassed.

The RLS policy framework relies on two helper functions:

- **current_tenant_id()**: Extracts the tenant_id from the JWT claims in the current database connection context. Used in policy USING clauses to restrict rows by tenant.
- **current_role()**: Extracts the role claim, enabling role-based policy branching (e.g., owners see more than viewers).
- **brands_with_permission(perm TEXT)**: Returns a set of brand UUIDs for which the current user has the specified permission, derived from the brand_permissions JWT claim. Enables brand-level filtering in policies.

Policies follow two standard patterns:

1. **Tenant Isolation**: A base policy on every table uses `USING (tenant_id = current_tenant_id())`, ensuring no cross-tenant data leakage regardless of user role.

2. **Brand-Level Read/Write**: Additional policies on brand-dependent tables use `USING (tenant_id = current_tenant_id() AND brand_id = ANY(brands_with_permission('read')))` for read operations and similar checks for write/approve/publish operations, ensuring users can only access brands in their permission map.

As an illustrative example, a RLS policy on the `content` table might be:

```sql
CREATE POLICY content_brand_access ON content
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND (
      current_role() = 'owner'
      OR brand_id = ANY(brands_with_permission('read'))
    )
  );
```

This policy allows owners to read all content within their tenant, while other users can only read content from brands they have permission to access. Similar policies govern insert, update, and delete operations with appropriate permission checks.

### 5.6 Service-Level Auth

Temporal Workers and internal services use a Supabase service role connection string, which bypasses RLS policies at the database level. This is safe because tenant isolation is enforced at the workflow level: every workflow receives a tenant ID as part of its input, and all activities within that workflow implicitly operate within that tenant boundary.

Activities enforce tenant isolation programmatically through typed helper functions that accept a tenant ID and filter all database queries by that ID. For example, a helper function `getContentForTenant(tenantId, contentId)` always includes a WHERE clause filtering by tenant_id, preventing accidental cross-tenant reads even if RLS is bypassed. These helpers are the only way to access the database from activities, ensuring isolation is enforced uniformly. New activity implementations must use these helpers; raw database access is not available.


---

## 6. Data Model (R1-R5)

### Overview

The Digital Presence Operating System's data model is organized into five resource stores that work together to capture tenant account structures, content creation and publishing workflows, human task management, strategic knowledge ingestion, and continuous performance measurement. Rather than prescribing a rigid schema, this section describes the conceptual structure, behavior, and design principles that any implementation must satisfy. The stores are designed to support autonomous agent decision-making while maintaining complete auditability and allowing human operators to intervene at defined points.

The fundamental design philosophy centers on three principles: immutability for audit trails and engine-to-engine communication (preventing races and ensuring reproducibility), versioning for strategic concepts that evolve over time (brand voice, content plans, knowledge frameworks), and append-only time series for measurement and observation (never rewriting historical truth).

---

### Resource Store 1: Brand and Account Management (R1)

#### Tenants: The Account Root

At the foundation sits the tenant entity, which represents a top-level customer account in the platform. A tenant contains a human-readable name, the primary email contact, a Stripe customer identifier for billing integration, a plan tier (free, starter, pro, or enterprise) that gates features, and a mutable feature_flags object stored as versioned JSON. The feature_flags structure allows the system to selectively enable experimental capabilities or regional features without code deployment. Each flag entry includes metadata about when it was set and which tier unlocked it. These flags are consulted at runtime by engines to determine behavioral boundaries.

#### Brands: Distinct Digital Identities

Within a tenant, there may be one or many brands—each representing a distinct digital presence that the tenant manages. A brand is identified by its name and a narrative description of its positioning. More importantly, a brand record captures the strategic metadata that governs how content should be produced: an autonomy_level (ranging from manual, where humans approve every piece, through suggest and draft, to fully autonomous production), a growth_stage (launch, growth, or mature) that influences the personality and cadence of output, content_pillars as a text array defining the topical focus areas, and audience_demographics stored as versioned JSON that describes the intended audience in categorical terms.

The audience_demographics structure begins with optional fields for age_ranges, geographies, professional_roles, interests, and income_brackets. These categories are never removed once introduced; new demographic dimensions are added as optional fields. This append-only schema evolution allows the system to learn richer audience profiles over time without breaking existing configurations. An illustrative structure might include age_ranges as an array of bracketed categories (e.g., "18-25", "26-35"), geographies as ISO country codes with region subdivisions, professional_roles as free-text categories, and a confidence_score for each demographic element indicating how strongly the brand targets that segment.

#### Brand Identities: Versioned Strategic Voice

The brand_identity table captures the core voice and personality of a brand in a way that evolves deliberately rather than ad-hoc. Rather than decomposing brand voice into separate columns for personality traits, vocabulary restrictions, or tone guidelines, the system uses a single freeform identity_prompt field. This prompt is interpreted holistically by the language models and engines, allowing them to synthesize a unified voice instruction rather than applying mechanical rules. An identity prompt might read: "You are a technical thought leader speaking to startup founders. Your voice is conversational but precise, with occasional dry humor. You explain complex topics through first-principles reasoning."

Brand identities are versioned using an append-only pattern: each version has a version number, an is_current boolean indicating the active voice, a created_at timestamp, and optionally a refined_from reference to the previous version and a refinement_reason explaining why the voice was updated. This versioning allows the system to maintain a complete audit trail of how a brand's voice has evolved, and allows rollback if a new identity performs poorly. The is_current flag ensures that only one identity is active at any given moment, though reading the version history provides context for why the current identity was chosen.

#### Channel Connections: OAuth and Platform Credentials

A channel_connection represents a specific brand's authenticated connection to an external platform (Twitter, LinkedIn, Instagram, etc.). Each connection stores the encrypted OAuth access token and refresh token using AES-256 encryption at rest, the platform-specific account ID and display name, the platform type identifier, and a URL to the platform profile. An is_active boolean allows soft-disabling a connection without deleting it. A last_used_at timestamp provides health monitoring, allowing the system to detect stale credentials or platforms that are no longer being published to. A next_refresh_at field anticipates token expiration, triggering refresh workflows before credentials become invalid.

These connections are mutable (when credentials are refreshed or profiles are updated) but not versioned, because the audit_log in the Performance Store (R5) captures every credential operation. The encryption ensures that tokens are never readable in plain text, even if someone gains direct database access.

#### Team Members: Access Control and Permissions

The team_members table creates a many-to-many relationship between authentication entities (auth.users) and tenants, establishing who has permission to access a tenant's account. Each team member record includes a role (owner, operator, or viewer) that defines baseline access levels, and a brand_permissions object stored as versioned JSON that grants granular per-brand access. An owner can invite team members, create brands, and modify account settings. An operator can create and manage content, approve tasks, and adjust publishing schedules. A viewer can only read brand and content data.

The brand_permissions JSON allows the system to grant or revoke per-brand access without changing the global role. For instance, an operator might have full access to one brand but be restricted to viewing analytics on another. This structure enables delegation—a tenant owner can empower specialists to focus on specific brand areas without exposing account-wide settings.

---

### Resource Store 2: Content Creation and Campaign Management (R2)

#### Content: The Core Publishing Entity

The content table is the nucleus of the system, storing every piece of content that flows through the platform. Content is versioned using a content_group_id: when a piece of content is revised, a new row is created with the same group_id but an incremented version number and is_current set to true on the latest version. This versioning captures the evolution of a post from idea through draft, review, and final publication.

Each content record specifies a type: post (for social updates), thread (multi-part social content), article (long-form), newsletter (periodic emails), microsite (custom web pages), or email_sequence (multi-message campaigns). The type influences which metadata is required and which engines are applicable. A status lifecycle moves content through idea → draft → review → approved → scheduled → published → archived, each transition representing a defined decision point in the workflow. A platform field indicates the target network or internal storage type.

The content payload includes title and body fields for text, media_urls as an array of object store paths, and a metadata object stored as versioned JSON. This metadata captures platform-specific requirements (character limits, image dimensions, hashtag usage, etc.) and content-specific signals (target publication time, thread structure markers, audience segment tags). The produced_by field records whether content was generated by the system (a fully autonomous engine), crafted by a human, or hybrid (AI-generated but significantly edited by a human).

A campaign_id links the content to a coordinated campaign effort, allowing the system to reason about groups of related posts. A workflow_run_id references the asynchronous workflow orchestration system, enabling the database to serve as a coordination point between long-running operations. Scheduling and publishing fields include desired_publish_at (when the human wants it published), actual_published_at (when it actually went live), and visibility_state for tracking soft-deletes and archival.

#### Content Annotations: The Engine Communication Channel

The content_annotations table is immutable and is the central hub for how the four engines (E1, E2, E3, E4) communicate insights back to the database and to each other. Rather than having each engine write to separate tables, all annotations flow into a single table with an annotation_type field that specifies the kind of insight: voice_alignment (E2's assessment of whether content aligns with brand voice), performance_insight (E3's prediction about likely engagement), strategic_guidance (E4's strategic recommendations), or content_brief (E4's structured guidance for content production).

Each annotation record includes the engine identifier (E1, E2, E3, or E4), a payload object with the detailed annotation data stored as versioned JSON, a created_at timestamp, and a confidence_score indicating how confident the engine is in its analysis. Critically, annotations are never updated or deleted; if an engine needs to revise an insight, it creates a new annotation. This immutability ensures that the entire decision history is preserved and that there are no race conditions between engines reading and writing simultaneously.

A key query pattern indexes on (content_id, annotation_type, created_at DESC) to efficiently retrieve the most recent annotation of a given type. This allows the rendering layer to quickly determine the latest voice alignment score without scanning the entire history. The immutability guarantee means that concurrent engines can safely annotate the same content without coordination; the query pattern ensures that consumers always read the latest opinion without locking.

#### Campaigns: Coordinated Content Efforts

The campaigns table groups multiple content pieces into a named initiative with a shared timeline and strategic intent. Each campaign has a status (draft, active, paused, completed), a date_range covering the campaign window, and a content_plan object stored as versioned JSON. The content_plan describes the overall strategy, target metrics, key themes, and the sequence of content pieces (which may reference content_group_ids or be aspirational placeholders for content not yet created). When a campaign plan is revised, a new version is created rather than mutating the existing plan, preserving the decision history.

#### Templates: Reusable Content Structures

The templates table stores content skeletons with variable placeholders that can be instantiated repeatedly. A template includes a name, a body with variable markers (e.g., {{brand_name}}, {{cta_url}}), an associated type (post, article, email), and a scope (system-wide, tenant-wide, or specific to a single brand). When content is created from a template, the template_id is recorded, and the instantiation process replaces placeholders with context-specific values. This structure allows the system to enforce consistency across repeated content efforts (weekly newsletters, monthly product updates) while enabling customization.

---

### Resource Store 3: Human Task Management (R3)

#### Tasks: Work Items for Human Operators

The tasks table captures action items that require human decision-making or input. Each task has a type indicating the kind of decision required: content_review (aesthetic or policy assessment), voice_approval (does this feel right for the brand?), input_needed (the engine needs specific guidance), or other domain-defined types. A status lifecycle moves tasks from open → in_progress → completed or rejected, allowing the system to track work state.

A priority field (urgent, high, normal, low) helps operators triage their queue. A context object stored as versioned JSON contains all the information needed to make the decision: for a voice_approval task, this might include the content ID, the engine's confidence score, and a brief summary of why the engine flagged it for human review. A workflow_id and workflow_signal pair enable the Task Store to coordinate with the asynchronous workflow orchestration layer (likely Temporal): when a task is completed, the system signals the workflow so it can continue or pivot based on the human's decision.

An assigned_to field records which team member owns the task, created_at and due_at timestamps structure the task timeline, and a human_response_window specifies how long the system should wait for a response before escalating or proceeding with a fallback behavior.

#### Task Responses: Immutable Decision Records

When a human responds to a task, an immutable task_response record is created. The response_type indicates the nature of the response: approval (I accept the engine's recommendation), rejection (I disagree), revision (I want changes before proceeding), text_input (the human provided new instructions), voice_input (audio feedback), or selection (the human chose one option from a set). The response_data object contains the detailed response, versioned as JSON to allow future evolution.

Like content annotations, task responses are immutable and indexed efficiently. Multiple responses to the same task are possible (iteration is allowed), and querying (task_id, created_at DESC) retrieves the most recent response quickly. This immutability ensures that if a task is resubmitted or escalated, the history is intact and auditable.

---

### Resource Store 4: Strategic Knowledge and Learning (R4)

#### Knowledge Frameworks: Versioned Strategic Insights

The knowledge_frameworks table stores strategic concepts, competitive insights, and brand-relevant learnings extracted from ingested sources. Each framework is versioned using a framework_group_id pattern: when a framework is refined or superseded, a new version is created rather than overwriting the original. This preserves the evolution of understanding as E4 encounters new information.

A framework record includes a title and description, a confidence_score (numeric, 0.0 to 1.0) that begins at 0.5 when first extracted and is updated by E4's reconcile step as more evidence accumulates, and a confidence_level categorical field (low, medium, high, validated) derived from the score. An evidence field contains a JSON array of citations: each evidence entry references the source document, the extract text, and a relevance score indicating how strongly that evidence supports the framework.

An embedding field stores a 1536-dimensional vector representation of the framework's semantic content, computed using a standard embedding model and suitable for pgvector semantic search. This allows the system to retrieve conceptually similar frameworks even if they use different terminology. A tags array provides categorical labeling (e.g., "competitive_advantage", "audience_insight", "market_trend"), and related_framework_ids references other frameworks that support or contradict this one, allowing E4 to build a knowledge graph.

#### Knowledge Sources: Ingested Material Registry

The knowledge_sources table tracks every document, article, book, or URL that the tenant ingests as strategic input. Each source has a type (book, article, url, upload), a title and metadata, and a content_hash computed from the raw content for deduplication (so the same article isn't processed twice if uploaded under different filenames).

Critically, the source record references an object_store_path pointing to Supabase Object Storage where the raw file, chapter-by-chapter summaries, and extracted frameworks are stored. This separation allows the system to manage large files and long processing artifacts outside the relational database. A processed_at timestamp and framework_count field indicate when the source was last analyzed and how many knowledge frameworks were extracted from it. If a source is re-processed (because E4's extraction techniques improved), a new processing run creates additional frameworks while preserving the old ones through versioning.

---

### Resource Store 5: Performance Measurement and Auditing (R5)

#### Content Performance: Append-Only Metrics Time Series

The content_performance table is append-only and captures observed metrics for each published piece on each platform. Rather than updating the same row as new metrics come in, each metric observation creates a new row with a measured_at timestamp and a metrics_snapshot. The snapshot includes platform-native counters: impressions (how many people saw it), engagements (likes, comments, shares), clicks, and reach (how many unique accounts). A pre-computed engagement_rate field stores the ratio of engagements to impressions, avoiding expensive calculation at query time.

The raw_platform_data field preserves the full, unmodified API response from the platform, stored as versioned JSON. This allows future analysis to extract metrics that weren't initially captured and ensures that if platform APIs change, the raw data is still available for recomputation. A content_id links to the specific version of content, so the system can trace performance back to the exact text, timing, and conditions under which the piece was published.

#### Audience Metrics: Snapshots of Follower Growth

The audience_metrics table is also append-only and captures periodic snapshots of a brand's audience on each platform. Each snapshot records a measured_at timestamp, follower counts, a followers_delta field indicating the change since the last snapshot, and demographics stored as versioned JSON. The demographics structure mirrors the audience_demographics in the Brand Store (R1) but captures observed reality rather than aspirational targeting: age distribution derived from platform analytics, active_times showing peak engagement windows by time-of-day and day-of-week, and engagement_patterns describing which content types resonate most with different audience segments.

#### A/B Tests: Structured Experimentation

The ab_tests table enables structured hypothesis testing on content and campaigns. Each test includes a title, a hypothesis field describing the specific prediction being tested, and a status (draft, running, concluded). A variants field contains versioned JSON describing the test variants—for content tests, this might specify different headlines, images, or CTAs; for scheduling tests, it might define publication times. When the test concludes, a winner_variant_id field records which variant performed best, and a statistical_significance field captures the p-value or confidence interval. Results are recorded immutably, allowing historical review of which experiments informed strategic pivots.

#### Workflow Performance: Quality Measurement for Automation

The workflow_performance table tracks the quality and reliability of automated workflows over time. For each workflow type (content_generation, scheduling_optimization, audience_targeting_refinement, etc.), the system records a success_rate (the fraction of runs that completed without human override), a human_override_rate (how often operators intervened), and a quality_score that's a composite of downstream metrics (e.g., published content engagement rates, feedback sentiment). This allows the system and its operators to see which workflows are trustworthy for higher autonomy levels and which need more human oversight.

#### Audit Log: Complete, Immutable Transaction Record

The audit_log table is append-only and never deleted. Every material action in the system produces an audit entry: when a brand voice is updated, when content is published, when a team member is invited, when credentials are refreshed, when a workflow overrides a task, etc. Each entry records an actor (which user, system process, or workflow initiated the action), an action type (create, update, delete, publish, etc.), an entity reference (the resource ID and type), and a details object with contextual information.

The audit log serves three critical functions: it provides the immutable record required for compliance and dispute resolution, it enables the system to reconstruct state at any point in time (if needed for debugging), and it decouples security and permissions checks from application code by providing a canonical record of who did what when. Queries on the audit log are typically filtered by date range, actor, and action type to investigate specific incidents or generate access reports.

---

### Cross-Cutting Design Principles

#### Versioning Strategy

The system employs three distinct strategies for state management, each chosen for specific classes of data. **Mutable entities with versioning** (brand_identities, content, knowledge_frameworks, campaigns, templates) use an append-only version pattern: a group_id or similar key groups related versions together, a version counter tracks the sequence, and an is_current boolean marks the active version. When the entity changes, a new row is inserted with incremented version and is_current toggled to the new row. This strategy preserves complete change history, enables rollback, and allows analysis of how strategic decisions evolved.

**Immutable-only entities** (content_annotations, task_responses) grow only by appending; no updates or deletions occur. This guarantees that the state read by engines and humans is consistent and that concurrent readers don't interfere with each other. These tables often have efficient query patterns using (foreign_key, created_at DESC LIMIT 1) to retrieve the latest entry.

**Append-only time series** (content_performance, audience_metrics, audit_log, ab_test_results) never update historical rows. New observations create new rows, allowing the system to maintain a complete historical record and enabling time-based analysis and forensics.

**Mutable without versioning** (tenants, brands, channel_connections, tasks, team_members, team_member_roles) allow direct updates when changes occur. These entities are typically low-volatility (account settings, platform credentials) or operational (task status), and their audit trail is sufficiently captured by the audit_log. Direct updates reduce query complexity and avoid cluttering the schema with version rows for frequently-queried operational state.

#### The Versioned DSL Pattern

Every JSONB column in the schema carries a dsl_version field as its first entry, enabling schema evolution without breaking existing code. This field is an integer, beginning at version 1. When new optional fields are introduced, the minor version increments (e.g., 1.1); when fields are removed or their types change, the major version increments (e.g., 2.0). Parsers are written to handle unknown fields gracefully (ignoring them) and to check dsl_version at the entry point. If a version is encountered that's newer than the code can handle, the system logs a warning and degrades gracefully or requests a code update.

This pattern allows the platform to evolve its DSL definitions over time without forcing simultaneous updates to all clients. For example, if campaign.content_plan initially includes only theme and content_ids, a future version might add optional fields like audience_segments or budget_allocation. Code written for version 1 will still work with version 1.x data; when the code is updated to handle budgets, it can be deployed independently and will correctly parse both old and new versions.

#### Single Identity Prompt: Holistic Voice Definition

Rather than decomposing brand voice into separate tables or columns for personality traits, vocabulary rules, tone guidelines, and style preferences, the system represents voice as a single identity_prompt text field interpreted holistically by language models. This approach acknowledges that human-readable brand voice is inherently multidimensional and interdependent: a brand that is "conversational but authoritative" requires different word choices, sentence structures, and emotional tones than one that is "playful and irreverent." Attempting to enforce these dimensions separately via lookup tables or multi-valued fields creates brittleness and loses the gestalt quality of how language actually works.

The trade-off is that brand voice is not machine-parseable into discrete rules; instead, it's semantically understood by the model. E2 (voice alignment) assesses whether content matches the prompt by computing semantic similarity, not by checking boxes. This design is more forgiving of nuance and more aligned with how humans actually understand and convey voice.

#### Audience Demographics: Growing Schema

The audience_demographics structure in both the Brand Store and Performance Store follows a principle of additive schema evolution: once a demographic category is defined, it is never removed. This ensures backward compatibility in analysis; when comparing audience metrics year-over-year, the dimensions remain constant. New demographic categories are added as optional fields. For instance, the schema might begin with age_ranges and geographies, and later add professional_roles, interests, and psychographic_traits. Code that doesn't yet know about professional_roles simply omits it from its queries and outputs; code that does know about it can leverage it for deeper audience understanding.

An illustrative structure might look like:

```typescript
interface AudienceDemographicsV1 {
  dsl_version: "1.0";
  age_ranges?: {
    bracket: "18-25" | "26-35" | "36-50" | "51-65" | "65+";
    percentage: number;
  }[];
  geographies?: {
    country_code: string;
    region?: string;
    percentage: number;
  }[];
  professional_roles?: string[];
  interests?: string[];
  income_brackets?: ("under_50k" | "50k-100k" | "100k-250k" | "250k+")[];
  confidence_score: number;
}
```

This example is illustrative, not prescriptive; implementers may choose different categorical systems or add additional dimensions as needed.

#### JSONB Payload Definitions

The system defines versioned DSL for several key JSONB payloads, each enabling a specific layer of the platform. These definitions are provided as TypeScript interfaces for clarity, but implementations may choose alternative serialization formats (Protocol Buffers, Apache Avro, etc.) provided they maintain the semantic structure and versioning discipline.

**ContentPlanV1** (campaigns.content_plan) describes the strategic direction of a campaign:

```typescript
interface ContentPlanV1 {
  dsl_version: "1.0";
  title: string;
  theme: string;
  target_metrics: {
    impressions_goal?: number;
    engagement_target?: number;
    reach_goal?: number;
  };
  key_themes: string[];
  content_pieces: {
    content_group_id?: string;
    type: "post" | "article" | "thread" | "email" | "microsite";
    title?: string;
    planned_publish_at?: string;
    status: "planned" | "in_progress" | "completed" | "skipped";
  }[];
  success_criteria: string[];
  related_assets?: string[];
}
```

**ContentMetadataV1** (content.metadata) captures platform and content-specific signals:

```typescript
interface ContentMetadataV1 {
  dsl_version: "1.0";
  platform_constraints?: {
    max_length?: number;
    recommended_image_dimensions?: { width: number; height: number };
    hashtag_limit?: number;
  };
  content_signals: {
    target_audience_segment?: string;
    cta_type?: "link" | "engagement" | "signup" | "comment" | "none";
    cta_url?: string;
    estimated_read_time_minutes?: number;
    thread_position?: number;
  };
  seo_metadata?: {
    focus_keyword?: string;
    meta_description?: string;
  };
  internal_notes?: string;
}
```

**VoiceAlignmentAnnotationV1** (content_annotations, engine E2) captures how well a piece matches brand voice:

```typescript
interface VoiceAlignmentAnnotationV1 {
  dsl_version: "1.0";
  alignment_score: number;
  key_strengths: string[];
  improvement_areas: string[];
  voice_dimensions: {
    formality: "formal" | "neutral" | "casual" | "irreverent";
    emotional_tone: "serious" | "balanced" | "playful" | "emotional";
    authority_level: "expert" | "knowledgeable" | "peer" | "learning";
  };
  explanation: string;
}
```

**PerformanceInsightAnnotationV1** (content_annotations, engine E3) predicts likely engagement:

```typescript
interface PerformanceInsightAnnotationV1 {
  dsl_version: "1.0";
  predicted_engagement_rate: number;
  confidence_in_prediction: number;
  similar_historical_content: {
    content_id: string;
    actual_engagement_rate: number;
    similarity_score: number;
  }[];
  performance_drivers: {
    factor: string;
    positive_impact: boolean;
    strength: number;
  }[];
  recommendations: string[];
}
```

**ContentBriefAnnotationV1** (content_annotations, engine E4 pre-production) structures guidance for content production:

```typescript
interface ContentBriefAnnotationV1 {
  dsl_version: "1.0";
  creative_direction: string;
  key_message: string;
  supporting_points: string[];
  target_audience_reminder: string;
  content_structure_suggestion?: string;
  relevant_knowledge_framework_ids: string[];
  tone_guidance: string;
  avoid: string[];
}
```

**StrategicGuidanceAnnotationV1** (content_annotations, engine E4 post-production) provides post-production strategic recommendations:

```typescript
interface StrategicGuidanceAnnotationV1 {
  dsl_version: "1.0";
  strategic_implications: string;
  alignment_with_brand_strategy: number;
  suggests_topic_pivot: boolean;
  suggested_follow_up_topics: string[];
  audience_insight: string;
  competitive_positioning_note?: string;
  knowledge_update_recommendation?: string;
  future_campaign_idea?: string;
}
```

Each of these structures can evolve independently; when a new field is added, the minor version increments. Implementations are encouraged to extend these schemas as needed for domain-specific requirements, provided versioning discipline is maintained.

---

### Summary

The data model captures every dimension of the Digital Presence Operating System: brand and team identity, content creation and publishing workflows, human task management, strategic knowledge accumulation, and continuous measurement. Through careful application of versioning, immutability, and append-only patterns, the schema provides complete auditability while enabling autonomous agent decision-making. The versioned JSONB DSL strategy allows the platform to evolve without code deployment synchronization, and the flexible prose-based description of tables and payloads gives implementers freedom to optimize for their specific deployment context while preserving the semantic structure and guarantees that the system depends on.


---

## 7. Platform Integration

### 7.1 Platform Capabilities Required

Each platform integration requires a distinct set of capabilities abstracted at the business operation level. Rather than enumerating specific API endpoints (which frequently change), this section describes the essential capabilities needed for each platform and the constraints that shape the implementation approach.

| Platform | Priority | Required Capabilities | Auth Approach | Key Constraints |
|----------|----------|----------------------|----------------|-----------------|
| **X** | P-01 | Post content (threads and media); retrieve post metrics (likes, retweets, replies); manage account connections; receive webhooks for account activity (new followers, mentions, direct messages) | OAuth 2.0 PKCE flow with user delegation | Paid API tier required (no free tier available); rate limits apply (15 requests/min for standard endpoints, higher for elevated tiers); thread composition requires ordered post sequencing |
| **LinkedIn** | P-02 | Post content (text, articles, carousels); retrieve engagement metrics (impressions, clicks, comments); distinguish between company pages and personal profiles; manage account connections; receive platform notifications | OAuth 2.0 with delegated user scope; requires Marketing Developer Platform approval | Marketing Developer Program approval gates access; different capabilities for personal profiles vs. company pages (publishing restricted to company pages via UGC); rate limits enforced per organization |
| **Substack** | P-03 | Post articles (HTML content); retrieve subscriber engagement; retrieve subscriber lists; manage publication settings | Currently no public API; integration deferred | No official public API available; three approaches exist with tradeoffs (email-to-post gateway, reverse-engineered private API, browser automation); architectural decision deferred to P-07 (PRE-11) |

### 7.2 Substack Integration Approach

Substack's lack of a public API creates a significant integration challenge. Three candidate approaches exist, each with distinct tradeoffs:

1. **Email-to-Post Gateway**: Use Substack's email-to-publish feature by sending posts via authenticated email. Simple to implement, no API reverse-engineering, but limited control over formatting and scheduling.

2. **Reverse-Engineered Private API**: Use observed internal Substack API calls (undocumented but used by the web interface). Offers full feature parity but carries risk of breakage if Substack's internal API changes.

3. **Browser Automation**: Use headless browser control (e.g., Playwright) to automate post creation through the web UI. Most reliable against changes but slowest, most resource-intensive, and most fragile.

The adapter pattern (described in §7.3) isolates this volatility. The integration choice is encapsulated within the Substack adapter; no other system components depend on which approach is chosen. A future pivot to a different approach requires only replacing the adapter implementation, not system-wide refactoring.

### 7.3 RA1 Platform Adapter Pattern

The RA1 module presents a clean, platform-agnostic interface to the rest of the system. All platform-specific details are hidden behind a common set of business operations:

- **distribute**: Post content to a platform (accepts platform-specific metadata like media attachments, thread structure, or article formatting; returns success confirmation and posted content ID)
- **harvest**: Retrieve analytics and engagement metrics for posted content (returns aggregated metrics like impressions, interactions, and audience demographics)
- **connect**: Establish or refresh a platform account connection (handles OAuth flows and credential refresh)
- **disconnect**: Revoke platform credentials and remove the account connection

Each platform gets a dedicated adapter implementing these four operations. The adapter encapsulates all platform volatility: API endpoint differences, authentication flows, rate limit handling, format translation, error recovery, and pagination. The RA1 adapter registry maps the platform enumeration (X, LinkedIn, Substack, etc.) to the corresponding adapter implementation. Callers invoke operations through the registry without knowing which platform they're targeting. Adding a new platform means implementing a new adapter; all existing callers automatically gain support with zero changes.

### 7.4 Platform Format Awareness

Each platform imposes distinct format constraints on content: character limits, media type support, thread structure, and HTML capability. These constraints are internal to RA1 and transparent to callers.

When content is submitted to RA1 for posting, the distribute operation receives the content as a platform-agnostic description (title, body text, media items, metadata). The adapter translates this description into the platform's native format before posting:

- **X**: 280 characters per post with automatic thread splitting for longer content. Supports up to 25 posts per thread. Media attachments limited to 4 images per post. Videos and GIFs supported. No HTML formatting (text only).

- **LinkedIn**: 3000 characters per post in text/image carousel format. Full HTML support for rich text styling. Carousel posts support up to 20 images/documents. Articles published as long-form content with full HTML rendering, images, and embeds. Company pages support Carousel Ads with specific formatting requirements.

- **Substack**: No hard character limit; supports full HTML and embedded media (images, audio, video, iframes). Sections and paid-only content supported. Format flexibility enables repurposing of long-form content without adaptation, but scheduling is restricted to publication times.

The adapter's translate operation handles content segmentation, media resizing/optimization, and format mapping. Callers never deal with these format constraints directly—they describe their intent (post this article, thread this thought), and the adapter handles mechanical adaptation to the target platform's requirements.


---

## 8. Developer Experience

### 8.1 Local Development (.devcontainer)

Full local development environment runs all services with a single `docker compose up`:

```yaml
# .devcontainer/docker-compose.yml

version: '3.9'

services:
  # Development application container
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://postgres:postgres@supabase-db:5432/postgres
      SUPABASE_URL: http://supabase-kong:8000
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      TEMPORAL_ADDRESS: temporal:7233
      TEMPORAL_NAMESPACE: default
      REDIS_URL: redis://redis:6379
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
    depends_on:
      supabase-db:
        condition: service_healthy
      temporal:
        condition: service_started
      redis:
        condition: service_healthy
    ports:
      - "3000:3000"   # C1: Task UI
      - "3001:3001"   # C2: Admin Portal
      - "8000:8000"   # C3: API Gateway
      - "8001:8001"   # I1: Realtime SSE

  # Supabase PostgreSQL (with pgvector)
  supabase-db:
    image: supabase/postgres:15.6.1.143
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    volumes:
      - supabase_db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  # Supabase Studio (web UI for DB inspection)
  supabase-studio:
    image: supabase/studio:latest
    environment:
      STUDIO_PG_META_URL: http://supabase-meta:8080
      SUPABASE_URL: http://supabase-kong:8000
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    ports:
      - "54323:3000"
    depends_on:
      - supabase-db

  # Temporal dev server (all-in-one)
  temporal:
    image: temporalio/auto-setup:latest
    environment:
      - DB=postgresql
      - DB_PORT=5433
      - POSTGRES_USER=temporal
      - POSTGRES_PWD=temporal
      - POSTGRES_SEEDS=temporal-db
    depends_on:
      temporal-db:
        condition: service_healthy
    ports:
      - "7233:7233"

  # Temporal's own PostgreSQL (separate from app DB)
  temporal-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: temporal
      POSTGRES_PASSWORD: temporal
    volumes:
      - temporal_db_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U temporal"]
      interval: 5s
      timeout: 5s
      retries: 10

  # Temporal Web UI
  temporal-ui:
    image: temporalio/ui:latest
    environment:
      TEMPORAL_ADDRESS: temporal:7233
      TEMPORAL_CORS_ORIGINS: http://localhost:8080
    ports:
      - "8080:8080"
    depends_on:
      - temporal

  # Redis (Upstash-compatible for local dev)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  supabase_db_data:
  temporal_db_data:
  redis_data:
```

### 8.2 devcontainer.json

```json
{
  "name": "Presence OS",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "bash .devcontainer/post-create.sh",
  "forwardPorts": [3000, 3001, 5432, 6379, 7233, 8000, 8001, 8080, 54323],
  "portsAttributes": {
    "3000": { "label": "Task UI (C1)" },
    "3001": { "label": "Admin Portal (C2)" },
    "8000": { "label": "API Gateway (C3)" },
    "8001": { "label": "Realtime SSE (I1)" },
    "8080": { "label": "Temporal UI" },
    "54323": { "label": "Supabase Studio" },
    "5432": { "label": "PostgreSQL", "onAutoForward": "silent" },
    "6379": { "label": "Redis", "onAutoForward": "silent" },
    "7233": { "label": "Temporal gRPC", "onAutoForward": "silent" }
  }
}
```

### 8.3 Local Dev Scripts (root package.json)

```json
{
  "scripts": {
    "dev": "turbo dev",
    "dev:task-ui": "turbo dev --filter=task-ui",
    "dev:admin": "turbo dev --filter=admin-portal",
    "dev:gateway": "turbo dev --filter=api-gateway",
    "dev:realtime": "turbo dev --filter=realtime",
    "dev:workers": "concurrently \"turbo dev --filter=presence-worker\" \"turbo dev --filter=automation-worker\" \"turbo dev --filter=account-worker\"",
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:generate": "turbo db:generate --filter=@presence-os/db",
    "db:migrate": "turbo db:migrate --filter=@presence-os/db",
    "db:studio": "supabase studio",
    "db:reset": "supabase db reset"
  }
}
```

### 8.4 CI/CD Pipeline Design

#### ci.yml — Every Push

```yaml
name: CI
on: [push]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck lint test
```

#### preview.yml — PR Preview Environments

```yaml
name: Preview
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck lint test

  deploy-previews:
    needs: test
    runs-on: ubuntu-latest
    steps:
      # Vercel: C1 Task UI preview
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_TASK_UI_PROJECT_ID }}
          working-directory: apps/task-ui

      # Vercel: C2 Admin Portal preview
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_ADMIN_PROJECT_ID }}
          working-directory: apps/admin-portal

      # Railway: PR environment for all backend services
      - uses: railway/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: api-gateway
          environment: pr-${{ github.event.pull_request.number }}

      - uses: railway/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: realtime
          environment: pr-${{ github.event.pull_request.number }}

      - uses: railway/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: presence-worker
          environment: pr-${{ github.event.pull_request.number }}

      - uses: railway/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: automation-worker
          environment: pr-${{ github.event.pull_request.number }}

      - uses: railway/deploy-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: account-worker
          environment: pr-${{ github.event.pull_request.number }}

      # Upstash: Create preview Redis database for this PR
      - name: Create Upstash Preview Redis
        env:
          UPSTASH_API_KEY: ${{ secrets.UPSTASH_API_KEY }}
          UPSTASH_EMAIL: ${{ secrets.UPSTASH_EMAIL }}
        run: |
          # Create ephemeral Upstash Redis database for PR preview
          # Database name: preview-pr-${{ github.event.pull_request.number }}
          # Inject UPSTASH_REDIS_URL into Railway PR environment
          # Cleanup: deleted on PR close via cleanup workflow
          echo "Preview Redis for PR #${{ github.event.pull_request.number }}"

      # Supabase: Branch DB is handled automatically via Supabase GitHub integration
      # (configured in Supabase dashboard → Settings → Integrations)

      # Post PR comment with all preview URLs
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Preview Environment Ready
              | Service | URL |
              |---------|-----|
              | Task UI | [Preview](https://task-ui-pr-${context.issue.number}.vercel.app) |
              | Admin Portal | [Preview](https://admin-pr-${context.issue.number}.vercel.app) |
              | API Gateway | Railway PR env |
              | Database | Supabase branch (auto) |
              | Temporal | Shared dev namespace |
              | Redis | Upstash preview (auto) |`
            });
```

#### deploy.yml — Production (Main Branch)

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo build

      # Supabase: Run migrations on production
      - uses: supabase/setup-cli@v1
      - run: supabase db push --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      # Vercel: Auto-deploys from main branch (configured in Vercel dashboard)
      # Railway: Auto-deploys from main branch (configured in Railway dashboard)
```

### 8.5 Infrastructure as Code Summary

| Concern | Location | Format |
|---------|----------|--------|
| Database schema | `packages/db/src/schema/` | Drizzle TypeScript |
| Database migrations | `supabase/migrations/` | Generated SQL |
| RLS policies | `supabase/migrations/` | SQL |
| Seed data | `supabase/seed.sql` | SQL |
| Railway service config | `workers/*/railway.json`, `apps/api-gateway/railway.json` | JSON |
| Vercel config | `apps/*/vercel.json` | JSON |
| CI/CD | `.github/workflows/` | YAML |
| Local dev | `.devcontainer/` | JSON + YAML |
| Turbo pipeline | `turbo.json` | JSON |
| TypeScript config | `tsconfig.base.json` + per-package | JSON |
| Temporal schedules | `packages/temporal-client/src/schedules.ts` | TypeScript (registered at deploy) |

**Everything is in the repo. No non-code configuration. Bad deploy = git revert.**

---

## 9. Cross-Cutting Concerns

### 9.1 U3: Logging / Monitoring

U3 is not a standalone service — it's a cross-cutting library used by every component. In our stack, it maps to:

**Structured Logging:** All services use a shared logging library (`packages/config/src/logger.ts`) built on [pino](https://getpino.io) that emits structured JSON logs with context fields (tenantId, brandId, workflowId, activityName, duration). Railway aggregates these automatically.

**Temporal Observability:** Temporal Cloud provides built-in visibility into workflow executions, activity completions, failures, and retries. The Temporal Web UI (exposed in dev at `:8080`) shows real-time workflow state. In production, Temporal Cloud's UI serves this role.

**Railway Metrics:** Railway provides built-in CPU/memory/network monitoring per service, log aggregation, and alerting. No separate monitoring service needed.

**Audit Trail:** Critical state changes (content published, workflow graduated, permission changed) are logged as structured events and can be queried via the logging backend. The `audit_log` table in the database captures high-value events for compliance.

```
packages/config/src/logger.ts → shared pino logger with tenant/brand context
Railway built-in → service metrics, log aggregation
Temporal Cloud → workflow/activity observability
audit_log table → high-value events for compliance queries
```

### 9.2 Integration Use Cases (VUC-I1, VUC-I2, VUC-I3)

The 3 Integration use cases don't require dedicated Temporal workflows — they route through existing ones via the API Gateway:

| Use Case | API Gateway Route | Routes To |
|----------|------------------|-----------|
| **VUC-I1: API Content Submission** | `POST /api/v1/content/submit` | Starts `presence.operate` workflow (same as CUC1, different entry point) |
| **VUC-I2: Platform Event Handling** | `POST /api/v1/webhooks/:platform` | Platform engagement → starts `presence.engagementResponse`. Billing webhooks → starts `account.billing`. |
| **VUC-I3: Analytics Export** | `GET /api/v1/analytics/export` | Direct database query via RA4 — no workflow needed (read-only operation) |

This means all 23 use cases are covered: 21 via dedicated Temporal workflows + 3 via API Gateway routing to existing workflows or direct queries.

### 9.3 Error Handling & Retry Strategy

Temporal provides built-in retry, timeout, and compensation capabilities that replace the need for custom error handling infrastructure. Each activity type has default timeout and retry settings appropriate to its role in the system.

**Engine activities** (E1-E4) involve AI model calls, which are expensive and variable in latency. The default configuration uses a start-to-close timeout of two minutes, an initial retry interval of five seconds with exponential backoff (coefficient of 2), and a maximum of three retry attempts. Errors that indicate invalid input or authentication failures are marked as non-retryable to avoid wasting AI tokens on requests that will never succeed.

**ResourceAccess activities** (RA1-RA4) call external APIs (platform APIs, Stripe, Supabase) or internal storage. These use a shorter start-to-close timeout of thirty seconds, faster initial retry interval of one second, and up to five retry attempts. Not-found errors and authentication errors are non-retryable. Rate limit responses (HTTP 429) trigger exponential backoff via Temporal's retry mechanism.

**AI-specific activities** (any activity using U5 for model generation) have longer timeouts to account for model response variability: five-minute start-to-close, fifteen-minute schedule-to-close, with only two retry attempts (since AI calls are expensive). Content policy violations and invalid prompt errors are non-retryable.

**Saga and Compensation Pattern**: For multi-step workflows that span multiple activities (for example, the content production workflow that creates a draft, evaluates it, and publishes it), Temporal's built-in compensation handles rollback. If a publish activity fails after content was drafted, the workflow catches the error and either retries the publish, creates a human review task, or runs compensating activities to clean up partial state. The Manager workflow code defines the compensation logic; Temporal ensures it executes reliably even if workers crash during recovery.


### 9.4 Rate Limiting & Quota Management

External API rate limits are handled at the RA layer:

| Service | Rate Limit Strategy |
|---------|-------------------|
| **OpenRouter** | Token bucket per tenant via Upstash Redis. Default: 100 req/min. Backpressure via Temporal activity retry with increasing delay. |
| **X API** | Per-app rate limits enforced in RA1 X adapter. 429 responses trigger exponential backoff via Temporal retry. |
| **LinkedIn API** | Per-app daily limits. RA1 LinkedIn adapter tracks daily usage in Redis. Rejects with clear error when limit approached. |
| **Stripe API** | Low-volume, not rate-limited in practice. Standard Temporal retry on 429/5xx. |

Tenant-level quotas (max content per day, max brands, max API calls) are enforced at the workflow level before activities are dispatched, reading quota config from the tenant's plan tier.

---

## 10. Testing, Observability & Operational Readiness

This section specifies the full testing strategy, observability stack, dashboards, alerting, on-call procedures, and operational runbooks. Every component, service, subsystem, workflow, and use case has a defined testing and monitoring contract. Nothing ships without passing every level of this pyramid.

### 10.1 Testing Strategy — The Pyramid

```
                    ┌──────────────┐
                    │   Load Tests │  ← System-wide capacity validation
                   ┌┴──────────────┴┐
                   │  Use Case Tests │  ← End-to-end use case scenarios
                  ┌┴────────────────┴┐
                  │  Workflow Tests    │  ← Temporal workflow execution
                 ┌┴──────────────────┴┐
                 │  Subsystem Tests    │  ← Vertical slice integration
                ┌┴────────────────────┴┐
                │  Service Tests        │  ← Single component integration
               ┌┴──────────────────────┴┐
               │  Module Tests           │  ← Intra-component modules
              ┌┴────────────────────────┴┐
              │  Unit Tests               │  ← Every exported function
              └──────────────────────────┘
```

**Tooling:**

| Concern | Tool | Why |
|---------|------|-----|
| Test Runner | **Vitest** | TypeScript-native, fast, workspace-aware, compatible with Turborepo caching |
| Temporal Testing | **@temporalio/testing** | In-process test server, time skipping, activity mocking |
| HTTP Mocking | **msw** (Mock Service Worker) | Intercepts at network level for RA1/RA2 platform API mocks |
| Database Testing | **Supabase local** (via Docker) | Real PostgreSQL with RLS, same engine as production |
| Load Testing | **k6** | Scriptable in JS/TS, CLI-driven, integrates with CI |
| Coverage | **v8 coverage** (via Vitest) | Built-in, no extra config |
| Snapshot/Contract | **Zod schema tests** | Schemas ARE the contracts — test schema parsing against fixtures |

**CI Integration:** All unit, module, service, and subsystem tests run in `ci.yml` on every PR. Workflow and use case tests run in `ci.yml` with the Temporal test server. Load tests run nightly on a schedule and on release tags.

---

### 10.2 Unit Testing — Every Exported Function

Every exported function in every package has at least one unit test. Unit tests are co-located in `__tests__/` directories adjacent to source files.

**By component type:**

| Component Type | What's Unit Tested | Mocking Strategy |
|----------------|-------------------|------------------|
| **E1-E4 Engines** | Prompt construction, annotation parsing, output validation, transformation logic | U5 AI responses mocked (deterministic fixtures), RA4 mocked |
| **RA1 Channel Access** | Platform adapter format translation, OAuth token refresh logic, metric normalization | HTTP responses mocked via msw |
| **RA2 Service Access** | Billing action routing, webhook payload parsing, deployment config generation | Stripe/Vercel APIs mocked via msw |
| **RA3 Conversation Access** | Message formatting, context window construction, recall ranking | Honcho API mocked |
| **RA4 Store Access** | Query construction, annotation serialization/deserialization, DSL version handling | In-memory database stubs |
| **U1 Auth** | JWT validation, RBAC permission checks, RLS policy helper functions | No external deps |
| **U2 Scheduling** | Schedule construction, cron expression generation, timezone handling | Temporal client mocked |
| **U3 Logging** | Log formatter, context enrichment, audit event construction | No external deps |
| **U4 Notification** | Notification routing logic, template rendering, delivery channel selection | Transport mocked |
| **U5 AI** | Provider routing, token counting, schema-constrained output parsing, retry logic | HTTP mocked via msw |
| **C1/C2 (Frontend)** | React component rendering, hook behavior, form validation | React Testing Library |
| **C3 API Gateway** | Route matching, middleware chains, request validation, error formatting | Supertest with mocked downstream |

**Naming convention:** `<function-name>.test.ts` adjacent to source. Test names follow `it('should <expected behavior> when <condition>')`.

**Coverage targets:**

| Package Type | Line Coverage | Branch Coverage |
|-------------|--------------|-----------------|
| Engines (E1-E4) | ≥ 90% | ≥ 85% |
| ResourceAccess (RA1-RA4) | ≥ 90% | ≥ 85% |
| Utilities (U1-U5) | ≥ 95% | ≥ 90% |
| Shared schemas | 100% | 100% |
| Frontend components | ≥ 80% | ≥ 75% |
| API Gateway routes | ≥ 90% | ≥ 85% |

---

### 10.3 Integration Testing — Module Through Use Case

Integration tests validate real component interactions at increasing scope. Each level adds real infrastructure and removes mocks.

#### 10.3.1 Module Tests — Intra-Component

Test internal module interactions within a single component. Example: E1's prompt builder → U5 AI call → annotation writer, all within the Content Engine package.

```typescript
// packages/engine-content/src/__tests__/produce.integration.test.ts
describe('E1.produce integration', () => {
  // Uses: real U5 AI (with test fixtures), mocked RA4
  it('should read ContentBrief annotation and produce platform-adapted content');
  it('should read VoiceAlignment annotation and apply corrections on revise');
  it('should handle missing annotations gracefully with default behavior');
});
```

**What's real:** Intra-package code, U5 AI utility (with deterministic test fixtures).
**What's mocked:** RA4 Store Access, external APIs.

#### 10.3.2 Service Tests — Single Component

Test a single component against real infrastructure. Example: RA1 Channel Access against a mock X API server, with a real Supabase DB.

```typescript
// packages/ra-channel/src/__tests__/distribute.service.test.ts
describe('RA1.distribute service test', () => {
  // Uses: real RA4 → real Supabase (local), msw for platform APIs
  it('should distribute content to X with correct format translation');
  it('should handle OAuth token refresh transparently');
  it('should write metrics to R5 via RA4 after successful harvest');
  it('should return clear error on rate limit (429) without retrying at this level');
});
```

**What's real:** The component under test, RA4, Supabase local, Redis local.
**What's mocked:** External platform APIs (via msw), Temporal (no workflows running).

#### 10.3.3 Subsystem Tests — Vertical Slice

Test a full vertical slice through the architecture. Each of the 5 subsystems has a test suite that validates Manager → Engine → ResourceAccess → Resource interaction.

| Subsystem | Test Scope | Key Scenarios |
|-----------|-----------|---------------|
| **Foundation** | U1-U5 + RA4 + R1-R5 | Auth flows, schema migrations, AI utility routing, store CRUD via atomic verbs |
| **Presence** | M1 + E1-E4 + RA1 + RA4 + R1-R5 | Full content production cycle including annotation pattern |
| **Account** | M3 + RA2 + RA4 + R1 | Onboarding, billing lifecycle, team management |
| **Automation** | M2 + E3 + RA4 + R5 | Workflow graduation, schedule management, A/B test conclusion |
| **Integration** | C3 + M1/M2/M3 | Webhook routing, API content submission, analytics export |

**What's real:** All components in the subsystem, Supabase local, Redis local, Temporal test server.
**What's mocked:** External APIs (platform, Stripe, Vercel) via msw.

#### 10.3.4 Workflow Tests — Temporal Execution

Every Temporal workflow has a dedicated test using `@temporalio/testing`'s `TestWorkflowEnvironment`. Activities are mocked to isolate workflow orchestration logic.

```typescript
// workers/presence/src/__tests__/presence-operate.workflow.test.ts
import { TestWorkflowEnvironment } from '@temporalio/testing';

describe('presence.operate workflow', () => {
  let env: TestWorkflowEnvironment;

  beforeAll(async () => {
    env = await TestWorkflowEnvironment.createLocal();
  });

  it('should execute annotation pattern: E4.brief → E1.produce → E2.evaluate → E3.assess → E1.revise → RA1.distribute');
  it('should create human review task when E2.evaluate returns aligned=false above threshold');
  it('should handle E1.produce failure with compensation (no orphan content)');
  it('should respect autonomy level: full-auto skips human approval');
  it('should respect autonomy level: supervised creates review task after production');
  it('should use time-skipping to validate scheduled publish timing');
  it('should propagate tenant/brand context through all activity calls');
});
```

**Workflow test matrix (all 21 workflows):**

| Manager | Workflow | Test Count (min) |
|---------|----------|-----------------|
| M1 | presence.operate | 8 |
| M1 | presence.engagementResponse | 4 |
| M1 | presence.analysisCycle | 5 |
| M1 | presence.experimentLifecycle | 6 |
| M1 | presence.identityRefinement | 4 |
| M1 | presence.knowledgeIngestion | 4 |
| M1 | presence.campaignOrchestration | 5 |
| M1 | presence.contentCalendarGeneration | 3 |
| M1 | presence.micrositeGeneration | 4 |
| M1 | presence.emailSequenceGeneration | 4 |
| M1 | presence.multiPlatformAdaptation | 3 |
| M1 | presence.knowledgeReconciliation | 3 |
| M1 | presence.voiceOnboarding | 4 |
| M1 | presence.collaborativeEditing | 3 |
| M2 | automation.workflowGraduation | 5 |
| M2 | automation.scheduleManagement | 3 |
| M2 | automation.experimentConclusion | 4 |
| M3 | account.onboarding | 5 |
| M3 | account.billing | 4 |
| M3 | account.teamManagement | 3 |
| M3 | account.brandConfiguration | 4 |

#### 10.3.5 Use Case Tests — End-to-End

Full use case tests exercise the entire system from Client entry to final state change. These run against the complete local stack (Supabase, Temporal test server, Redis, msw for external APIs).

Each of the 23 use cases (3 Core + 17 Variation + 3 Integration) has at least one happy-path and one error-path test.

```typescript
// tests/e2e/cuc1-operate-presence.e2e.test.ts
describe('CUC1: Operate a Presence — end-to-end', () => {
  it('happy path: user input → brief → produce → evaluate → assess → revise → distribute → metrics written');
  it('error path: platform publish fails → compensation → human task created');
  it('autonomy: full-auto completes without human intervention');
  it('autonomy: manual creates task at every decision point');
});
```

---

### 10.4 Load Testing

Load tests validate that the system handles expected and peak traffic without degradation. Run nightly in CI and before every release.

**Tool:** k6 (scriptable in JavaScript, CLI-driven, Grafana Cloud integration available).

**Scenarios:**

| Scenario | Description | Target | Success Criteria |
|----------|-------------|--------|-----------------|
| **Steady state** | 10 brands, each producing 3 content pieces/day, with background analysis cycles | Sustained 30 min | p95 workflow completion < 60s, zero errors |
| **Burst content** | 50 content pieces submitted simultaneously (campaign launch) | Peak burst | All workflows start within 10s, p95 completion < 120s |
| **Harvest storm** | All brands harvest metrics simultaneously (daily cron) | Concurrent 10 brands × 3 platforms | p95 < 30s per platform, no rate limit failures (backpressure works) |
| **Onboarding spike** | 5 new tenants onboarding simultaneously | Concurrent 5 | All complete within 60s |
| **Webhook flood** | 100 platform webhooks arrive in 10s | Burst | All processed, zero dropped, p95 < 5s |

**Load test infrastructure:** k6 scripts in `tests/load/`, running against a dedicated Railway environment (not preview, not production). Database seeded with representative data.

```
tests/
├── load/
│   ├── scenarios/
│   │   ├── steady-state.js
│   │   ├── burst-content.js
│   │   ├── harvest-storm.js
│   │   ├── onboarding-spike.js
│   │   └── webhook-flood.js
│   ├── helpers/
│   │   ├── auth.js           # Generate test JWTs
│   │   └── seed.js           # Seed test data
│   └── thresholds.json       # Pass/fail criteria
```

---

### 10.5 Observability Stack

We use existing managed tools — no self-hosted Grafana or Prometheus. The stack is cheap, low-ops, and sufficient for a small team.

| Layer | Tool | What It Provides |
|-------|------|-----------------|
| **Application Logs** | **Railway built-in** | Structured log aggregation, search, tail, per-service filtering |
| **Temporal Observability** | **Temporal Cloud UI** | Workflow execution history, activity timelines, failure traces, retry counts |
| **Application Metrics** | **PostHog** (free tier) | Custom events, funnels, dashboards, feature flags. Engines/RAs emit business metrics as PostHog events. |
| **Uptime & Endpoints** | **Better Uptime** (or Railway health checks) | Endpoint monitoring, status page, incident alerting |
| **Error Tracking** | **Sentry** (free tier) | Exception capture with stack traces, breadcrumbs, release tracking |
| **Database Monitoring** | **Supabase Dashboard** | Query performance, connection pooling, storage usage, RLS policy evaluation |
| **Redis Monitoring** | **Upstash Console** | Command count, memory, latency, rate limit hit counts |

**Why not Grafana/Prometheus:** For a team of 1-3 engineers, self-hosted monitoring is more burden than value. Railway + Temporal Cloud + PostHog + Sentry covers every observability need without infrastructure management. If we outgrow this, migrating to Grafana Cloud is straightforward because we emit structured logs and PostHog events with consistent schemas.

---

### 10.6 Metrics, SLIs & SLOs

#### 10.6.1 Service-Level Indicators (SLIs)

Every component emits metrics through structured logging (pino) and PostHog events. SLIs are computed from these emissions.

**Per-Engine SLIs:**

| Engine | SLI | Measurement |
|--------|-----|-------------|
| E1 Content | Production latency | Time from `produce()` call to content written |
| E1 Content | Revision rate | % of content requiring > 1 revision cycle |
| E2 Identity | Alignment rate | % of content where `evaluate()` returns `aligned: true` on first pass |
| E2 Identity | Evaluation latency | Time for `evaluate()` to complete |
| E3 Analytics | Assessment latency | Time for `assess()` to write annotation |
| E3 Analytics | Prediction accuracy | Predicted engagement vs. actual (measured after 7 days) |
| E4 Knowledge | Brief completeness | % of briefs that include ≥ 3 framework references |
| E4 Knowledge | Reconciliation delta | Average confidence score change per reconciliation cycle |

**Per-RA SLIs:**

| RA | SLI | Measurement |
|----|-----|-------------|
| RA1 Channel | Publish success rate | % of `distribute()` calls that succeed on first attempt |
| RA1 Channel | Harvest completeness | % of expected metrics successfully harvested per cycle |
| RA1 Channel | Platform latency | p95 response time per platform adapter |
| RA2 Service | Billing success rate | % of billing actions that complete without error |
| RA3 Conversation | Recall relevance | (Future: human-rated relevance of recalled context) |
| RA4 Store | Query latency | p95 for each atomic verb category |

**Per-Workflow SLIs:**

| Workflow | SLI | Target |
|----------|-----|--------|
| presence.operate | End-to-end latency (input → published) | p95 < 90s |
| presence.operate | Success rate | > 95% complete without human intervention (at full-auto) |
| presence.analysisCycle | Completion rate | 100% (scheduled, must complete) |
| automation.workflowGraduation | Assessment accuracy | (Future: human-validated graduation decisions) |
| account.onboarding | Time to first content | p95 < 5 min from signup |

#### 10.6.2 Service-Level Objectives (SLOs)

| SLO | Target | Window | Alerting Threshold |
|-----|--------|--------|--------------------|
| System availability | 99.5% | 30-day rolling | < 99% over 1 hour |
| Workflow completion rate | > 98% | 7-day rolling | < 95% over 1 hour |
| Content publish success | > 95% | 7-day rolling | < 90% over 4 hours |
| API Gateway p95 latency | < 500ms | 7-day rolling | > 1s over 15 min |
| Scheduled jobs on-time | > 99% | 7-day rolling | Any missed schedule |

---

### 10.7 Dashboards

Four dashboards, built in PostHog with data from structured logs and custom events.

#### Dashboard 1: System Health (ops — always visible)

| Panel | Source | Shows |
|-------|--------|-------|
| Workflow completion rate (24h) | Temporal Cloud metrics | Success / failure / timeout breakdown |
| Active workflow count | Temporal Cloud metrics | Current running workflows by type |
| Error rate by service | Sentry + structured logs | Errors per minute, grouped by worker/app |
| Railway service health | Railway metrics | CPU, memory, restarts per service |
| Database connections | Supabase dashboard | Active connections, pool utilization |
| Redis operations | Upstash console | Commands/sec, memory, rate limit hits |

#### Dashboard 2: Content Pipeline (product — daily review)

| Panel | Source | Shows |
|-------|--------|-------|
| Content produced today | PostHog events | Count by brand, platform, autonomy level |
| Annotation cycle health | PostHog events | Brief → Produce → Evaluate → Assess → Revise flow completion |
| Identity alignment trend | PostHog events | % aligned on first pass, 7-day trend |
| Platform publish status | PostHog events | Success/failure by platform, last 24h |
| Average time-to-publish | PostHog events | From user input to published, by brand |

#### Dashboard 3: Tenant & Billing (business — weekly review)

| Panel | Source | Shows |
|-------|--------|-------|
| Active tenants | PostHog events | Count, growth trend |
| Content volume by tenant | PostHog events | Usage vs. plan limits |
| AI token usage | PostHog events (from U5) | Tokens consumed per tenant, cost estimate |
| Billing events | PostHog events (from RA2) | Successful charges, failures, churn |
| Feature adoption | PostHog events | Which features each tenant uses |

#### Dashboard 4: Platform & External APIs (reliability — on-demand)

| Panel | Source | Shows |
|-------|--------|-------|
| Platform API success rate | PostHog events (from RA1) | Per-platform, 7-day trend |
| Platform API latency | PostHog events (from RA1) | p50/p95/p99 per platform |
| Rate limit hits | Redis + PostHog | Per-platform, per-tenant |
| OAuth token health | PostHog events (from RA1) | Tokens nearing expiry, refresh failures |
| External API dependency status | Better Uptime | Up/down for X API, LinkedIn API, Stripe, OpenRouter |

---

### 10.8 Alerting

Alerts are tiered by severity. All alerts route through the notification pipeline (U4) and external channels.

#### Alert Severity Levels

| Severity | Response Time | Channel | Examples |
|----------|--------------|---------|----------|
| **P1 — Critical** | < 15 min | SMS + Slack + PagerDuty | System down, all workflows failing, DB unreachable |
| **P2 — High** | < 1 hour | Slack + email | Platform publish failures > 50%, billing webhook failures |
| **P3 — Medium** | < 4 hours | Slack | Single platform degraded, AI latency elevated, error rate spike |
| **P4 — Low** | Next business day | Slack (low-priority channel) | Coverage gap, alignment trend declining, storage approaching limit |

#### Alert Rules

| Alert | Condition | Severity | Source |
|-------|-----------|----------|--------|
| Workflow failure spike | > 5 workflow failures in 15 min | P1 | Temporal Cloud |
| Database unreachable | Connection pool exhausted or connection timeout | P1 | Railway logs + Supabase |
| Worker crash loop | Any worker restarts > 3 times in 10 min | P1 | Railway |
| Platform publish failures | > 50% failure rate over 30 min | P2 | PostHog / Sentry |
| Billing webhook failures | Any Stripe webhook returns non-200 | P2 | Sentry |
| AI provider degraded | U5 p95 latency > 30s or error rate > 10% | P2 | PostHog / Sentry |
| Scheduled job missed | Any Temporal Schedule fires > 5 min late | P2 | Temporal Cloud |
| Single platform degraded | One platform error rate > 30% for 1 hour | P3 | PostHog |
| AI token burn rate | Tenant approaching daily token limit | P3 | PostHog |
| Error rate elevated | Any service > 5% error rate for 30 min | P3 | Sentry |
| Identity alignment declining | Brand alignment rate drops > 15% week-over-week | P4 | PostHog |
| Storage nearing limit | Supabase storage > 80% of plan | P4 | Supabase |
| Certificate/OAuth expiry | OAuth token expires within 7 days | P4 | PostHog (from RA1) |

---

### 10.9 On-Call Plan

#### Rotation

For a team of 1-3 engineers, the on-call model is simple:

- **Primary on-call:** Rotates weekly. Responsible for P1/P2 response.
- **Secondary on-call:** Available for escalation. Not paged unless primary doesn't acknowledge within 15 min.
- **Business hours coverage:** All engineers monitor Slack alerts channel.
- **Off-hours coverage:** Only P1 pages off-hours. P2-P4 wait until business hours unless trending toward P1.

#### Incident Response Procedure

```
1. ALERT FIRES
   ↓
2. ACKNOWLEDGE (< 5 min for P1, < 15 min for P2)
   ↓
3. ASSESS — Check the relevant runbook (§10.10)
   - What's the blast radius? (one tenant? all tenants? one platform?)
   - Is this a new failure or a known pattern?
   ↓
4. MITIGATE — Stop the bleeding
   - If platform API: disable the platform adapter (feature flag)
   - If AI provider: switch to fallback model via OpenRouter config
   - If database: check Supabase status page, connection pool
   - If worker: restart via Railway dashboard
   ↓
5. COMMUNICATE — Post in #incidents Slack channel
   - What: one-line description
   - Impact: who's affected
   - Status: mitigated / investigating / resolved
   ↓
6. RESOLVE — Fix the root cause
   ↓
7. POSTMORTEM — Within 48 hours for P1/P2
   - Timeline, root cause, mitigation, prevention
   - Blameless: focus on systems, not people
```

#### Escalation Path

| Step | Condition | Action |
|------|-----------|--------|
| 1 | Alert fires | Primary on-call paged |
| 2 | No ack in 15 min | Secondary on-call paged |
| 3 | No ack in 30 min | All engineers paged + Slack @channel |
| 4 | Incident > 1 hour unresolved | Evaluate: external help needed? (Supabase support, Temporal support, Railway support) |

---

### 10.10 Observability Write-ups — Operational Runbooks

Each subsystem has a runbook describing what "normal" looks like, what "bad" looks like, how to diagnose, and how to make safe changes.

#### 10.10.1 Presence Subsystem (M1 + E1-E4 + RA1)

**What normal looks like:**
- Workflow completion rate > 98%. Most workflows complete in 30-90 seconds.
- Annotation pattern completes in sequence: brief → produce → evaluate → assess → revise. Each annotation is timestamped within minutes of the previous.
- Identity alignment rate is stable (± 5% week-over-week). New brands start low (~60%) and climb over 2-4 weeks as the identity prompt refines.
- Platform publish success rate > 95%. Occasional 429s from X are expected and handled by Temporal retry.
- AI latency (U5) varies by model: 2-15s for generation, < 1s for embeddings.

**What bad looks like and how to diagnose:**

| Symptom | Likely Cause | Diagnosis Steps |
|---------|-------------|-----------------|
| Workflows stuck in "Running" for > 5 min | Activity timeout or worker crash | Check Temporal UI → find stuck workflow → check activity task queue → check Railway worker logs for OOM or crash |
| Annotation pattern incomplete (e.g., no VoiceAlignment written) | E2 activity failing silently | Check Temporal UI → workflow history → find failed E2 activity → check Sentry for E2 errors → check U5 AI responses |
| Alignment rate suddenly drops | Identity prompt corrupted or AI model change | Check brand's identity prompt version history → compare recent vs. previous → check if OpenRouter changed default model |
| Platform publish failures spike | Platform API change or rate limit | Check RA1 PostHog events → filter by platform → check msw-style error codes → check platform status page |
| Content quality degradation (human-reported) | Knowledge stale, frameworks outdated, or prompt drift | Check E4 knowledge freshness → last ingest date → reconciliation results → check E2 alignment annotations for patterns |

**Safe changes (non-degrading):**
- Adding a new platform adapter to RA1 (existing adapters unaffected)
- Updating AI model in OpenRouter config (roll back if alignment drops)
- Adjusting Temporal retry policy (only affects new workflow executions)
- Adding new annotation types (engines ignore annotations they don't recognize)

**Unsafe changes (require staged rollout):**
- Modifying the annotation pattern sequence in M1 workflows
- Changing identity prompt structure (affects all content production)
- Upgrading Temporal SDK version (test in preview env first)
- Modifying RA4 Store Access atomic verbs (breaks callers)

#### 10.10.2 Automation Subsystem (M2 + E3)

**What normal looks like:**
- Workflow graduation assessments run on schedule (weekly per brand).
- Most workflows stay at their current autonomy level. Graduations happen gradually (1-2 per month per brand).
- A/B tests run for their full duration. Conclusions happen at scheduled endpoints.
- Schedule management operations are rare (user-initiated).

**What bad looks like and how to diagnose:**

| Symptom | Likely Cause | Diagnosis Steps |
|---------|-------------|-----------------|
| Graduation assessment never fires | Temporal Schedule misconfigured or paused | Check Temporal Cloud → Schedules → find the brand's assessment schedule → check if paused or errored |
| Graduation thrashing (promoting then demoting) | Thresholds too tight or metrics volatile | Check E3 assessment history → look for oscillation pattern → review threshold config |
| A/B test never concludes | Insufficient traffic or experiment stuck | Check R5 experiment metrics → variant impression counts → if low, check if content is actually being produced for both variants |

**Safe changes:** Adjusting graduation thresholds, adding new experiment types.
**Unsafe changes:** Changing graduation state machine transitions, modifying schedule timing.

#### 10.10.3 Account Subsystem (M3 + RA2)

**What normal looks like:**
- Onboarding completes in < 5 minutes. Stripe customer created, default brand configured.
- Billing webhooks from Stripe process within seconds. Subscription state stays in sync.
- Team management operations are rare and always user-initiated.

**What bad looks like and how to diagnose:**

| Symptom | Likely Cause | Diagnosis Steps |
|---------|-------------|-----------------|
| Onboarding stuck | Stripe API failure or RA4 write failure | Check Temporal UI → onboarding workflow → find failed activity → check Sentry → check Stripe dashboard |
| Billing out of sync | Webhook delivery failure or processing error | Check Stripe webhook logs → check C3 API Gateway logs → check RA2 billing activity logs → compare Stripe state vs. R1 state |
| Team permissions wrong | RLS policy bug or role assignment error | Check user's JWT claims → check tenant_members table → check RLS policy evaluation in Supabase logs |

**Safe changes:** Adding new plan tiers, adjusting onboarding flow steps.
**Unsafe changes:** Modifying Stripe webhook processing, changing RLS policies.

#### 10.10.4 Foundation (U1-U5, RA4, I1)

**What normal looks like:**
- U1 Auth: JWT validation < 1ms. RLS policies add < 5ms to queries.
- U5 AI: Latency depends on model and task. Generation: 2-15s. Structured output: 3-20s. Embeddings: < 1s.
- RA4 Store: Query latency p95 < 50ms for simple reads, < 200ms for annotation queries with joins.
- I1 Realtime: SSE connections stable. Event delivery < 100ms from emission.

**What bad looks like and how to diagnose:**

| Symptom | Likely Cause | Diagnosis Steps |
|---------|-------------|-----------------|
| All requests 401 | Supabase Auth down or JWT signing key rotated | Check Supabase status → check JWT verification in U1 → check Supabase Auth config |
| AI responses slow or failing | OpenRouter provider degraded | Check OpenRouter status page → check U5 PostHog latency events → try fallback model |
| Database queries slow | Missing index, connection pool exhaustion, or large table scan | Check Supabase query performance dashboard → identify slow queries → check connection count → check for missing indexes on annotation tables |
| SSE connections dropping | Railway service restart or memory pressure | Check Railway service logs → check memory usage → check I1 connection count |

**Safe changes:** Adding new indexes, adding new utility functions, updating logging format.
**Unsafe changes:** Modifying RLS policies, changing JWT structure, upgrading Supabase schema.

---

### 10.11 Test Data & Fixtures

**Seed data strategy:** A `supabase/seed.sql` populates the local and test environments with representative data:

| Entity | Seed Count | Purpose |
|--------|-----------|---------|
| Tenants | 3 | Single-brand, multi-brand, max-plan |
| Brands | 5 | Different identity prompts, platforms, autonomy levels |
| Content (with annotations) | 50 | Various states: draft, reviewed, published, with full annotation chains |
| Knowledge frameworks | 10 | Representative frameworks with linked source materials |
| Performance metrics | 500 | 30 days of realistic engagement data across platforms |
| Team members | 8 | All 4 RBAC roles represented across tenants |

**AI fixture strategy:** For deterministic testing, U5 AI calls in test mode return pre-recorded fixtures. Fixtures are stored in `packages/testing/fixtures/ai/` and version-matched to prompt templates.

```
packages/testing/
├── fixtures/
│   ├── ai/                  # Deterministic AI response fixtures
│   │   ├── produce-v1.json
│   │   ├── evaluate-v1.json
│   │   ├── brief-v1.json
│   │   └── ...
│   ├── platforms/           # Mock platform API responses
│   │   ├── x-publish-success.json
│   │   ├── x-publish-rate-limited.json
│   │   ├── linkedin-metrics.json
│   │   └── ...
│   └── billing/             # Mock Stripe webhook payloads
│       ├── invoice-paid.json
│       ├── subscription-updated.json
│       └── ...
├── factories/               # Test data factories (TypeScript)
│   ├── brand.factory.ts
│   ├── content.factory.ts
│   ├── annotation.factory.ts
│   └── ...
└── helpers/
    ├── temporal.ts          # Temporal test environment setup
    ├── supabase.ts          # Local Supabase test helpers
    └── auth.ts              # Test JWT generation
```

---

## 11. Acceptance Criteria Checklist

### API & Contract Design

- [x] **OpenAPI specs defined for all inter-service HTTP endpoints** — §4.1 defines API Gateway and Realtime server endpoints. OpenAPI auto-generated from Zod schemas via `zod-to-openapi` (§4.4).
- [x] **Temporal Workflow definitions for all Managers** — §3.3 defines all M1 (14 workflows), M2 (3 workflows), M3 (4 workflows) with typed inputs/outputs/signals.
- [x] **Temporal Activity definitions for all Engines and ResourceAccess** — §3.4 defines all E1-E4, RA1-RA4, U4-U6 activity definitions in prose with constraints and behaviors.
- [x] **Zod schemas for all shared types** — §4.2 describes entity schema organization (Brand, Content, Task, Knowledge) and workflow I/O contracts in prose.
- [x] **I1 event schema defined** — §4.3 describes the SSE event taxonomy by business domain with event categories and payload descriptions.
- [x] **Service-to-service communication patterns documented** — §2.4 maps all communication routes (Railway internal, Temporal Cloud, Supabase, Upstash, external APIs).

### Auth & Data Model

- [x] **Auth model defined** — §5.1-5.3 define JWT structure, 4 RBAC roles, brand-level permissions, Supabase Auth integration.
- [x] **RLS policy design** — §5.5 describes RLS policy patterns for tenant isolation and brand-level access in prose with one illustrative SQL example.
- [x] **Data model high-level design for R1-R5** — §6 provides textbook-style explanation of all 5 resource stores, tables, design principles, versioning, and JSONB DSL definitions.

### Technology & Platform Decisions

- [x] **Platform priority list finalized** — §7.1 describes platform capabilities required at the business operation level (post, harvest, connect) for X, LinkedIn, and Substack.
- [x] **AI model selection documented** — Single model via OpenRouter + Vercel AI SDK. AI is a cross-cutting Utility (U5) — see §3.4.
- [x] **Substack integration approach decided** — §7.2 documents three options, decision deferred to P-07 with zero architecture impact (adapter pattern).

### Service Architecture & Monorepo

- [x] **Monorepo directory structure defined** — §2.1 provides complete directory tree with service boundaries.
- [x] **Temporal Worker grouping decided** — §3.2 defines 3 task queues, §3.5 shows worker registration pattern.
- [x] **Railway service topology documented** — §2.3 diagrams all services with networking and deployment notes.

### Developer Experience (DX)

- [x] **.devcontainer spec** — §8.1-8.2 define Docker Compose with Supabase, Temporal dev server, Redis, and worker services.
- [x] **Local dev runs full system** — §8.1 all services start with Docker Compose, §8.3 provides script aliases.
- [x] **CI/CD pipeline design** — §8.4 defines ci.yml, preview.yml, and deploy.yml GitHub Actions workflows.
- [x] **Every PR produces isolated preview** — §8.4 preview.yml orchestrates Vercel + Supabase branch + Railway PR env + Upstash preview Redis.
- [x] **Production = merge to main** — §8.4 deploy.yml auto-deploys on main push. No non-code config.
- [x] **Infrastructure-as-Code** — §8.5 maps every concern to its in-repo location. Everything in the repo.

### Testing, Observability & Operational Readiness

- [x] **Unit test specification** — §10.2 defines unit testing for every exported function across all component types, with coverage targets and mocking strategies.
- [x] **Integration test specification** — §10.3 defines 5 levels: module, service, subsystem, workflow (all 21 workflows), and end-to-end use case (all 23 use cases).
- [x] **Load test specification** — §10.4 defines 5 k6 scenarios (steady state, burst, harvest, onboarding, webhook flood) with success criteria.
- [x] **Observability stack** — §10.5 selects Railway + Temporal Cloud + PostHog + Sentry + Better Uptime. No self-hosted infra.
- [x] **SLIs and SLOs** — §10.6 defines per-engine, per-RA, and per-workflow SLIs with measurable targets.
- [x] **Dashboards** — §10.7 specifies 4 dashboards (System Health, Content Pipeline, Tenant/Billing, Platform APIs) with panel definitions.
- [x] **Alerting** — §10.8 defines 4 severity levels, 13 alert rules, routing channels, and response time targets.
- [x] **On-call plan** — §10.9 defines rotation, incident response procedure, and escalation path.
- [x] **Operational runbooks** — §10.10 provides per-subsystem write-ups: normal behavior, failure symptoms, diagnosis steps, safe vs. unsafe changes.
- [x] **Test data strategy** — §10.11 defines seed data, AI fixtures, platform mocks, and test factories.
