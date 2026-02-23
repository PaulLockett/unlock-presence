# Digital Presence Operating System: Use Case Test Itemization

**Document Purpose:** Comprehensive enumeration of all 23 use cases with detailed test scenarios, serving as a direct test plan for implementation.

**System Context:** Digital Presence Operating System with 3 Core Use Cases (CUC), 17 Variation Use Cases (VUC), and 3 Integration Use Cases (VUC-I). Components: C1-C3 (Clients), I1 (Infra), M1-M3 (Managers), E1-E4 (Engines), RA1-RA4 (ResourceAccess), R1-R5 (Resources), U1-U6 (Utilities).

---

## CORE USE CASES (CUC)

### CUC1: Operate a Presence

**Description:** User provides input; system executes full content operation workflow: E4 briefs, E1 produces, E2 evaluates, E3 assesses, E1 revises, RA1 distributes, metrics harvested.

**Trigger:** User submits operational request (content piece, campaign, engagement response) via C1/C2 client interface.

**Key Actors/Components:** M1 (Presence Manager), E1 (Content Engine), E2 (Identity Engine), E3 (Analytics Engine), E4 (Knowledge Engine), RA1 (Channel Access), RA4 (Performance & Knowledge Artifact Access), U4 (Notification), U5 (AI), U6 (Conversation)

**Component Call Chain:** C1/C2 → M1( E4 → U5 → RA4, E1 → U5 → U6 → RA3, E2 → U5 → RA3, E3 → U5 → RA4, E1 → U5 → RA3, RA1, U4 )

**Happy Path Test Scenarios:**

1. **Test CUC1-001: Single Content Piece Production**
   - User submits: "Create LinkedIn post about Q1 insights"
   - M1 orchestrates workflow
   - E4 retrieves brand knowledge, crafts brief (via U5 call to AI)
   - E1 generates post using brief (assertion: output contains brand voice)
   - E2 validates identity alignment (assertion: confidence score > 0.8)
   - E3 analyzes metrics requirements (assertion: recommends optimal posting time)
   - E1 revises based on feedback
   - RA1 distributes to LinkedIn channel (assertion: post live within 60 seconds)
   - RA4 harvests baseline metrics within 5 minutes
   - U4 notifies user of completion

2. **Test CUC1-002: Multi-Platform Campaign Execution**
   - User submits: "Launch 3-piece thought leadership campaign"
   - M1 orchestrates execution
   - E4 briefs on strategic alignment to annual goals
   - E1 produces: LinkedIn article, Twitter thread, blog post
   - E2 evaluates all 3 pieces for cohesion (assertion: consistency score > 0.85)
   - E3 assesses optimal sequencing (assertion: time gaps reflect platform engagement patterns)
   - E1 revises pieces based on sequence feedback
   - RA1 distributes across all channels (assertion: LinkedIn first, Twitter 30 mins later, blog indexed within 2 hours)
   - Metrics dashboard shows all 3 pieces' engagement within 10 minutes

3. **Test CUC1-003: Real-Time Engagement Response**
   - User submits: Response to competitor announcement
   - M1 orchestrates engagement response
   - E4 analyzes competitive context (assertion: brief includes market positioning)
   - E1 drafts response (assertion: draft ready < 2 minutes)
   - E2 validates brand voice consistency
   - E3 assesses timing criticality (assertion: high urgency flagged if within 1 hour of trigger)
   - E1 refines for speed/quality tradeoff
   - RA1 publishes response (assertion: live within 5 minutes if autonomous mode)
   - System logs response time and initial engagement metrics

4. **Test CUC1-004: Revision Loop and Approval**
   - User submits content request with specific constraints ("under 280 characters, Q1-focused")
   - M1 orchestrates approval flow
   - E4 briefs with constraint context
   - E1 produces draft violating constraints (assertion: violates character limit)
   - E2 flags constraint violation (assertion: identity check catches it)
   - E1 revises to meet constraints (assertion: final output <= 280 characters)
   - RA1 distributes corrected version
   - Assertion: Revision log shows 2+ iterations before publication

**Error/Edge Case Test Scenarios:**

1. **Test CUC1-E01: Missing Brand Knowledge**
   - User submits request for new brand vertical not in knowledge base
   - E4 returns empty/insufficient brief (assertion: brief confidence score < 0.3)
   - System flags for human review before E1 production starts
   - Assertion: Content not produced; escalation notification sent

2. **Test CUC1-E02: Channel Unavailable**
   - User requests distribution to channel that's offline/disconnected
   - RA1 detects unavailable channel (assertion: error logged with timestamp)
   - System queues content, alerts user (assertion: alert within 30 seconds)
   - System retries distribution every 5 minutes for 2 hours
   - Assertion: Once channel available, distribution completes automatically

3. **Test CUC1-E03: Metrics Harvesting Failure**
   - RA4 attempts to fetch metrics but platform API rate-limited
   - System gracefully degrades (assertion: harvesting retried with exponential backoff)
   - Dashboard shows "Last sync: X minutes ago" rather than blocking UI
   - Assertion: CUC1 completes even if metrics delayed by 30 minutes

4. **Test CUC1-E04: E2 Identity Confidence Below Threshold**
   - E2 evaluates content, returns confidence score of 0.65 (below 0.8 threshold)
   - System flags for human review (assertion: content held from distribution)
   - User can override (assertion: override logged with timestamp, user ID)
   - Assertion: Override allows distribution; flag added to audit trail

---

### CUC2: Evolve Understanding

**Description:** Triggered monthly. E4 ingests new knowledge (market trends, user corrections), reconciles frameworks, E2 refines brand identity with evolved context.

**Trigger:** Monthly scheduler fires (1st day of month), or on-demand user trigger in settings.

**Key Actors/Components:** E4 (Knowledge Engine), E2 (Identity Engine), M1 (Presence Manager), RA4 (Performance & Knowledge Artifact Access), R4 (Knowledge & Learning)

**Component Call Chain:** U2(scheduled) → M1( E4 → U5 → RA4, E4 → U5 → RA4, E2 → U5 → RA3, U4 )

**Happy Path Test Scenarios:**

1. **Test CUC2-001: Monthly Framework Reconciliation**
   - Monthly trigger fires
   - M1 orchestrates knowledge evolution
   - E4 queries R4 for: (a) new market signals collected in prior month, (b) user correction annotations (from VUC-K2), (c) engagement performance trends
   - E4 reconciles frameworks (assertion: reconciliation produces updated positioning statement)
   - E2 ingests updated positioning (assertion: E2 annotations on brand entity timestamp current reconciliation)
   - Dashboard shows "Brand Understanding Updated: [date]"
   - Assertion: E1 uses updated positioning for next content production

2. **Test CUC2-002: User Correction Integration**
   - During month, user corrected voice in 3 content pieces (via VUC-K2 workflow)
   - CUC2 trigger fires
   - M1 orchestrates evolution workflow
   - E4 ingests these 3 corrections (assertion: all corrections loaded into knowledge context)
   - E4 reconciles: "User corrections indicate greater emphasis on data storytelling"
   - E2 updates brand voice profile (assertion: E2 annotations reflect new emphasis)
   - Next E1 production uses updated profile (assertion: E1 produces content with 15% more data narrative)

3. **Test CUC2-003: Multi-Brand Evolution**
   - Tenant has 3 brands; each has separate knowledge graphs
   - CUC2 trigger fires
   - M1 orchestrates evolution for each brand
   - E4 processes brand A (assertion: produces evolution summary A)
   - E4 processes brand B (assertion: produces evolution summary B)
   - E4 processes brand C (assertion: produces evolution summary C)
   - E2 refines identity for each brand independently (assertion: 3 separate identity updates)
   - Assertion: Updates don't cross-contaminate (Brand A voice unchanged by Brand C learning)

**Error/Edge Case Test Scenarios:**

1. **Test CUC2-E01: No New Data Available**
   - Monthly trigger fires, but no corrections/signals collected in prior month
   - E4 returns "no updates required" (assertion: graceful no-op)
   - System logs "CUC2 triggered; no changes detected" (assertion: log entry created)
   - Next CUC1 execution uses existing frameworks (no degradation)

2. **Test CUC2-E02: Conflicting Corrections**
   - E4 ingests 2 corrections: "tone should be formal" vs. "tone should be casual"
   - E4 flags conflict (assertion: conflict logged with source annotations)
   - System escalates to human review (assertion: escalation notification sent with both corrections highlighted)
   - Assertion: Brand identity not updated until human resolves conflict

3. **Test CUC2-E03: Framework Reconciliation Timeout**
   - E4 reconciliation process exceeds 5-minute timeout (large knowledge graph)
   - System interrupts, rolls back to prior framework version (assertion: rollback logged)
   - User notified: "Framework update incomplete; using previous version"
   - Assertion: Next scheduled run retries; no data loss

---

### CUC3: Graduate Workflow

