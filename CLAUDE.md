# Digital Presence Operating System - Claude Code Context

## Working with Paul

### Communication Style
- **Be direct and efficient.** Skip preamble and get to the point.
- **Show reasoning, not just conclusions.** Externalize thinking so Paul can push back or adopt frameworks.
- **Mutual respect over status games.** Neither condescending nor falsely humble—just accurate signal.
- **Notice drift, name it.** When exploring tangents, flag it: "We've drifted into X. Continue or return to Y?"

### What Paul Values
- **Depth AND velocity.** He wants to understand WHY things work while also shipping fast.
- **Build to understand.** Creating things IS the learning, not preparation for it.
- **Reduce "what to do" ambiguity.** Clear next steps > vague directions. Help structure ambiguous tasks.
- **Concrete solutions + better ways of thinking.** Both outcomes matter.

### The Depth vs Velocity Tension

Paul operates with two drives that create productive tension:

**Depth:** He loves first-principles thinking, understanding _why_ things work, connecting ideas across domains. He wants to understand the system, not just build it.

**Velocity:** He also wants to move fast, ship work, iterate on real feedback rather than endless planning.

Neither is wrong. The best work honors both—deep enough to be sound, fast enough to get feedback. Help Paul find the right balance for each task rather than defaulting to one mode.

### Growth Edge
Paul is actively building conscientiousness—following through on commitments, especially small recurring ones. Support this with systems that reduce willpower load rather than pushing harder. When he seems stuck on a low-interest task, help break it into smaller steps rather than lecturing about mindset.

### Mindset Triggers

**Critical feedback** hits hardest. If something isn't working, frame it as "the approach" not "you."

**High-effort + low-interest tasks** create a conscientiousness trap. For boring-but-important work, help build systems that reduce willpower load rather than pushing harder.

### Task-Switching Depletes Willpower

Paul can code for hours without noticing time pass. But switching between cognitively different tasks drains willpower fast. The more ambiguity about _what to do_ (vs _how to perform_), the faster it depletes.

**What helps:**
- Clear systems and frameworks that reduce in-the-moment decision-making
- Having context on tasks before starting (not figuring it out on the fly)
- The task structure in Linear exists precisely for this

---

## Project Overview

**Digital Presence Operating System** is an AI-powered autonomous agent platform for managing social media presences across multiple brands and channels. The system learns each brand's voice through observation and feedback, produces platform-native content, distributes it across channels, harvests performance metrics, and progressively graduates workflows from human-supervised to fully autonomous operation.

**Primary goal:** Build a production-ready presence management platform where AI agents operate brand presences with increasing autonomy — producing content, analyzing performance, evolving brand identity, and graduating workflows — all orchestrated through Temporal Cloud with proper multi-tenant access controls.

**Architecture:** 26 components across 4 layers + utilities, following Righting Software methodology (volatility-based decomposition, layered architecture). 3 Clients, 3 Managers, 4 Engines, 4 ResourceAccess, 5 Resources, 6 Utilities, 1 Infrastructure service.

---

## What We're Building

An AI-powered presence management platform that:

1. **Produces** brand-voice-aligned content via the Content Engine (E1), guided by strategic briefs from the Knowledge Engine (E4)
2. **Evolves** brand identity through observation, user correction, and performance feedback via the Identity Engine (E2)
3. **Distributes** content across platforms (X, LinkedIn, Substack) and harvests metrics via Channel Access (RA1)
4. **Analyzes** performance and runs experiments via the Analytics Engine (E3)
5. **Graduates** workflows from human-supervised to autonomous via the Process Manager (M2)
6. **Orchestrates** all workflows through the Presence Manager (M1) using Temporal Cloud
7. **Manages** multi-tenant accounts, billing, and team permissions via the Tenant Manager (M3)

**Key Insight:** Engines communicate through versioned, immutable annotations stored via ResourceAccess — not direct calls. This Annotation Pattern preserves the closed architecture while enabling rich cross-engine data flow. The Manager orchestrates sequence; Engines own their domain reasoning.

**Output:** Autonomous brand presences that learn, adapt, and improve with decreasing human intervention over time.

---

## Architecture (Righting Software Methodology)

This architecture was designed using **volatility-based decomposition**, NOT functional decomposition. Each component encapsulates an area of likely change—this is the core insight that makes the design resilient.

### Why This Matters

When you're implementing, constantly ask:
- "What might change here?" not "What does this do?"
- "Would this force changes elsewhere if requirements shift?"
- "Is this the right layer for this logic?"

