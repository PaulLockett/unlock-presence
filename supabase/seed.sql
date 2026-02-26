-- seed.sql — Development seed data
-- 3 tenants, 5 brands, 8 team members, 50 content pieces, ~100 annotations,
-- 10 knowledge frameworks, 500 performance metrics

----------------------------------------------------------------------
-- TENANTS
----------------------------------------------------------------------
INSERT INTO tenants (id, name, email, plan_tier) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Acme Corp', 'admin@acme.test', 'pro'),
  ('a0000000-0000-0000-0000-000000000002', 'Startup Labs', 'hello@startuplabs.test', 'starter'),
  ('a0000000-0000-0000-0000-000000000003', 'Enterprise Co', 'ops@enterprise.test', 'enterprise');

----------------------------------------------------------------------
-- BRANDS
----------------------------------------------------------------------
INSERT INTO brands (id, tenant_id, name, description, autonomy_level, growth_stage, content_pillars) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Acme Tech Blog', 'B2B technology thought leadership', 'draft', 'growth', ARRAY['engineering', 'product', 'culture']),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Acme Social', 'Consumer-facing social media presence', 'suggest', 'launch', ARRAY['announcements', 'community', 'tips']),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'Startup Voice', 'Founder-led startup narrative', 'manual', 'launch', ARRAY['fundraising', 'lessons', 'hiring']),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 'Enterprise Insights', 'Enterprise analytics and strategy', 'autonomous', 'mature', ARRAY['analytics', 'strategy', 'research']),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'Enterprise HR', 'Employer branding and recruitment', 'draft', 'growth', ARRAY['hiring', 'culture', 'benefits']);

----------------------------------------------------------------------
-- BRAND IDENTITIES
----------------------------------------------------------------------
INSERT INTO brand_identities (tenant_id, brand_id, identity_prompt, version, is_current) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'You are a technical thought leader speaking to engineering managers. Your voice is conversational but precise, with occasional dry humor. You explain complex topics through first-principles reasoning.', 1, true),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'You are a friendly, approachable brand ambassador. Keep it casual, use emojis sparingly, and focus on practical value for everyday users.', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'You are a founder sharing hard-won startup lessons. Be authentic, vulnerable when appropriate, and always tie back to concrete takeaways.', 1, true),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'You are a seasoned enterprise analyst producing data-driven insights. Authoritative but accessible, always backed by evidence.', 1, true),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'You are an employer brand champion. Warm, inclusive, and genuine. Highlight real employee stories and company values.', 1, true);

----------------------------------------------------------------------
-- TEAM MEMBERS (using static UUIDs as auth.users placeholders)
----------------------------------------------------------------------
INSERT INTO team_members (tenant_id, user_id, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'owner'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'operator'),
  ('a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'viewer'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'owner'),
  ('a0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'operator'),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'owner'),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'operator'),
  ('a0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000008', 'viewer');

----------------------------------------------------------------------
-- CONTENT (50 pieces across brands)
----------------------------------------------------------------------
INSERT INTO content (id, tenant_id, brand_id, type, status, platform, title, body, produced_by) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'article', 'published', 'linkedin', 'Why We Moved to Event-Driven Architecture', 'Our journey from monolith to event-driven...', 'hybrid'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'post', 'published', 'x', 'Thread: 5 lessons from scaling our data pipeline', '1/ Scaling a data pipeline at our size taught us...', 'system'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'post', 'draft', 'x', 'New feature drop!', 'Excited to announce our latest feature...', 'system'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'article', 'review', 'substack', 'What I Learned Raising Our Series A', 'The fundraising process was...', 'human'),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'newsletter', 'scheduled', 'email', 'Q4 Analytics Digest', 'Key performance indicators for Q4...', 'system');

-- Generate 45 more content pieces via series
-- Use paired tenant/brand to maintain ownership consistency
INSERT INTO content (tenant_id, brand_id, type, status, platform, title, body, produced_by)
SELECT
  tb.tenant_id,
  tb.brand_id,
  CASE (s % 3) WHEN 0 THEN 'post' WHEN 1 THEN 'article' ELSE 'thread' END :: content_type,
  CASE (s % 4) WHEN 0 THEN 'draft' WHEN 1 THEN 'review' WHEN 2 THEN 'approved' ELSE 'published' END :: content_status,
  CASE (s % 3) WHEN 0 THEN 'x' WHEN 1 THEN 'linkedin' ELSE 'substack' END :: platform,
  'Seed content #' || s,
  'Body of seed content piece number ' || s || '. This is generated test data for development.',
  CASE (s % 3) WHEN 0 THEN 'system' WHEN 1 THEN 'human' ELSE 'hybrid' END :: produced_by