**Description:** Autonomous workflow readiness assessment, approval, execution. Phase A: E3 assesses workflow readiness. Phase B: Human approves graduation. Phase C: M2 executes graduated workflow autonomously.

**Trigger:** User initiates "Graduate Workflow" action in M1, or system auto-suggests after N successful completions (N=10).

**Key Actors/Components:** E3 (Analytics Engine), M1 (Presence Manager), M2 (Process Manager), C1/C2 (Clients), RA4 (Performance & Knowledge Artifact Access)

**Component Call Chain (Phase A-B):** C1/C2 → M1( E3 → RA4, U4 )
**Component Call Chain (Phase C):** M1 →(queued) M2( E4 → U5 → RA4, E1 → U5 → RA3, E2 → U5 → RA3, E3 → RA4, RA1, U4 )

**Happy Path Test Scenarios:**

1. **Test CUC3-001: Phase A - Readiness Assessment**
   - User creates workflow: "Weekly LinkedIn post every Monday 9 AM"
   - User executes workflow 10 times over 10 weeks (via CUC1)
   - User triggers graduation
   - M1 routes to E3 Phase A: Analyzes 10 prior executions (assertion: loads all 10 execution records)
   - E3 calculates metrics: success rate, revision count, engagement variance (assertion: success rate = 100%, avg revisions = 1.2, engagement variance = 12%)
   - E3 produces readiness report (assertion: report contains: "READY" status, confidence score 0.92, risk factors = none)

2. **Test CUC3-002: Phase B - Human Approval**
   - E3 readiness report displayed to user
   - User reviews report (assertion: displays success rate, revision history, engagement trends)
   - User clicks "Approve Graduation"
   - System logs approval (assertion: audit record: user ID, timestamp, approval reason field)
   - Status changes to "Graduated: Pending Autonomy Enablement"

3. **Test CUC3-003: Phase C - Autonomous Execution**
   - Week 11 arrives, scheduled workflow trigger fires
   - M2 detects graduated workflow (assertion: M2 loads workflow definition with "autonomous: true" flag)
   - M2 orchestrates E4 → E1 → E2 → E3 → revision → RA1 without human intervention
   - Content produced, evaluated, distributed (assertion: all steps complete without waiting for user approval)
   - Metrics harvested automatically (assertion: harvesting completes within 5 minutes of distribution)
   - User notified: "Autonomous execution completed: [content summary]"

4. **Test CUC3-004: Graduated Workflow Maintenance**
   - Graduated workflow runs autonomously for 4 consecutive weeks
   - E3 monitors performance (assertion: engagement metrics collected after each execution)
   - Dashboard shows: "Autonomous: 4/4 successful, avg engagement +8%"
   - Assertion: Workflow remains graduated if metrics remain above threshold

**Autonomy Level Variations:**

- **Manual:** Each execution requires user approval before RA1 distribution. Test: User clicks "Approve" button; content distributes.
- **Suggest:** System drafts, user reviews suggestions, approves distribution. Test: User sees "Suggested Edits" button; accepts or rejects.
- **Draft:** System produces drafts for user review without distribution step. Test: Content appears in drafts folder; not distributed until user action.
- **Autonomous:** System executes full CUC1 without human intervention. Test: Content produced, evaluated, distributed automatically; user notified post-distribution.

**Error/Edge Case Test Scenarios:**

1. **Test CUC3-E01: Insufficient Execution History**
   - User attempts graduation after only 3 executions (< 10 threshold)
   - E3 Phase A returns "INSUFFICIENT_HISTORY" (assertion: message: "Requires 10 executions; current: 3")
   - System disables graduation button
   - Assertion: User must complete 7 more executions before graduation available

2. **Test CUC3-E02: High Revision Variance**
   - E3 analyzes 10 executions; avg revisions = 5, variance = 3 (high volatility)
   - E3 returns "UNCERTAIN" status (assertion: confidence score = 0.42)
   - Graduation prevented with message: "Workflow too variable; requires stabilization"
   - Assertion: User must improve consistency before graduating

3. **Test CUC3-E03: Autonomy Reversion on Failure**
   - Graduated workflow runs autonomously; execution 5 fails (E1 produces low-quality content, E2 rejects)
   - System logs failure (assertion: failure reason recorded)
   - If failure rate reaches 2 in 5 executions, system reverts to "Suggest" autonomy level (assertion: user notified: "Autonomy reduced to 'Suggest'; manual review required")
   - Assertion: Workflow can re-graduate after 5 consecutive successful suggest-level executions

---

## VARIATION USE CASES (VUC) — PRODUCTION

### VUC-P1: Content Approval Flow

**Description:** Human reviews AI-produced content before distribution. System surfaces key content attributes for human decision-making.

**Trigger:** User enables "Require Approval" mode, or E2 identity confidence below threshold.

**Key Actors/Components:** E1 (Content Engine), E2 (Identity Engine), M1 (Presence Manager), C1/C2 (Clients), RA1 (Channel Access), RA3 (Content Process Artifact Access)

**Component Call Chain:** C1/C2 → M1( E1 → U5 → RA3, E2 → U5 → RA3, RA3 [store approval], RA1, U4 )

**Happy Path Test Scenarios:**

1. **Test VUC-P1-001: Approval UI Presentation**
   - E1 produces content draft
   - M1 routes to approval queue via RA3 store
   - UI displays: (a) content preview, (b) E2 confidence score, (c) suggested revisions, (d) scheduled channels, (e) estimated reach/engagement
   - User sees all attributes within 2 seconds
   - Assertion: Approval UI fully renders without timeout

2. **Test VUC-P1-002: Approve and Distribute**
   - User reviews content, clicks "Approve"
   - System logs approval via RA3 (assertion: audit record includes user ID, timestamp, content hash)
   - RA1 immediately distributes to all scheduled channels
   - Assertion: Distribution begins < 2 seconds after approval click

3. **Test VUC-P1-003: Reject with Feedback**
   - User reviews content, identifies grammatical error
   - User clicks "Reject" and enters feedback: "Fix comma in second paragraph"
   - M1 routes back to E1 with feedback annotation (assertion: annotation includes user feedback text, timestamp)
   - E1 produces revision (assertion: revision reflects user feedback)
   - Content re-routed to approval queue
   - User approves revised version
   - Assertion: Revision history shows: original → rejected → feedback → revised → approved

4. **Test VUC-P1-004: Bulk Approval**
   - 5 content pieces queued for approval (e.g., 5-piece campaign)
   - User views approval queue (assertion: displays all 5 pieces)
   - User selects all 5, clicks "Approve All"
   - System logs 5 separate approval records via RA3 (assertion: each has unique timestamp, within 1 second of each other)
   - RA1 distributes all 5 pieces with appropriate timing
   - Assertion: All 5 live within 5 minutes

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P1-E01: Approval Timeout**
   - Content queued for approval 4 hours ago
   - System displays "Pending since: 4 hours ago" warning
   - User action: Approve or reject (assertion: prevents stale content distribution)

2. **Test VUC-P1-E02: Approve Already-Distributed Content**
   - Race condition: Content auto-distributes (autonomy=autonomous), user clicks approve simultaneously
   - System detects content already distributed (assertion: content record already marked "live")
   - UI shows: "Content already published [timestamp]"
   - Assertion: No double-distribution occurs

---

### VUC-P2: Campaign Orchestration

**Description:** Coordinated multi-piece campaign with sequencing, timing, and cross-piece coherence validation.

**Trigger:** User requests "Campaign: [name]" with 2+ pieces and timing specifications.

**Key Actors/Components:** E1 (Content Engine), E2 (Identity Engine), E3 (Analytics Engine), M1 (Presence Manager), RA1 (Channel Access), RA4 (Performance & Knowledge Artifact Access), E4 (Knowledge Engine)

**Component Call Chain:** C1/C2 → M1( E4 → U5 → RA4, E1 → U5 → RA3, E2 → U5 → RA3, E3 → U5 → RA4, RA1, U4 ) [loop per campaign piece]

**Happy Path Test Scenarios:**

1. **Test VUC-P2-001: Campaign Brief and Sequencing**
   - User requests: "3-piece thought leadership campaign on AI trends"
   - System creates campaign entity (assertion: campaign ID generated, status = "drafting")
   - M1 orchestrates workflow via E4
   - E4 produces unified campaign brief (assertion: brief includes: theme, target audience, KPIs, piece sequencing)
   - E1 produces piece 1 (LinkedIn article), piece 2 (Twitter thread), piece 3 (newsletter)
   - E2 validates cross-piece coherence (assertion: coherence score > 0.85, common themes identified)
   - E3 recommends timing: piece 1 → 2 hours → piece 2 → 24 hours → piece 3
   - Assertion: Campaign shows planned schedule with all timing visible