If you catch yourself naming something by its function (ReportingService, DataProcessor), stop. That's functional decomposition. Name it by what volatility it encapsulates.

### Layered Structure (26 Components)

```
CLIENTS (WHO uses it)
├── C1: Task Interface - Next.js operator dashboard for content review, task management
├── C2: Admin Portal - Next.js admin UI for tenant/brand configuration
└── C3: API Gateway - Hono REST/webhook entry point for external integrations

MANAGERS (WHAT workflows/sequences — Temporal Workflows)
├── M1: Presence Manager - Core orchestrator (14 workflows: operate, evolve, content approval, etc.)
├── M2: Process Manager - Automated workflow execution, monitoring, degradation
└── M3: Tenant Manager - Onboarding, brand config, billing, team management

ENGINES (HOW business logic works — Temporal Activities)
├── E1: Content Engine - Content production volatility (produce, revise, compose, sequence)
├── E2: Identity Engine - Brand identity volatility (evaluate, refine, absorb)
├── E3: Analytics Engine - Performance analysis volatility (assess, synthesize, evaluateWorkflow)
└── E4: Knowledge Engine - Strategic reasoning volatility (brief, annotate, ingest, reconcile)

RESOURCE ACCESS (WHERE data lives — Temporal Activities)
├── RA1: Channel Access - Platform API volatility (distribute, harvest, connect, disconnect)
├── RA2: Service Access - External service volatility (processBilling, deployAsset)
├── RA3: Content Process Artifact Access - Storage for R1-R3 (brand, content, tasks)
└── RA4: Performance & Knowledge Artifact Access - Storage for R4-R5 (knowledge, metrics)

RESOURCES (Storage — Supabase PostgreSQL + pgvector)
├── R1: Brand Store - tenants, brands, brand_identities, channel_connections, team_members
├── R2: Content Store - content (versioned), content_annotations (immutable), campaigns, templates
├── R3: Task Store - tasks (workflow signal coordination), task_responses (immutable)
├── R4: Knowledge Store - knowledge_frameworks (pgvector embeddings), knowledge_sources
└── R5: Performance Store - content_performance (append-only), audience_metrics, ab_tests

UTILITIES (cross-cutting)
├── U1: Auth - Supabase Auth + JWT + RBAC middleware
├── U2: Scheduling - Temporal Schedules for recurring pipelines
├── U3: Logging & Monitoring - Structured logging, health checks
├── U4: Notification - SSE alerts (real-time) + email notifications (async)
├── U5: AI - Vercel AI SDK + OpenRouter (library, not Temporal activity)
└── U6: Conversation - Honcho SDK for conversational memory (library, not Temporal activity)

INFRASTRUCTURE
└── I1: Message Bus - Thin REST/SSE layer for real-time client updates (NOT Temporal)
```

### Component Type Context

| Layer           | Role                 | What It Should Do                      | What It Should NOT Do           |
| --------------- | -------------------- | -------------------------------------- | ------------------------------- |
| Client          | Present interface    | Accept requests, return responses      | Contain business logic          |
| Manager         | Orchestrate workflow | Coordinate components, handle sequence | Implement algorithms            |
| Engine          | Execute logic        | Implement business rules               | Store data, orchestrate others  |
| Resource Access | Abstract storage     | Business verb operations               | CRUD operations, business logic |
| Utility         | Cross-cutting        | One capability, used anywhere          | Orchestrate workflows           |

**The hallmark of a bad design is when any change affects the client.** If you find yourself modifying Client code because business logic changed, something is in the wrong layer.

### Key Constraints

- **26 components** (15 core building blocks + 5 Resources + 6 Utilities) - Well-factored for this complexity
- **3 Managers** - Well under the 8+ failure threshold. M1 (Presence), M2 (Process), M3 (Tenant)
- **4 Engines for 3 Managers** - Healthy ratio per Löwy's golden ratio guidance
- **Closed architecture** - Calls flow DOWN: Clients → Managers → Engines → ResourceAccess → Resources
- **Managers don't call Managers synchronously** - M-to-M via Temporal child workflows or signals only
- **Engines communicate via Annotations** - Not direct calls. Written to/read from DB via ResourceAccess
- **ResourceAccess exposes business verbs, NOT CRUD** - If you see Read/Write/Update, wrong abstraction
- **RA3 covers R1-R3 (content process), RA4 covers R4-R5 (performance/knowledge)** - Split by lifecycle cadence

---

## Righting Software Principles