FROM generate_series(6, 50) AS s
CROSS JOIN LATERAL (
  SELECT tenant_id, id AS brand_id
  FROM (VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid),
    ('a0000000-0000-0000-0000-000000000001'::uuid, 'b0000000-0000-0000-0000-000000000002'::uuid),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 'b0000000-0000-0000-0000-000000000003'::uuid),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000004'::uuid),
    ('a0000000-0000-0000-0000-000000000003'::uuid, 'b0000000-0000-0000-0000-000000000005'::uuid)
  ) AS pairs(tenant_id, id)
  OFFSET (s % 5)
  LIMIT 1
) tb;

----------------------------------------------------------------------
-- CONTENT ANNOTATIONS (~100)
----------------------------------------------------------------------
INSERT INTO content_annotations (tenant_id, content_id, annotation_type, engine, payload, confidence_score)
SELECT
  c.tenant_id,
  c.id,
  CASE (row_number() OVER () % 4)
    WHEN 0 THEN 'voice_alignment'
    WHEN 1 THEN 'performance_insight'
    WHEN 2 THEN 'strategic_guidance'
    ELSE 'content_brief'
  END :: annotation_type,
  CASE (row_number() OVER () % 4)
    WHEN 0 THEN 'E2'
    WHEN 1 THEN 'E3'
    WHEN 2 THEN 'E4'
    ELSE 'E4'
  END :: engine,
  jsonb_build_object(
    'dsl_version', '1.0',
    'summary', 'Seed annotation for content ' || c.title,
    'score', (random() * 100)::int
  ),
  (random() * 0.5 + 0.5)::real
FROM content c
CROSS JOIN generate_series(1, 2);

----------------------------------------------------------------------
-- KNOWLEDGE FRAMEWORKS (10)
----------------------------------------------------------------------
INSERT INTO knowledge_frameworks (tenant_id, brand_id, title, description, confidence_score, confidence_level, tags)
SELECT
  CASE (s % 2)
    WHEN 0 THEN 'a0000000-0000-0000-0000-000000000001'::uuid
    ELSE 'a0000000-0000-0000-0000-000000000003'::uuid
  END,
  CASE (s % 2)
    WHEN 0 THEN 'b0000000-0000-0000-0000-000000000001'::uuid
    ELSE 'b0000000-0000-0000-0000-000000000004'::uuid
  END,
  'Framework ' || s || ': ' || CASE (s % 5)
    WHEN 0 THEN 'Audience Engagement Patterns'
    WHEN 1 THEN 'Content Timing Optimization'
    WHEN 2 THEN 'Competitive Positioning'
    WHEN 3 THEN 'Voice Consistency Rules'
    ELSE 'Growth Stage Strategies'
  END,
  'Strategic framework extracted from seed data. Framework number ' || s,
  (random() * 0.5 + 0.3)::real,
  CASE WHEN random() > 0.5 THEN 'medium' ELSE 'high' END :: confidence_level,
  ARRAY['seed', CASE (s % 3) WHEN 0 THEN 'audience' WHEN 1 THEN 'strategy' ELSE 'content' END]
FROM generate_series(1, 10) AS s;

----------------------------------------------------------------------
-- CONTENT PERFORMANCE (500 metrics via generate_series)
----------------------------------------------------------------------
INSERT INTO content_performance (tenant_id, content_id, platform, impressions, engagements, clicks, reach, engagement_rate, measured_at)
SELECT
  c.tenant_id,
  c.id,
  c.platform,
  (random() * 10000)::int,
  (random() * 500)::int,
  (random() * 200)::int,
  (random() * 8000)::int,
  (random() * 0.15)::real,
  now() - (s || ' hours')::interval
FROM content c
CROSS JOIN generate_series(1, 10) AS s
WHERE c.status = 'published'
LIMIT 500;

----------------------------------------------------------------------
-- TASKS (10 sample tasks)
----------------------------------------------------------------------
INSERT INTO tasks (tenant_id, brand_id, type, status, priority) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'content_review', 'open', 'high'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'voice_approval', 'open', 'normal'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'content_review', 'in_progress', 'urgent'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'input_needed', 'open', 'normal'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'analysis', 'completed', 'low'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'content_review', 'open', 'high'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'voice_approval', 'open', 'normal'),
  ('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'scheduling', 'open', 'normal'),
  ('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'content_review', 'open', 'high'),
  ('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'input_needed', 'open', 'low');

----------------------------------------------------------------------
-- AUDIT LOG (sample entries)
----------------------------------------------------------------------
INSERT INTO audit_log (tenant_id, actor, action, entity_type, entity_id, details)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  'system',
  CASE (s % 3) WHEN 0 THEN 'create' WHEN 1 THEN 'update' ELSE 'publish' END :: audit_action,
  'content',
  gen_random_uuid(),
  jsonb_build_object('source', 'seed', 'index', s)
FROM generate_series(1, 20) AS s;