2. **Test VUC-P2-002: Campaign Distribution with Sequencing**
   - User approves campaign
   - M1 orchestrates timed distribution via RA1
   - Piece 1 distributes at T+0 (assertion: live status within 60 seconds)
   - System waits 2 hours (assertion: T+120 min)
   - Piece 2 distributes at T+120 min (assertion: live status confirmed)
   - System waits 24 hours (assertion: T+1440 min)
   - Piece 3 distributes at T+1440 min (assertion: live status confirmed)
   - Campaign dashboard shows: "3/3 pieces distributed"
   - Assertion: All timing windows respected; no pieces publish out of sequence

3. **Test VUC-P2-003: Campaign Analytics Dashboard**
   - Campaign distributed (all 3 pieces live)
   - Dashboard shows: piece 1 engagement, piece 2 engagement, piece 3 engagement
   - Cross-piece metrics: "Combined reach: 5,000, engagement rate: 3.2%, conversation threads: 12"
   - Assertion: Metrics refresh every 5 minutes during first 24 hours
   - Assertion: Campaign shows unified impact view (not siloed by piece)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P2-E01: Campaign Piece Rejected Mid-Campaign**
   - Pieces 1 & 2 distributed, piece 3 queued for approval
   - User rejects piece 3 with feedback
   - System re-routes piece 3 to E1 (assertion: campaign status = "paused_pending_piece_3_revision")
   - E1 produces revision
   - User approves revised piece 3
   - System resumes timing (waits 24 hours from piece 2 distribution, then distributes piece 3)
   - Assertion: Campaign completes without timing reset

2. **Test VUC-P2-E02: Channel Unavailable Mid-Campaign**
   - Piece 2 scheduled for Twitter, but Twitter disconnected at T+120 min
   - System logs error (assertion: error timestamp matches intended distribution time)
   - System retries every 5 minutes for 2 hours
   - If still unavailable, escalates to user with options: retry, skip, use alternative channel
   - Assertion: Campaign progress tracked; user can recover without data loss

---

### VUC-P3: Engagement Response

**Description:** React to platform engagement events (mentions, comments, DMs) with contextual, brand-aligned responses.

**Trigger:** Platform webhook fires (new mention, comment, DM) via C3 (API Gateway).

**Key Actors/Components:** C3 (API Gateway), M1 (Presence Manager), E1 (Content Engine), E2 (Identity Engine), E4 (Knowledge Engine), RA1 (Channel Access)

**Component Call Chain:** C3(webhook) → M1( E4 → U5 → U6 → RA4, E1 → U5 → U6 → RA3, E2 → U5 → RA3, RA1, U4 )

**Happy Path Test Scenarios:**

1. **Test VUC-P3-001: Mention Response Generation**
   - User A mentions tenant on Twitter: "@TenantHandle Great insights on AI!"
   - C3 (API Gateway) receives webhook (assertion: webhook received within 2 seconds of mention)
   - M1 routes to engagement response handler (assertion: routing logged)
   - E4 analyzes context: mention content, user A profile, prior tenant responses
   - E1 generates response with U6 (Conversation SDK): "Thanks for the kind words! Glad the analysis resonated. What aspect interests you most?"
   - E2 validates brand voice (assertion: confidence > 0.8)
   - RA1 publishes response as reply
   - Assertion: Response published within 5 minutes of mention

2. **Test VUC-P3-002: Comment Response with Engagement**
   - User B comments on tenant LinkedIn post: "How did you measure this impact?"
   - C3 receives webhook (assertion: webhook includes full comment text, user B profile URL)
   - M1 orchestrates response via E4
   - E4 retrieves measurement methodology from knowledge graph
   - E1 generates detailed response with 2-3 sentences explaining methodology
   - E2 validates (assertion: response cites supporting data without quoting proprietary info)
   - RA1 publishes as nested comment reply
   - Assertion: Response appears within 10 minutes; maintains conversation thread

3. **Test VUC-P3-003: Batch Response to Multiple Engagements**
   - 3 mentions arrive within 2 minutes
   - System queues all 3 (assertion: engagement queue shows 3 items)
   - M1 processes queue in order (assertion: each gets separate processing timestamp)
   - E1 generates 3 distinct responses (assertion: no template reuse; each contextual)
   - All 3 published within 10 minutes
   - Assertion: No duplicate responses; each user receives unique reply

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P3-E01: Negative/Hostile Comment**
   - User C posts: "Your company is full of BS. Prove these metrics exist."
   - E4 flags as "high-negativity engagement" (assertion: flag added)
   - E1 skips generation (assertion: system avoids auto-response to hostility)
   - System escalates to user with suggestion: "Recommend human review before responding"
   - Assertion: User can approve/customize response before publishing, or skip

2. **Test VUC-P3-E02: Off-Platform Response Required**
   - User D: Direct message on Twitter: "Can we discuss partnership?"
   - C3 captures DM via webhook (assertion: DM routed to engagement handler)
   - E1 recognizes partnership inquiry (assertion: classification = "business_inquiry")
   - System routes to user with summary: "New partnership inquiry from [User D profile]. Recommend human response."
   - Assertion: Auto-response generation skipped for business-critical engagements

---

### VUC-P4: Growth Task Generation

**Description:** System generates high-impact growth-oriented tasks (cold outreach, collaboration opportunities, audience expansion) based on analytics and market position.

**Trigger:** User enables "Growth Mode" in settings, or monthly scheduler triggers.

**Key Actors/Components:** E3 (Analytics Engine), E4 (Knowledge Engine), M1 (Presence Manager), RA4 (Performance & Knowledge Artifact Access), RA3 (Content Process Artifact Access)

**Component Call Chain:** U2(scheduled)/C1 → M1( E3 → U5 → RA4, E4 → U5 → RA4, RA3 [create tasks] )

**Happy Path Test Scenarios:**

1. **Test VUC-P4-001: Growth Opportunity Identification**
   - Monthly growth task generation triggered
   - M1 orchestrates growth analysis
   - E3 analyzes performance data: (a) top-performing content topics, (b) audience demographics, (c) engagement patterns
   - E4 analyzes market: (a) emerging opportunities in tenant's vertical, (b) complementary brands, (c) influencer landscape
   - System generates 5 growth tasks:
     - Task 1: "Outreach to [Influencer A] re: AI trends collaboration"
     - Task 2: "Guest article pitch to [Publication B] targeting [Audience]"
     - Task 3: "Launch LinkedIn newsletter segment (high engagement opportunity)"
     - Task 4: "Develop webinar partnership with [Complementary Brand]"
     - Task 5: "Expand into TikTok (emerging audience demographic identified)"
   - Tasks displayed to user (assertion: each task includes rationale, estimated impact, effort level)

2. **Test VUC-P4-002: Task Approval and Workflow Generation**
   - User reviews task 2: "Guest article pitch to [Publication B]"
   - User clicks "Approve Task"
   - M1 generates workflow: research publication, draft pitch, send pitch, follow up
   - User can: (a) accept workflow as-is, (b) customize, (c) delegate to team member
   - Assertion: Workflow visible in task detail; ready to execute

3. **Test VUC-P4-003: Growth Task Tracking**
   - User executes task 1 (outreach to influencer)
   - Task status: "In Progress" → User drafts outreach email
   - User logs outcome: "Email sent; awaiting response"
   - E3 flags in analytics: "Growth initiative: 1 active outreach"
   - System tracks: outreach date, response date (if applicable), outcome
   - Assertion: Growth impact measured and reported in monthly analytics

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P4-E01: Insufficient Data for Recommendations**
   - New brand created; only 2 pieces of content posted
   - E3/E4 analysis returns: "Insufficient performance data. Minimum 10 content pieces recommended."
   - Growth task generation deferred with message: "Growth analysis available after 10 content pieces. Current: 2/10."
   - Assertion: System gracefully degrades; no invalid recommendations offered

---

### VUC-P5: Voice Discovery

**Description:** Extract brand voice from user-provided samples (prior content, brand guidelines, conversation examples). System learns voice patterns, tone, vocabulary, structure.

**Trigger:** New brand creation, or user manually initiates "Refine Voice" action.

**Key Actors/Components:** E2 (Identity Engine), E4 (Knowledge Engine), C1/C2 (Clients), RA4 (Performance & Knowledge Artifact Access), RA3 (Content Process Artifact Access)

**Component Call Chain:** C1/C2 → M1( E2 → U5 → RA3, E4 → U5 → RA4, RA3 [store voice profile] )

**Happy Path Test Scenarios:**

1. **Test VUC-P5-001: Voice Analysis from Sample Content**
   - User uploads 5 prior pieces of content (blog posts, LinkedIn articles)
   - System extracts text (assertion: character count > 5,000 total)
   - M1 orchestrates voice analysis via E2
   - E2 analyzes voice: (a) sentence length, (b) vocabulary complexity, (c) tone (formal/casual), (d) narrative structure, (e) key phrases
   - E2 produces voice profile:
     - Tone: "Professional with accessible language"
     - Avg sentence length: 18 words (moderate)
     - Key phrases: ["strategic thinking", "data-driven", "innovation"]
     - Formality score: 0.7 (professional)
   - Voice profile saved to RA3 (assertion: profile timestamped and versioned)