### Decompose by Volatility, Not Function
Components encapsulate what might change. If a component is named after a function (ReportingService), that's a smell. Ask: "What volatility does this contain?"

### ~10 Building Blocks
We have 15 core building blocks (3C + 3M + 4E + 4RA + 1I) plus 5 Resources and 6 Utilities — appropriate for this complexity. 30+ = over-decomposed. 3 = hiding complexity.

### Architecture IS the Project
One activity per component. Dependencies between activities = dependencies between components.

### PERT Estimation
```
Expected = (Optimistic + 4×MostLikely + Pessimistic) / 6
```
Use 5-day quantum. Map to Fibonacci: 2, 3, 5, 8, 13.

### Risk Target: 0.50
Target project risk ≤ 0.50. Risk > 0.75 = unacceptable. Mitigate with decompressed schedule or phased approach.

---

## Critical Path

```
PRE-1 (Requirements) → PRE-2 (DB Schema) → PRE-3 (DB Infra) → PRE-4 (Store Access RA3+RA4)
  → PRE-15 (Content Engine E1) → PRE-16 (Analytics Engine E3)
  → PRE-18 (Presence Manager M1) → PRE-19 (Task Interface C1)
  → PRE-25 (Presence Integration Testing) → PRE-27 (Cross-Subsystem Integration Testing)
  → PRE-28 (System Testing) → PRE-29 (Documentation)
```

**Critical Path Items (zero float):** PRE-1, PRE-2, PRE-3, PRE-4, PRE-15, PRE-16, PRE-18, PRE-19, PRE-25, PRE-27, PRE-28, PRE-29

**Near-Critical (low float):** PRE-14 (Identity Engine E2), PRE-17 (Knowledge Engine E4)

**Items with Float (can slip):** PRE-5 (Message Bus I1), PRE-6 (Auth U1), PRE-7 (Scheduling U2), PRE-8 (Logging U3), PRE-9 (Notification U4), PRE-10 (Deployment Infra), PRE-11 (Channel Access RA1), PRE-12 (Service Access RA2), PRE-13 (Conversation U6), PRE-20 (Tenant Manager M3), PRE-21 (Admin Portal C2), PRE-22 (Process Manager M2), PRE-23 (API Gateway C3), PRE-24 (Foundation Integration Testing), PRE-26 (Account Integration Testing)

**Key Bottleneck:** PRE-4 (Store Access) unblocks 6 downstream issues. It is the gateway to all Engine and Manager work.

**Implication:** Always prioritize critical path tasks. If blocked on critical path, that's THE problem to solve. Working on non-critical tasks while critical ones wait = wasted time.

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy (Keep Main Context Clean)
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
- Critical path items can be parallelized by spawning subagents for non-critical dependencies

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

### Simplicity First
- Make every change as simple as possible
- Impact minimal code
- No features beyond what was asked
- No abstractions for single-use code
- If you write 200 lines and it could be 50, rewrite it

### No Laziness
- Find root causes
- No temporary fixes
- Senior developer standards

### Minimal Impact
- Changes should only touch what's necessary
- Avoid introducing bugs

### Karpathy Guidelines

**Think Before Coding:**
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them—don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**Surgical Changes:**
- Don't "improve" adjacent code, comments, or formatting
- Don't refactor things that aren't broken
- Match existing style, even if you'd do it differently
- If you notice unrelated dead code, mention it—don't delete it
- Remove imports/variables/functions that YOUR changes made unused
- Don't remove pre-existing dead code unless asked

**Goal-Driven Execution:**
- Transform tasks into verifiable goals
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

---

## When You're Unsure

1. **Architecture question?** Check if component encapsulates a volatility. If named after function, reconsider.
2. **Where does this code go?** Use the WHO/WHAT/HOW/WHERE questions from layered architecture.
3. **How to test this AI feature?** Define success criteria first (AI Engineering principle).
4. **Dependencies unclear?** Check the dependency table below or Linear project board.

---

## Anti-Patterns to Catch Yourself On

These are the traps. When you notice them, stop and reconsider:

1. **Functional decomposition** - Naming things by what they do (ReportingService). Ask "what might change?" instead.

2. **Client orchestration** - Client code calling multiple services and stitching results. Clients should call ONE Manager.

3. **Service chaining** - A→B→C creates tight coupling. Use Manager orchestration instead.

4. **The "Reporting Component" trap** - Reports are CLIENTS that read data and render it. There is no "Reporting" component.

5. **Open architecture** - "Any component can call any" feels flexible but creates spaghetti. Enforce layer boundaries.

6. **Speculative over-engineering** - "What if someday we need [unlikely scenario]?" If rare AND can only be encapsulated poorly, don't encapsulate.

7. **CRUD in ResourceAccess** - Read/Write/Update/Get/Set are data operations. Use business verbs instead.

8. **Assuming instead of asking** - Don't silently pick an interpretation. If ambiguous, surface the options.

---

## AI Engineering Principles

### Evaluation First
Before building any AI feature, define: "How will we know if this works?"
- What minimum accuracy makes this useful?
- What's the failure mode when AI is wrong?

### Adaptation Hierarchy
When AI performance is insufficient:
```
PROMPTING (always first)
    ↓ exhausted?
RAG (for information gaps)
    ↓ exhausted?
FINETUNING (for behavioral changes)
    ↓ still insufficient?
RECONSIDER USE CASE
```

### Progressive Architecture
Add complexity only when benefit clearly exceeds new failure modes:
```
Level 0: Query → Model → Response (start here)
Level 1: Add Retrieval (when model knowledge insufficient)
Level 2: Add Guardrails (when harmful outputs observed)
Level 3: Add Routing (when different queries need different handling)
Level 4: Add Caching (after stabilization)
Level 5: Add Agency (when multi-step reasoning required)
```

### Quality-Latency-Cost Triangle
Every optimization involves tradeoffs. Identify which is the constraint, then optimize accordingly.

### Three Gulfs Diagnostic

When AI "isn't working," diagnose via Three Gulfs:

| Gulf | Diagnostic Question | If Yes → Action |
|------|---------------------|-----------------|
| **Comprehension** | Do we understand what the data looks like and how the system actually behaves? | Analyze more traces, sample diverse inputs |
| **Specification** | Does the prompt/pipeline make requirements explicit? | Tighten prompt, add constraints, specify edge cases |
| **Generalization** | Is the LLM inconsistent despite clear specification? | Measure failure rate, consider stronger interventions |

---

## Linear Project Structure

**Project:** Digital Presence Operating System
**Team:** Presence (Peauts workspace)
**Project ID:** `76cdb06b-80f9-4446-98f6-a708869f4047`
**Team ID:** `17457a91-4b6b-4067-8389-83b4db1104f5`

### Milestones

| Milestone | Focus |
|-----------|-------|
| Phase 1: Foundation + Identity Discovery | Requirements, DB, infra, auth, scheduling, RA access layers, identity engine |
| Phase 2: Content Production | Content engine, analytics engine, presence manager |
| Phase 3: Full Presence | Knowledge engine, task interface, conversation access |
| Phase 4: Account + Automation + Integration | Tenant manager, admin portal, process manager, API gateway, testing, docs |

### Issue Reference (PRE-1 through PRE-29)

| Issue | Title | Phase | Critical Path |
|-------|-------|-------|---------------|
| PRE-1 | X-01: Requirements & Detailed Design | 1 | Yes |
| PRE-2 | X-02: Database Schema Design | 1 | Yes |
| PRE-3 | F-01: Database Infrastructure (R1-R5) | 1 | Yes |
| PRE-4 | F-02: Store Access (RA3 + RA4) | 1 | Yes |
| PRE-5 | F-03: Message Bus (I1) | 1 | No |
| PRE-6 | F-04: Auth & Authorization (U1) | 1 | No |
| PRE-7 | F-05: Scheduling (U2) | 1 | No |
| PRE-8 | F-06: Logging & Monitoring (U3) | 1 | No |
| PRE-9 | F-07: Notification (U4) | 1 | No |
| PRE-10 | X-05: Deployment Infrastructure | 1 | No |
| PRE-11 | P-07: Channel Access (RA1) | 1 | No |
| PRE-12 | P-08: Service Access (RA2) | 1 | No |
| PRE-13 | P-09: Conversation Memory (U6 — Honcho) | 3 | No |
| PRE-14 | P-04: Identity Engine (E2) | 1 | Near-Critical |
| PRE-15 | P-03: Content Engine (E1) | 2 | Yes |
| PRE-16 | P-05: Analytics Engine (E3) | 2 | Yes |
| PRE-17 | P-06: Knowledge Engine (E4) | 3 | Near-Critical |
| PRE-18 | P-02: Presence Manager (M1) — Core Orchestrator | 2 | Yes |
| PRE-19 | P-01: Task Interface (C1) | 3 | Yes |
| PRE-20 | A-02: Tenant Manager (M3) | 4 | No |
| PRE-21 | A-01: Admin Portal (C2) | 4 | No |
| PRE-22 | W-01: Process Manager (M2) | 4 | No |
| PRE-23 | I-01: API Gateway (C3) | 4 | No |
| PRE-24 | X-07: Foundation Integration Testing | 4 | No |
| PRE-25 | X-08: Presence Integration Testing | 4 | Yes |
| PRE-26 | X-09: Account Integration Testing | 4 | No |
| PRE-27 | X-03: Cross-Subsystem Integration Testing | 4 | Yes |
| PRE-28 | X-04: System Testing — End-to-End | 4 | Yes |
| PRE-29 | X-06: Documentation — API Docs, Guides, ADRs | 4 | Yes |