2. **Test VUC-P5-002: Voice Validation Against Future Content**
   - Voice profile established from samples
   - User requests new content via CUC1
   - E1 generates content using learned voice profile
   - E2 validates: Generated content voice similarity to profile > 0.85 (assertion: high confidence)
   - Content approved with note: "Matches learned voice profile"
   - Assertion: Voice consistency maintained across new content

3. **Test VUC-P5-003: Multi-Sample Voice Consolidation**
   - User provides samples from multiple sources: (a) 3 blog posts, (b) 2 LinkedIn articles, (c) company website copy
   - System analyzes all samples separately (assertion: 5 voice profiles extracted)
   - M1 orchestrates consolidation via E2
   - E2 consolidates: finds common patterns (assertion: consolidated profile derived from consensus)
   - E2 flags outliers: "Blog post #1 uses more casual tone than others" (assertion: anomaly noted)
   - Consolidated profile shown to user with breakdown
   - User approves consolidated profile (assertion: profile set as primary for brand)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P5-E01: Contradictory Samples**
   - User provides samples with very different voices (formal academic + casual social media)
   - E2 analysis produces: "High variance detected (voice variance = 0.65, threshold = 0.3)"
   - System prompts: "Samples show different styles. Which is primary voice?" with options
   - User selects primary (assertion: profile created from selected sample set)
   - Assertion: Ambiguity resolved by user; prevents poor voice learning

---

### VUC-P6: Multi-Brand Batch

**Description:** Operate multiple brands in parallel with separate knowledge graphs, identities, and workflows. Ensure no cross-brand contamination.

**Trigger:** Tenant with multiple brands initiates batch operation (e.g., "Operate all 3 brands today").

**Key Actors/Components:** M1 (Presence Manager), C1/C2 (Clients), E1-E4 (Engines), RA1-RA4 (ResourceAccess), R4 (Knowledge & Learning per brand)

**Component Call Chain:** C1/C2 → M1( →(queued child) M1[brand A], →(queued child) M1[brand B], →(queued child) M1[brand C] )

**Happy Path Test Scenarios:**

1. **Test VUC-P6-001: Parallel Brand Content Production**
   - Tenant manages: Brand A (SaaS), Brand B (Consulting), Brand C (Non-profit)
   - User requests: "Operate all 3 brands; produce weekly content for each"
   - M1 spawns 3 separate child M1 workflows (queued) via Temporal, one per brand
   - Each M1 executes CUC1 in parallel:
     - Brand A: E4 uses Brand A knowledge graph, E1 produces SaaS content, E2 validates Brand A voice
     - Brand B: E4 uses Brand B knowledge graph, E1 produces consulting content, E2 validates Brand B voice
     - Brand C: E4 uses Brand C knowledge graph, E1 produces nonprofit content, E2 validates Brand C voice
   - All 3 complete independently (assertion: no blocking between brands)
   - 3 content pieces distributed across 3 channel sets (assertion: Brand A content → Brand A channels only)

2. **Test VUC-P6-002: Brand Isolation in Knowledge**
   - Brand A knowledge graph updated with correction: "Tone more data-driven"
   - CUC2 executes for Brand A (assertion: only Brand A knowledge graph updated)
   - Brand B and Brand C knowledge graphs unchanged (assertion: verified no cross-brand data update)
   - Next content production: Brand B maintains consulting tone, Brand C maintains nonprofit tone

3. **Test VUC-P6-003: Batch Monitoring Dashboard**
   - Batch operation runs (3 brands × 1 content piece each)
   - Dashboard shows real-time status:
     - Brand A: "Producing... (E1 in progress)"
     - Brand B: "Evaluating... (E2 in progress)"
     - Brand C: "Distributing... (RA1 in progress)"
   - User can monitor all 3 simultaneously (assertion: no single brand blocks UI)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P6-E01: Single Brand Failure in Batch**
   - Batch running for 3 brands; Brand B E1 fails (generation error)
   - Brand A and C continue unaffected (assertion: continue to completion)
   - Brand B status: "Error: Content generation failed" (assertion: error message specific to Brand B)
   - Batch result: "2/3 successful; 1 failed"
   - Assertion: User can retry Brand B independently without re-running A & C

---

### VUC-P7: Microsite Generation

**Description:** Generate and deploy static microsite (landing page, resource hub) for a specific campaign or initiative. Includes design, copy, and integration with social channels.

**Trigger:** User requests "Create Microsite: [name]" or campaign graduation includes microsite deployment.

**Key Actors/Components:** E1 (Content Engine), RA2 (Service Access), RA1 (Channel Access), M1 (Presence Manager)

**Component Call Chain:** C1/C2 → M1( E1 → U5 → RA3, E2 → U5 → RA3, RA2 [deploy microsite], RA1 [link to channels] )

**Happy Path Test Scenarios:**

1. **Test VUC-P7-001: Microsite Generation from Campaign**
   - Campaign (VUC-P2) distributed with 5 pieces on AI trends
   - User requests: "Create hub microsite for AI campaign"
   - M1 orchestrates microsite generation
   - E1 generates microsite structure: homepage, 5 resource pages (one per campaign piece), FAQ, CTA
   - Copy generated: landing headline, section intros, CTA text
   - System assigns design template (assertion: template matches brand identity from E2)
   - Microsite generated (assertion: HTML/CSS/JS bundle created, structure shown in preview)
   - User approves design and copy

2. **Test VUC-P7-002: Microsite Deployment and Distribution**
   - User clicks "Deploy Microsite"
   - RA2 hosts microsite (assertion: subdomain assigned: microsites-{tenant}-{campaign}.com)
   - RA1 publishes microsite link in campaign social posts (assertion: link updated in existing posts if applicable)
   - Dashboard shows: "Microsite live: [URL], traffic: [real-time counter]"
   - Assertion: Microsite accessible and responsive within 30 seconds of deploy

3. **Test VUC-P7-003: Microsite Analytics Integration**
   - Microsite live for 7 days
   - RA4 harvests microsite traffic analytics: page views, scroll depth, CTA clicks, conversions
   - Dashboard shows: microsite metrics compared to social campaign metrics
   - User can filter analytics by traffic source (assertion: "Comes from: LinkedIn (45%), Twitter (30%), Email (25%)")

**Error/Edge Case Test Scenarios:**

1. **Test VUC-P7-E01: Subdomain Collision**
   - User creates microsite; requested subdomain already taken
   - System generates alternative: microsites-{tenant}-{campaign}-2.com
   - User approved alternative (assertion: no blocking; auto-recovery)

---

## VARIATION USE CASES (VUC) — KNOWLEDGE

### VUC-K1: A/B Content Testing

**Description:** Run structured A/B experiment on content variations. System generates variant, distributes to cohorts, measures performance differential, recommends winning variant.

**Trigger:** User requests "Create A/B test" or system suggests based on low engagement content.

**Key Actors/Components:** E1 (Content Engine), E3 (Analytics Engine), M1 (Presence Manager), RA1 (Channel Access), RA4 (Performance & Knowledge Artifact Access)

**Component Call Chain:** C1/C2 → M1( E1 → U5 → RA3, RA1 [distribute variants], E3 → RA4 [analyze results], RA4 [record conclusions] )

**Happy Path Test Scenarios:**

1. **Test VUC-K1-001: A/B Test Setup**
   - User requests: "A/B test: headline variations for LinkedIn post"
   - M1 orchestrates test setup
   - E1 generates: Variant A (current headline), Variant B (alternative headline)
   - System calculates required sample size (assertion: "Need 200 impressions per variant for statistical significance")
   - User sets: audience split (50/50), test duration (7 days), success metric (click-through rate)
   - E3 calculates statistical power (assertion: power > 0.8 for 14-day duration)
   - Test set up (assertion: test ID generated, variants stored)

2. **Test VUC-K1-002: A/B Deployment and Tracking**
   - RA1 distributes Variant A to audience cohort 1, Variant B to cohort 2 (assertion: cohort split tracked)
   - System tracks: impressions, clicks, engagement, conversions for each variant hourly
   - Dashboard shows real-time comparison: Variant A CTR 2.5%, Variant B CTR 3.2%
   - Test runs for 7 days (assertion: metrics collected daily)

3. **Test VUC-K1-003: A/B Results and Recommendation**
   - Test completes (7 days, 200+ impressions per variant achieved)
   - E3 analyzes results: Variant B wins with 3.2% CTR vs. 2.5% (15% improvement)
   - Statistical significance test passes (p-value = 0.03, p < 0.05)
   - E3 recommends: "Variant B confirmed winner. Recommend using headline for future content."
   - Recommendation applied to future content generation (assertion: E1 uses winning variant pattern for similar content)

4. **Test VUC-K1-004: Multi-Variant Testing**
   - User creates 3-variant test: headline, image, CTA text
   - System generates 3 variants × 3 dimensions = 9 combinations (factorial design)
   - User selects subset (3 variants to test; image held constant)
   - RA1 distributes 3 variants with equal audience split (assertion: 1/3 cohort each)
   - Dashboard shows 3-way comparison over 7 days
   - Results: Variant 2 wins (assertion: statistical significance confirmed across all 3)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-K1-E01: Insufficient Sample Size**
   - Test runs for 3 days; only 50 impressions per variant (goal: 200)
   - System displays: "Test in progress. Minimum sample not reached. Current: 50/200 per variant."
   - Test extends automatically to 7 days
   - Assertion: Results withheld until sample size sufficient

---

### VUC-K2: User Correction Processing

**Description:** User corrects brand voice, positioning, or content quality in a content piece. System logs correction as knowledge annotation, prioritizes for CUC2 reconciliation.

**Trigger:** User clicks "Correct Voice," "Correct Positioning," or "Flag Quality Issue" on any content piece (produced or third-party).

**Key Actors/Components:** E2 (Identity Engine), E4 (Knowledge Engine), M1 (Presence Manager), RA4 (Performance & Knowledge Artifact Access), RA3 (Content Process Artifact Access)

**Component Call Chain:** C1/C2 → M1( E2 → U5, RA3 [store correction annotation], RA4 [flag for CUC2] )

**Happy Path Test Scenarios:**

1. **Test VUC-K2-001: Voice Correction Capture**
   - E1-produced content published
   - User reads: "This feels too formal for our brand"
   - User clicks "Correct Voice" button
   - UI shows: "What's the issue?" dropdown, text input for feedback
   - User selects: "Tone too formal," enters: "We usually use more conversational language"
   - System creates correction annotation (assertion: annotation includes: content ID, correction type, user feedback, timestamp, user ID)
   - Annotation linked to brand entity's knowledge via RA4 (assertion: correction stored in R4)

2. **Test VUC-K2-002: Positioning Correction**
   - E2-validated content shows "Positioning: [description]"
   - User disagrees: "This misrepresents our market focus"
   - User clicks "Correct Positioning"
   - User enters: "We focus on enterprise, not SMB. Content should emphasize scale, compliance, security."
   - System creates positioning correction annotation (assertion: annotation type = "positioning_clarification")
   - Annotation linked to knowledge graph via RA4 (assertion: flagged for CUC2 reconciliation)

3. **Test VUC-K2-003: Quality Issue Escalation**
   - User flags content: "Factual error: Stat outdated (from 2022, we now have 2024 data)"
   - User clicks "Flag Quality Issue"
   - System creates quality issue annotation (assertion: annotation type = "quality_issue", severity = "high" if factual error)
   - Content automatically flagged for review (assertion: audit trail note: "Quality issue flagged; user review recommended")

4. **Test VUC-K2-004: Correction Batching for CUC2**
   - User generates 5 corrections over 3 weeks (voice, positioning, quality issues)
   - Monthly CUC2 trigger fires
   - M1 orchestrates evolution
   - E4 ingests all 5 corrections (assertion: "5 user corrections loaded into knowledge context")
   - E4 reconciles frameworks using corrections (assertion: each correction weighted appropriately)
   - E2 refines identity based on consolidated feedback (assertion: identity update reflects user patterns)
   - Next content generation uses updated understanding (assertion: voice shift apparent in next E1 output)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-K2-E01: Duplicate Correction Prevention**
   - User flags same content piece twice with same correction
   - System detects duplicate (assertion: "You've already flagged this content for this issue")
   - Prevents duplicate annotation (assertion: only one correction stored for this piece)

---

### VUC-K3: Cross-Brand Knowledge Transfer

**Description:** Share successful frameworks, voice patterns, and positioning across brands while respecting brand isolation. User initiates "learn from Brand A approach for Brand B."

**Trigger:** User manually initiates, or system suggests after observing performance pattern disparity.

**Key Actors/Components:** E2 (Identity Engine), E4 (Knowledge Engine), M1 (Presence Manager), RA4 (Performance & Knowledge Artifact Access)

**Component Call Chain:** C1/C2 → M1( E4 → U5 → RA4 [read source brand], E2 → U5 → RA3 [merge into target brand], RA4 [record transfer] )

**Happy Path Test Scenarios:**

1. **Test VUC-K3-001: Cross-Brand Learning Initiation**
   - Tenant operates: Brand A (high engagement, formal tone), Brand B (lower engagement, casual tone)
   - User observes: Brand A content outperforms Brand B by 40%
   - User initiates: "Learn from Brand A voice approach for Brand B"
   - M1 orchestrates transfer via E4
   - E4 extracts Brand A voice patterns from knowledge graph via RA4 (assertion: voice profile exported)
   - System presents: "Brand A voice characteristics: [profile summary]"
   - User reviews and accepts (assertion: user sees preview of potential Brand B voice shift)

2. **Test VUC-K3-002: Selective Knowledge Transfer**
   - User initiates transfer but customizes: "Transfer formal tone only; keep Brand B's casual vocabulary"
   - M1 orchestrates selective transfer
   - E4 extracts granular voice components via RA4: formality (transfer), vocabulary (ignore), structure (ignore)
   - E2 merges via RA3: Brand B voice updated with Brand A formality but Brand B vocabulary retained
   - Test content generated: "New Brand B content uses formal structure, Brand B vocabulary"
   - User validates: "This feels like Brand B but more professional"
   - Transfer approved (assertion: E2 Brand B profile updated with merged voice via RA3)

3. **Test VUC-K3-003: Performance Tracking Post-Transfer**
   - Transfer complete; Brand B voice updated with Brand A formality
   - M1 orchestrates monitoring via E3
   - E3 monitors Brand B engagement post-transfer (assertion: baseline established before transfer)
   - Track engagement over 2 weeks:
     - Week 1 post-transfer: engagement +15%
     - Week 2 post-transfer: engagement +22%
   - Dashboard shows: "Cross-brand learning impact: +18% engagement improvement"
   - Knowledge graph updated via RA4: "Formal tone drives engagement in Brand B vertical"

**Error/Edge Case Test Scenarios:**

1. **Test VUC-K3-E01: Transfer Reduces Performance**
   - Brand A (high-performing) voice transferred to Brand B
   - E3 monitors; engagement drops 10% post-transfer
   - System flags: "Knowledge transfer may have reduced engagement. Recommend review."
   - User can revert Brand B voice to pre-transfer state (assertion: rollback annotation created)
   - Assertion: System learns not to repeat this transfer pairing

---

## VARIATION USE CASES (VUC) — WORKFLOW

### VUC-W1: Custom Workflow Creation

**Description:** User creates experimental workflow combining Engines and Components in custom sequence. System validates workflow, allows execution, logs results for learning.

**Trigger:** User clicks "Create Custom Workflow" in C1/C2.

**Key Actors/Components:** M1 (Presence Manager), E1-E4 (Engines), RA1-RA4 (ResourceAccess)

**Component Call Chain:** C1/C2 → M1( RA3 [validate and store workflow definition] )

**Happy Path Test Scenarios:**

1. **Test VUC-W1-001: Workflow Definition**
   - User creates workflow: "Generate + Test + Publish"
   - User specifies steps:
     - Step 1: E4 brief on [topic]
     - Step 2: E1 generate 2 content variations
     - Step 3: E2 evaluate both for voice alignment
     - Step 4: VUC-K1 A/B test on small audience
     - Step 5: RA1 publish winning variant
   - User saves workflow (assertion: workflow ID generated, schema validated)
   - M1 stores via RA3 (assertion: available for future reuse)

2. **Test VUC-W1-002: Workflow Execution**
   - User requests: "Execute custom workflow: Generate + Test + Publish"
   - M1 orchestrates steps in sequence:
     - Step 1: E4 generates brief (assertion: brief produced)
     - Step 2: E1 generates 2 variations (assertion: 2 variations delivered)
     - Step 3: E2 evaluates both (assertion: evaluation scores > 0.75 for both)
     - Step 4: VUC-K1 executes 24-hour A/B test (assertion: test setup, deployment)
     - Step 5: Awaits A/B results; publishes winner (assertion: result analyzed, winner published)
   - Workflow execution log created (assertion: timestamp, step results, duration)

3. **Test VUC-W1-003: Workflow Parameter Customization**
   - User selects workflow but customizes parameters:
     - Topic override: "AI in healthcare" (instead of default)
     - A/B test duration: 48 hours (instead of 24)
     - Audience: "Healthcare professionals only"
   - M1 executes workflow with custom parameters (assertion: parameters passed through all steps)
   - Results reflect customization (assertion: brief tailored to healthcare, 48-hour test, audience segment applied)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-W1-E01: Step Dependency Failure**
   - Custom workflow: Step 1 → Step 2 → Step 3
   - Step 2 fails (E1 generation error)
   - System logs error (assertion: error reason recorded, step 2 status = "failed")
   - System offers: (a) retry step 2, (b) skip step 2 and continue, (c) abort workflow
   - User selects: Retry step 2 (assertion: step 2 re-executes)
   - Workflow resumes if retry successful