### Linear API

Use the Linear MCP tools for issue operations. Key: issues need UUIDs (not identifiers like "PRE-1") for mutations.

```
# List issues
mcp__claude_ai_Linear__list_issues(team: "Presence")

# Get issue details
mcp__claude_ai_Linear__get_issue(issueId: "<UUID>")

# Update issue status
mcp__claude_ai_Linear__update_issue(issueId: "<UUID>", stateId: "<state-UUID>")
```

---

## Development Workflow

1. **Pick an issue** from Linear (start with critical path, respect dependencies)
2. **Read the issue description** - contains acceptance criteria, technical context, dependencies
3. **Update status** - Set to "In Progress" via Linear MCP
4. **Plan** - Enter plan mode for non-trivial tasks
5. **Implement** following the architecture (respect layer boundaries)
6. **Test** at component boundary
7. **Verify** - Run tests, check logs, demonstrate correctness
8. **Mark complete** when acceptance criteria met
9. **Update Linear** - Set to "Done"

---

## Honcho MCP Integration

Honcho provides AI-native memory—custom reasoning models that learn continually about users.

### What is Honcho?

Honcho is an infrastructure layer for building AI agents with memory and social cognition. It enables personalized AI interactions by building coherent models of user psychology over time. The Honcho MCP server simplifies the integration to just 3 essential functions.

### Step 1: Start New Conversation (First Message Only)

When a user begins a new conversation, always call `start_conversation`:

```text
start_conversation
```

**Returns**: A session ID that you must store and use for all subsequent interactions in this conversation.

### Step 2: Get Personalized Insights (When Helpful)

Before responding to any user message, you can query for personalization insights:

```text
get_personalization_insights
session_id: [SESSION_ID_FROM_STEP_1]
query: [YOUR_QUESTION]
```

This query takes a bit of time, so it's best to only perform it when you need personalized insights. If the query can be responded to effectively using what you already know about the user, just go ahead and answer it.

**Example Queries**:
- "What does this message reveal about the user's communication preferences?"
- "How formal or casual should I be with the user based on our history?"
- "What is the user really asking for beyond their explicit question?"
- "What emotional state might the user be in right now?"

### Step 3: Respond to User

Craft your response using any insights gained from Step 2.

### Step 4: Store the Conversation Turn (After Each Exchange)

**CRITICAL**: Always store both the user's message AND your response using `add_turn`:

```text
add_turn
session_id: [SESSION_ID_FROM_STEP_1]
messages: [
  {
    "role": "user",
    "content": "[USER'S_EXACT_MESSAGE]"
  },
  {
    "role": "assistant",
    "content": "[YOUR_EXACT_RESPONSE]"
  }
]
```

### Key Principles

1. **Always start with `start_conversation` for new conversations**
2. **Store every message exchange with `add_turn`**
3. **Use `get_personalization_insights` strategically for better responses**
4. **Never expose technical details to the user**
5. **The system maintains context automatically between sessions**

---

## Working Agreements

1. **Plan mode for non-trivial tasks** - Enter plan mode for 3+ step tasks
2. **One task at a time** - Complete before moving to next (reduces context-switching drain)
3. **Acceptance criteria are truth** - Task done when all criteria pass
4. **Update Linear** - Status reflects reality
5. **Critical path first** - When choosing what to work on
6. **Artifacts prove completion** - PR, tests, docs as specified
7. **Layer boundaries matter** - Don't put logic in wrong layer
8. **Show reasoning** - When proposing an approach, explain why
9. **Name drift** - If we're off-topic, note it and decide together whether to continue
10. **Capture lessons** - After corrections, update `tasks/lessons.md`
11. **Verify before done** - Run tests, check logs, demonstrate correctness
12. **Surgical changes only** - Touch only what the task requires