---

### VUC-W2: Workflow Degradation

**Description:** System detects quality issues or errors in graduated workflow; automatically reduces autonomy level or halts execution. User reviews and approves recovery steps.

**Trigger:** E3 detects engagement drop, E2 detects consistency issues, or error rate exceeds threshold.

**Key Actors/Components:** E3 (Analytics Engine), E2 (Identity Engine), M2 (Process Manager), M1 (Presence Manager), RA4 (Performance & Knowledge Artifact Access), RA3 (Content Process Artifact Access)

**Component Call Chain:** M2(detecting degradation) → M2( E3 → RA4, E2 → RA3, RA3 [update autonomy level], U4 ) →(queued) M1 [if handing back]

**Happy Path Test Scenarios:**

1. **Test VUC-W2-001: Autonomy Reduction on Performance Degradation**
   - Graduated workflow running autonomously for 8 weeks
   - M2 monitors via E3
   - E3 detects: engagement rate dropped 25% over last 2 weeks (baseline: 3.5%, current: 2.6%)
   - System threshold: engagement drop > 20% triggers degradation review
   - M2 initiates: "Autonomy degradation review triggered"
   - System analyzes: "Engagement decline correlated with topic shift (user observed)"
   - Recommendation: Reduce autonomy to "Suggest" (human reviews before distribution)
   - User notified (assertion: notification explains: metric drop, reason, new autonomy level)
   - M2 updates workflow via RA3 (assertion: flag in workflow config updated)

2. **Test VUC-W2-002: Autonomy Reduction on Consistency Issues**
   - Graduated workflow producing content consistently for 6 weeks
   - M2 monitors via E2
   - E2 detects: last 2 pieces voice consistency score dropped (0.85 → 0.68)
   - System threshold: consistency drop > 0.1 triggers review
   - M2 initiates: "Voice consistency degradation detected"
   - Recommendation: Return to "Draft" autonomy (produce but don't distribute; human reviews)
   - User notified (assertion: notification includes: consistency scores, affected pieces)
   - M2 updates workflow via RA3 (assertion: next execution produces draft without distribution)

3. **Test VUC-W2-003: Recovery and Re-graduation**
   - Workflow in "Suggest" mode; user reviews suggestions for 2 weeks
   - M2 monitors via E3
   - E3 monitors: engagement returns to baseline (2.6% → 3.4%)
   - User initiates: "Ready to re-graduate"
   - M2 analyzes last 5 cycles (assertion: loads all 5 execution records with "Suggest" autonomy)
   - E3 report: "Metrics stable last 2 weeks; confidence: 0.87"
   - System allows re-graduation (assertion: autonomy set back to "Autonomous" via M1)
   - Workflow resumes autonomous execution (assertion: next scheduled execution runs fully autonomous)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-W2-E01: False Positive Degradation**
   - Workflow autonomy reduced due to engagement drop
   - User investigates; identifies external cause: "I changed posting time; no workflow quality issue"
   - User manually overrides degradation: "Approve restoration to autonomous"
   - System restores autonomy but logs override (assertion: override reason recorded)

---

### VUC-W3: Workflow Monitoring

**Description:** Real-time monitoring of active workflow performance. Dashboard surfaces KPIs, alerts, and historical trends. User can intervene mid-workflow.

**Trigger:** Workflow active (executing or graduated). Dashboard accessed continuously.

**Key Actors/Components:** M2 (Process Manager), C1/C2 (Clients), E3 (Analytics Engine), RA4 (Performance & Knowledge Artifact Access)

**Component Call Chain:** C1/C2 → M2( E3 → RA4, RA4 [read performance data] )

**Happy Path Test Scenarios:**

1. **Test VUC-W3-001: Real-Time Workflow Dashboard**
   - Graduated workflow running; 5 scheduled executions this week
   - User opens workflow monitoring dashboard
   - Dashboard displays:
     - Current execution: "Step 2/5: Content evaluation in progress" with progress bar
     - Weekly summary: "3/5 executed, 1/5 in progress, 1/5 pending"
     - KPI trend: engagement last 4 weeks (chart showing trend)
     - Latest metrics: last execution's engagement rate, audience reach, conversion
     - Alerts: none (assertion: green status)
   - Dashboard refreshes every 30 seconds (assertion: real-time updates visible)

2. **Test VUC-W3-002: Alert and Intervention**
   - Workflow executing; E3 detects: engagement on current piece 40% below expected
   - Dashboard alert: "Current piece underperforming (40% below baseline). Recommendation: Add promotional boost."
   - User reviews alert (assertion: alert includes: metric, threshold, recommended action)
   - User approves: "Add promotional boost to Twitter distribution"
   - M2 implements intervention: adds Twitter premium distribution
   - Dashboard notes: "Intervention applied at [timestamp]"
   - Workflow continues with intervention effect measured

3. **Test VUC-W3-003: Historical Performance View**
   - User accesses workflow monitoring; scrolls to historical trends
   - Dashboard shows: last 12 executions with KPIs: engagement, reach, conversion
   - User can filter by: date range, execution type, metric
   - Chart shows: engagement trend over 12 weeks (upward trend +8/week)
   - User exports report: "Workflow Performance Report: [date range]"
   - Report includes: individual execution details, aggregate KPIs, trend analysis

---

## VARIATION USE CASES (VUC) — ADMINISTRATION

### VUC-A1: Tenant Onboarding

**Description:** New account creation, Stripe integration for billing, initial brand setup. User completes onboarding flow; system creates tenant, sets up infrastructure.

**Trigger:** New user signs up via C1 (web signup form).

**Key Actors/Components:** C1 (Web Client), M3 (Tenant Manager), RA2 (Service Access), R1 (Brand & Account), U4 (Notification)

**Component Call Chain:** C1 → M3( RA2 [Stripe], RA3 [create brand entity], U4 [welcome email] )

**Happy Path Test Scenarios:**

1. **Test VUC-A1-001: Account Creation Flow**
   - New user fills signup form: name, email, company, password
   - User submits (assertion: form validates: email format, password strength > 12 chars)
   - M3 creates user record via RA2 (assertion: user ID generated, timestamp recorded)
   - Confirmation email sent (assertion: email contains signup link, valid for 24 hours)
   - User clicks link; account activated (assertion: user.active = true)

2. **Test VUC-A1-002: Stripe Integration**
   - User completes signup; redirected to billing setup
   - User selects plan: "Professional ($99/month, 3 brands)"
   - M3 creates Stripe customer via RA2 (assertion: customer ID stored in user record)
   - User enters card details (asserts: Stripe payment form embedded, PCI compliant)
   - First charge processed (assertion: $99 charged, invoice generated)
   - User notified: "Subscription active. You have 3 brand slots."

3. **Test VUC-A1-003: Initial Brand Setup**
   - Post-subscription, user redirected to brand setup
   - Form: brand name, industry, target audience, brand colors (color picker)
   - User submits brand details (assertion: brand entity created via RA3, linked to tenant)
   - M3 creates brand knowledge graph (assertion: R4 instance per brand created)
   - System creates brand channels config (assertion: M1 instance initialized for brand)
   - User receives: "Brand created: [name]. Next: Connect your first social channel."
   - Onboarding flow complete (assertion: user can now access M1 and request CUC1 execution)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-A1-E01: Email Already Registered**
   - User attempts signup with existing email
   - System displays: "Email already registered. Try login or password reset."
   - Assertion: No duplicate user created

2. **Test VUC-A1-E02: Stripe Charge Failure**
   - User enters valid card details; Stripe declines charge
   - System displays: "Payment failed. Try another card or contact support."
   - Assertion: User not subscribed; can retry or choose different plan

---

### VUC-A2: Brand Configuration

**Description:** Set up brand identity (voice, positioning, visual identity), connect social channels, configure content calendar and approval workflows.

**Trigger:** New brand created (VUC-A1), or user accesses "Brand Settings" for existing brand.

**Key Actors/Components:** M3 (Tenant Manager), E2 (Identity Engine), RA1 (Channel Access), C1/C2 (Clients), RA3 (Content Process Artifact Access)

**Component Call Chain:** C1/C2 → M3( E2 → U5 → RA3, RA1 [OAuth connect], RA3 [store config] )

**Happy Path Test Scenarios:**

1. **Test VUC-A2-001: Voice and Positioning Setup**
   - User navigates to Brand Settings → Voice & Positioning
   - Option A: Upload samples (VUC-P5 Voice Discovery)
   - Option B: Manual entry: tone, key themes, target audience, brand promise
   - User selects Option B; fills form:
     - Tone: "Professional, approachable"
     - Key themes: "AI innovation, customer success, thought leadership"
     - Target audience: "Enterprise tech decision-makers"
     - Brand promise: "AI solutions that drive measurable business impact"
   - M3 orchestrates via E2
   - E2 creates brand voice profile (assertion: profile saved via RA3, timestamped)
   - User reviews preview (assertion: sample content generated showing voice)

2. **Test VUC-A2-002: Social Channel Connection**
   - User navigates to Integrations → Connect Channels
   - Available channels: LinkedIn, Twitter, Instagram, TikTok, Facebook, YouTube
   - User selects: LinkedIn, Twitter
   - M3 initiates OAuth flow via RA1
   - User authorizes via LinkedIn (assertion: redirected to LinkedIn, prompted to approve)
   - Channel connected via RA1 (assertion: LinkedIn channel added to brand config)
   - User repeats for Twitter
   - Both channels show: "Connected" with last sync timestamp

3. **Test VUC-A2-003: Content Calendar Configuration**
   - User navigates to Settings → Content Calendar
   - Configures:
     - Default posting times: Mon 9 AM, Wed 2 PM, Fri 10 AM (all times in brand's timezone)
     - Channel assignment: LinkedIn (all 3 times), Twitter (all 3 times), Instagram (2 times/week)
     - Approval workflow: "Require approval" toggle enabled
     - Escalation: "Escalate to owner if no approval after 2 hours"
   - M3 saves configuration via RA3 (assertion: calendar config persisted)
   - Next CUC1 execution respects configuration

4. **Test VUC-A2-004: Team Access Configuration**
   - User navigates to Team → Invite Member
   - Enters team member email, selects role: "Content Reviewer"
   - Invitation sent (assertion: email with signup link sent)
   - Team member accepts (assertion: member added to tenant team)
   - Member can approve content via VUC-P1 (assertion: member ID in approval workflows)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-A2-E01: Channel Connection Failure**
   - User authorizes LinkedIn OAuth; system receives error from LinkedIn API
   - System displays: "Failed to connect LinkedIn. Try again or contact support."
   - Assertion: Channel not added via RA1; user can retry

---

### VUC-A3: Billing Management

**Description:** Upgrade/downgrade plan, cancel subscription, view invoices, manage payment methods.

**Trigger:** User accesses Account → Billing, or billing-triggered event (approaching renewal, usage limit reached).

**Key Actors/Components:** M3 (Tenant Manager), RA2 (Service Access), R1 (Brand & Account)

**Component Call Chain:** C1/C2 → M3( RA2 [Stripe billing] )

**Happy Path Test Scenarios:**

1. **Test VUC-A3-001: View Billing Dashboard**
   - User navigates to Account → Billing
   - M3 retrieves billing data via RA2
   - Dashboard displays:
     - Current plan: "Professional ($99/month, 3 brands, 1000 content pieces/month)"
     - Billing period: "Renews Mar 20, 2026"
     - Usage: "Current month: 340/1000 content pieces"
     - Payment method: "Visa ****1234, exp 08/27"
     - Recent invoices: list of last 12 invoices with download links

2. **Test VUC-A3-002: Upgrade Plan**
   - User clicks "Upgrade Plan"
   - Available options shown:
     - Professional: $99/month (current)
     - Enterprise: $299/month (10 brands, unlimited content)
   - User selects Enterprise
   - M3 processes via RA2 Stripe
   - System shows: "Upgrade to Enterprise: $200 prorated charge for remainder of current billing period"
   - User confirms
   - Stripe processes charge (assertion: charge amount calculated: $99 remaining on Pro, credit applied, Enterprise charge)
   - Confirmation: "Upgraded to Enterprise Plan. You now have 10 brand slots."

3. **Test VUC-A3-003: Downgrade Plan**
   - User clicks "Downgrade Plan"
   - Available option: "Starter ($39/month, 1 brand, 500 content pieces/month)"
   - M3 processes via RA2
   - System warns: "Downgrade effective on next renewal (Mar 20). Currently at 3 brands; Starter allows 1. You must archive 2 brands before downgrade."
   - User navigates to brand settings, archives 2 brands (assertion: brands marked inactive)
   - User confirms downgrade
   - Next renewal: plan switches to Starter

4. **Test VUC-A3-004: Cancel Subscription**
   - User clicks "Cancel Subscription"
   - System prompts: "Why are you canceling?" (feedback form)
   - User submits feedback
   - M3 processes cancellation via RA2
   - Confirmation: "Subscription will cancel on [renewal date]. You can re-activate anytime."
   - Cancel processed (assertion: subscription.status = "cancelled", cancellation_timestamp recorded)
   - Final invoice generated (assertion: prorated refund calculated if applicable)

**Error/Edge Case Test Scenarios:**

1. **Test VUC-A3-E01: Payment Method Expired**
   - Renewal date approaches; Stripe payment fails (card expired)
   - System sends email: "Payment failed. Update your payment method to avoid service interruption."
   - User updates card via M3 billing dashboard
   - Retry charge processes successfully (assertion: subscription remains active)

---

### VUC-A4: Team Management

**Description:** Invite team members, assign roles, manage permissions, remove members.

**Trigger:** User accesses Team → Members, or clicks Invite on any approval workflow.

**Key Actors/Components:** M3 (Tenant Manager), R1 (Brand & Account), C1/C2 (Clients), U4 (Notification)

**Component Call Chain:** C1/C2 → M3( RA3 [team member CRUD], U4 [invitation email] )

**Happy Path Test Scenarios:**

1. **Test VUC-A4-001: Invite Team Member**
   - User navigates to Team → Members
   - Clicks "Invite Member"
   - Enters: email, selects role from dropdown
   - Available roles: "Owner" (full access), "Editor" (create/edit content), "Reviewer" (approve content), "Viewer" (read-only)
   - User selects "Reviewer" for team@example.com
   - M3 creates invitation via RA3
   - Invitation email sent via U4 (assertion: email includes: role description, signup link, invitation expires in 7 days)

2. **Test VUC-A4-002: Accept Invitation**
   - Invited member receives email; clicks signup link
   - Redirected to signup form (assertion: form shows: "Join [Tenant] as Reviewer")
   - Member completes signup (assertion: account created, linked to tenant with Reviewer role)
   - Member can now access: approval workflows, view content, approve pieces (assertion: "Approve" button available on content)

3. **Test VUC-A4-003: Change Member Role**
   - Owner navigates to Team → Members
   - Sees list: [Member A: Reviewer, Member B: Editor]
   - Owner clicks Member A → Change Role → "Editor"
   - M3 updates role via RA3
   - Confirmation: "Member A now has Editor permissions"
   - Member A can now create/edit content (assertion: UI reflects new permissions)

4. **Test VUC-A4-004: Remove Team Member**
   - Owner navigates to Team → Members
   - Owner clicks Member A → Remove
   - Confirmation: "Remove [Member A]? They will lose access immediately."
   - Owner confirms
   - M3 revokes access via RA3 (assertion: member.active = false, removal_timestamp recorded)
   - Member A next login: "Your access has been revoked. Contact account owner for questions."

---

## INTEGRATION USE CASES (VUC-I)

### VUC-I1: API Content Submission

**Description:** External system (third-party content tool, custom app, partner API) submits content idea to system. System ingests, processes via E1-E4, produces output, returns result to requester.

**Trigger:** External API POST to /api/v1/content/submit with content request payload.

**Key Actors/Components:** C3 (API Gateway), M1 (Presence Manager), E1-E4 (Engines), RA3 (Content Process Artifact Access), RA1 (Channel Access)

**Component Call Chain:** C3(API POST) → M1( E4 → U5, E1 → U5, E2 → U5, E3 → U5, RA3, RA1 [if auto-distribute] )

**Happy Path Test Scenarios:**

1. **Test VUC-I1-001: API Submission Format Validation**
   - External system POSTs: `POST /api/v1/content/submit`
   - Payload (JSON):
     ```json
     {
       "tenant_id": "abc123",
       "brand_id": "brand_001",
       "content_type": "linkedin_post",
       "prompt": "Write about Q1 AI trends",
       "tone_override": "data-driven",
       "channels": ["linkedin"],
       "callback_url": "https://external.com/callback"
     }
     ```
   - C3 receives and validates payload (assertion: all required fields present)
   - M1 queues request
   - Returns 202 Accepted (assertion: response includes request_id: "req_xyz789")

2. **Test VUC-I1-002: Async Processing and Callback**
   - System receives submission, returns 202 with request_id
   - M1 queues request for processing
   - E4 briefs, E1 generates, E2 evaluates, E3 assesses (assertion: all steps logged)
   - Processing completes (assertion: takes < 60 seconds for standard content)
   - System POSTs result to callback_url:
     ```json
     {
       "request_id": "req_xyz789",
       "status": "success",
       "content": "Generated LinkedIn post text...",
       "metadata": {
         "voice_confidence": 0.87,
         "engagement_estimate": "850-1200 impressions",
         "revision_count": 1
       }
     }
     ```
   - External system receives callback (assertion: HTTP 200 response logged)

3. **Test VUC-I1-003: Synchronous Response (Short Timeout)**
   - External system submits with sync_mode=true and timeout=10s
   - System processes (if < 10 seconds) and returns 200 with content in response body
   - If processing exceeds 10 seconds, returns 202 with callback approach
   - Assertion: API respects timeout parameter

**Error/Edge Case Test Scenarios:**

1. **Test VUC-I1-E01: Invalid Tenant ID**
   - External system submits with tenant_id: "invalid_xyz"
   - C3 returns 401 Unauthorized: "Invalid tenant ID or API key"
   - Assertion: No processing occurs

2. **Test VUC-I1-E02: Processing Failure**
   - E1 generation fails (rate limit, API error)
   - System POSTs callback with:
     ```json
     {
       "request_id": "req_xyz789",
       "status": "error",
       "error": "Content generation failed: [reason]",
       "retry_after": 300
     }
     ```
   - External system receives error with retry guidance

---

### VUC-I2: Platform Event Handling

**Description:** Webhook from social platform (LinkedIn, Twitter, etc.) triggers action (e.g., new mention, engagement alert). System ingests event, routes to appropriate handler, executes action (e.g., VUC-P3 response).

**Trigger:** Social platform webhook delivery to /webhooks/[platform] endpoint via C3.

**Key Actors/Components:** C3 (API Gateway), M1 (Presence Manager), E4 (Knowledge Engine), E1 (Content Engine), E2 (Identity Engine), RA1 (Channel Access)

**Component Call Chain:** C3(webhook) → M1( [delegates to VUC-P3 flow] )

**Happy Path Test Scenarios:**

1. **Test VUC-I2-001: Webhook Signature Validation**
   - LinkedIn sends webhook: mention event
   - C3 receives webhook
   - Payload includes X-Signature header
   - System validates signature against shared secret (assertion: signature verified)
   - Signature mismatch rejected (assertion: returns 401 Unauthorized)

2. **Test VUC-I2-002: Mention Event Processing**
   - LinkedIn webhook: `event_type: "mention", mention: {user: "Jane", text: "Great post!", url: "..."}`
   - C3 routes to M1
   - M1 delegates to VUC-P3 engagement response flow
   - E4 analyzes mention context
   - E1 generates response, E2 validates
   - Response published via RA1 (assertion: reply posted within 5 minutes)
   - Event log entry created (assertion: event_id, timestamp, response_id linked in R5)

3. **Test VUC-I2-003: Rate Limiting and Batching**
   - 10 mentions arrive within 2 minutes
   - M1 queues all 10 (assertion: queue shows 10 pending events)
   - M1 processes queue in order (assertion: each gets < 5-minute response time)
   - Assertion: No event lost; all processed

**Error/Edge Case Test Scenarios:**

1. **Test VUC-I2-E01: Platform Offline**
   - RA1 attempts to publish response, LinkedIn API returns 503
   - System queues event for retry (assertion: retry scheduled for 5 minutes later)
   - After 3 failed retries, escalates to user: "Unable to post response to mention from Jane. Review and post manually: [text]"

---

### VUC-I3: Analytics Export

**Description:** External system (BI tool, dashboard, reporting app) requests performance analytics via API. System exports aggregated metrics, engagement data, trend analysis.

**Trigger:** External API GET to /api/v1/analytics/export with query parameters.

**Key Actors/Components:** C3 (API Gateway), M1 (Presence Manager), RA4 (Performance & Knowledge Artifact Access), E3 (Analytics Engine), R5 (Performance & Auditing)

**Component Call Chain:** C3(API GET) → M1( RA4 [query metrics], E3 → U5 [if analysis requested] )

**Happy Path Test Scenarios:**

1. **Test VUC-I3-001: Analytics Query**
   - External system GETs: `/api/v1/analytics/export?brand_id=brand_001&date_range=last_30_days&metrics=engagement,reach,conversion`
   - C3 receives and validates auth (assertion: API key verified)
   - M1 orchestrates query via RA4
   - RA4 queries R5 for metrics (assertion: data aggregated for requested date range)
   - Response (JSON):
     ```json
     {
       "brand_id": "brand_001",
       "date_range": "2026-01-20 to 2026-02-20",
       "metrics": {
         "total_reach": 15000,
         "total_engagement": 450,
         "engagement_rate": 0.03,
         "top_content": {
           "title": "Q1 Trends",
           "reach": 3500,
           "engagement": 105
         },
         "daily_trend": [
           {"date": "2026-01-20", "reach": 400, "engagement": 12},
           ...
         ]
       }
     }
     ```

2. **Test VUC-I3-002: Filtering and Aggregation**
   - External system requests: `metrics=engagement&channels=linkedin,twitter&group_by=channel`
   - M1 orchestrates via RA4
   - System groups metrics by channel (assertion: LinkedIn and Twitter engagement shown separately)
   - Response includes: LinkedIn engagement: 250, Twitter engagement: 200

3. **Test VUC-I3-003: Export Format Options**
   - External system requests: `format=csv` (or json, parquet)
   - System exports in requested format via RA4
   - CSV includes: date, metric, value columns
   - Assertion: Data integrity preserved across formats

**Error/Edge Case Test Scenarios:**

1. **Test VUC-I3-E01: No Data for Period**
   - External system queries: `date_range=2025-01-01 to 2025-01-07` (brand not active then)
   - System returns: 200 OK with empty metrics array (assertion: no error; graceful no-data response)

---

## SUMMARY TABLE: Use Cases at a Glance

| ID | Name | Trigger | Key Output | Autonomy Levels |
|---|---|---|---|---|
| **CUC1** | Operate a Presence | User submits operational request | Produced, distributed content | Manual, Suggest, Draft, Autonomous |
| **CUC2** | Evolve Understanding | Monthly scheduler / on-demand | Updated brand frameworks | N/A |
| **CUC3** | Graduate Workflow | User initiates / auto-suggest | Graduated autonomous workflow | Manual → Autonomous |
| **VUC-P1** | Content Approval Flow | Approval mode enabled / confidence low | Approved/rejected content | Manual approval required |
| **VUC-P2** | Campaign Orchestration | Multi-piece campaign request | Timed, sequenced distribution | Autonomy by piece |
| **VUC-P3** | Engagement Response | Platform webhook | Published response | Autonomy-dependent |
| **VUC-P4** | Growth Task Generation | Monthly trigger / on-demand | Prioritized growth tasks | N/A |
| **VUC-P5** | Voice Discovery | Brand creation / manual trigger | Learned voice profile | N/A |
| **VUC-P6** | Multi-Brand Batch | Batch operation request | Parallel brand operations | Per-brand autonomy |
| **VUC-P7** | Microsite Generation | Campaign-trigger / user request | Deployed microsite + link | N/A |
| **VUC-K1** | A/B Content Testing | User initiates A/B test | Statistically significant winner | N/A |
| **VUC-K2** | User Correction Processing | User corrects content | Correction annotation logged | N/A |
| **VUC-K3** | Cross-Brand Knowledge Transfer | Manual / system suggestion | Transferred voice/positioning | N/A |
| **VUC-W1** | Custom Workflow Creation | User creates workflow | Executable workflow definition | N/A |
| **VUC-W2** | Workflow Degradation | Performance/quality threshold exceeded | Reduced autonomy workflow | Manual restoration |
| **VUC-W3** | Workflow Monitoring | Dashboard accessed | Real-time KPIs, alerts | N/A |
| **VUC-A1** | Tenant Onboarding | New user signup | Active tenant + brand | N/A |
| **VUC-A2** | Brand Configuration | Brand creation / settings access | Configured brand profile | N/A |
| **VUC-A3** | Billing Management | Billing page access | Updated subscription | N/A |
| **VUC-A4** | Team Management | Team page access | Team members with roles | N/A |
| **VUC-I1** | API Content Submission | External API POST | Generated content + callback | N/A |
| **VUC-I2** | Platform Event Handling | Social platform webhook | Action executed (e.g., response) | N/A |
| **VUC-I3** | Analytics Export | External API GET | Metrics data in requested format | N/A |

---

## Testing Execution Notes

- **Test Execution Order:** VUC-A1 → VUC-A2 → VUC-A4 (setup), then CUC1 → CUC2 → CUC3 (core), then VUC-P* (production), VUC-K* (knowledge), VUC-W* (workflow), VUC-I* (integration)
- **Assertion Validation:** Each test scenario includes explicit assertions that can be verified via: API responses, database queries, audit logs, UI state, or message queue events
- **Data Cleanup:** After each test, cleanup: delete test content, reset autonomy levels, archive test brands
- **Performance Baseline:** Record execution times for each scenario; track against baseline in regression testing
- **Error Recovery:** Validate that system state remains consistent after error scenarios (no partial updates, proper rollback)
