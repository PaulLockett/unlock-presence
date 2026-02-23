-- 0000_initial.sql
-- Digital Presence Operating System — Initial Schema
-- Covers R1-R5 (17 tables), RLS, indexes, storage buckets

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

----------------------------------------------------------------------
-- ENUMS
----------------------------------------------------------------------
CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
CREATE TYPE autonomy_level AS ENUM ('manual', 'suggest', 'draft', 'autonomous');
CREATE TYPE growth_stage AS ENUM ('launch', 'growth', 'mature');
CREATE TYPE team_role AS ENUM ('owner', 'operator', 'viewer', 'api');
CREATE TYPE content_type AS ENUM ('post', 'thread', 'article', 'newsletter', 'microsite', 'email_sequence');
CREATE TYPE content_status AS ENUM ('idea', 'draft', 'review', 'approved', 'scheduled', 'published', 'archived');
CREATE TYPE platform AS ENUM ('x', 'linkedin', 'substack', 'email', 'internal');
CREATE TYPE produced_by AS ENUM ('system', 'human', 'hybrid');
CREATE TYPE visibility_state AS ENUM ('visible', 'hidden', 'archived');
CREATE TYPE annotation_type AS ENUM ('voice_alignment', 'performance_insight', 'strategic_guidance', 'content_brief', 'identity_signal');
CREATE TYPE engine AS ENUM ('E1', 'E2', 'E3', 'E4');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE template_scope AS ENUM ('system', 'tenant', 'brand');
CREATE TYPE task_type AS ENUM ('content_review', 'voice_approval', 'input_needed', 'scheduling', 'analysis');
CREATE TYPE task_status AS ENUM ('open', 'in_progress', 'completed', 'rejected');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'normal', 'low');
CREATE TYPE response_type AS ENUM ('approval', 'rejection', 'revision', 'text_input', 'voice_input', 'selection');
CREATE TYPE confidence_level AS ENUM ('low', 'medium', 'high', 'validated');
CREATE TYPE knowledge_source_type AS ENUM ('book', 'article', 'url', 'upload');
CREATE TYPE ab_test_status AS ENUM ('draft', 'running', 'concluded');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'publish', 'approve', 'reject', 'connect', 'disconnect', 'graduate', 'degrade');

----------------------------------------------------------------------
-- R1: BRAND STORE
----------------------------------------------------------------------
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  plan_tier plan_tier NOT NULL DEFAULT 'free',
  feature_flags JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  autonomy_level autonomy_level NOT NULL DEFAULT 'manual',
  growth_stage growth_stage NOT NULL DEFAULT 'launch',
  content_pillars TEXT[],
  audience_demographics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE brand_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  identity_prompt TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  refined_from UUID,
  refinement_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform platform NOT NULL,
  account_id TEXT NOT NULL,
  display_name TEXT,
  profile_url TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role team_role NOT NULL DEFAULT 'viewer',
  brand_permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- R2: CONTENT STORE
----------------------------------------------------------------------
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  content_group_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  type content_type NOT NULL,
  status content_status NOT NULL DEFAULT 'idea',
  platform platform NOT NULL,
  title TEXT,
  body TEXT,
  media_urls TEXT[],
  metadata JSONB DEFAULT '{}',
  produced_by produced_by NOT NULL DEFAULT 'system',
  campaign_id UUID,
  workflow_run_id TEXT,
  template_id UUID,
  desired_publish_at TIMESTAMPTZ,
  actual_published_at TIMESTAMPTZ,
  visibility_state visibility_state NOT NULL DEFAULT 'visible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE content_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  annotation_type annotation_type NOT NULL,
  engine engine NOT NULL,
  payload JSONB NOT NULL,
  confidence_score REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,
  content_plan JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  type content_type NOT NULL,
  scope template_scope NOT NULL DEFAULT 'brand',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- R3: TASK STORE
----------------------------------------------------------------------
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'open',
  priority task_priority NOT NULL DEFAULT 'normal',
  context JSONB DEFAULT '{}',
  workflow_id TEXT,
  workflow_signal TEXT,
  assigned_to UUID,
  human_response_window TEXT,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE task_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  response_type response_type NOT NULL,
  response_data JSONB NOT NULL,
  responded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- R4: KNOWLEDGE STORE
----------------------------------------------------------------------
CREATE TABLE knowledge_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  framework_group_id UUID NOT NULL DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  title TEXT NOT NULL,
  description TEXT,
  confidence_score REAL NOT NULL DEFAULT 0.5,
  confidence_level confidence_level NOT NULL DEFAULT 'medium',
  evidence JSONB DEFAULT '[]',
  embedding vector(1536),
  tags TEXT[],
  related_framework_ids UUID[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type knowledge_source_type NOT NULL,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  content_hash TEXT,
  object_store_path TEXT,
  processed_at TIMESTAMPTZ,
  framework_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- R5: PERFORMANCE STORE
----------------------------------------------------------------------
CREATE TABLE content_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  platform platform NOT NULL,
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate REAL DEFAULT 0,
  raw_platform_data JSONB DEFAULT '{}',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audience_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform platform NOT NULL,
  followers INTEGER DEFAULT 0,
  followers_delta INTEGER DEFAULT 0,
  demographics JSONB DEFAULT '{}',
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  status ab_test_status NOT NULL DEFAULT 'draft',
  variants JSONB DEFAULT '[]',
  winner_variant_id TEXT,
  statistical_significance REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  concluded_at TIMESTAMPTZ
);

CREATE TABLE workflow_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL,
  success_rate REAL DEFAULT 0,
  human_override_rate REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- INDEXES (top 10 custom — beyond PKs and FKs)
----------------------------------------------------------------------
CREATE INDEX idx_content_brand_status ON content (tenant_id, brand_id, status);
CREATE INDEX idx_content_group_version ON content (content_group_id, version);
CREATE INDEX idx_annotation_content_type_latest ON content_annotations (content_id, annotation_type, created_at DESC);
CREATE INDEX idx_task_queue ON tasks (tenant_id, status, priority, created_at);
CREATE INDEX idx_task_response_latest ON task_responses (task_id, created_at DESC);
CREATE INDEX idx_knowledge_brand_current ON knowledge_frameworks (tenant_id, brand_id, is_current);
CREATE INDEX idx_perf_content_time ON content_performance (content_id, measured_at);
CREATE INDEX idx_perf_tenant_time ON content_performance (tenant_id, measured_at);
CREATE INDEX idx_audit_tenant_time ON audit_log (tenant_id, created_at);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);

-- pgvector IVFFlat index for semantic search on knowledge frameworks
CREATE INDEX idx_knowledge_embedding ON knowledge_frameworks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

----------------------------------------------------------------------
-- RLS HELPER FUNCTIONS
----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_role() RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    'viewer'
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION brands_with_permission(perm TEXT) RETURNS UUID[] AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT (kv.key)::uuid
      FROM jsonb_each(
        (current_setting('request.jwt.claims', true)::jsonb -> 'brand_permissions')
      ) AS kv
      WHERE kv.value ? perm
    ),
    ARRAY[]::uuid[]
  );
$$ LANGUAGE sql STABLE;

----------------------------------------------------------------------
-- ROW LEVEL SECURITY — tenant isolation on all 17 tables
----------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies (base)
CREATE POLICY tenant_isolation_tenants ON tenants FOR ALL USING (id = current_tenant_id());
CREATE POLICY tenant_isolation_brands ON brands FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_brand_identities ON brand_identities FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_channel_connections ON channel_connections FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_team_members ON team_members FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_content ON content FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_content_annotations ON content_annotations FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_campaigns ON campaigns FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_templates ON templates FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_tasks ON tasks FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_task_responses ON task_responses FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_knowledge_frameworks ON knowledge_frameworks FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_knowledge_sources ON knowledge_sources FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_content_performance ON content_performance FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_audience_metrics ON audience_metrics FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_ab_tests ON ab_tests FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_workflow_performance ON workflow_performance FOR ALL USING (tenant_id = current_tenant_id());
CREATE POLICY tenant_isolation_audit_log ON audit_log FOR ALL USING (tenant_id = current_tenant_id());

-- Brand-level read access on brand-scoped tables
CREATE POLICY brand_read_content ON content FOR SELECT USING (
  tenant_id = current_tenant_id()
  AND (current_role() = 'owner' OR brand_id = ANY(brands_with_permission('read')))
);

CREATE POLICY brand_read_tasks ON tasks FOR SELECT USING (
  tenant_id = current_tenant_id()
  AND (current_role() = 'owner' OR brand_id = ANY(brands_with_permission('read')))
);

----------------------------------------------------------------------
-- STORAGE BUCKETS
----------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('content-media', 'content-media', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-sources', 'knowledge-sources', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-artifacts', 'knowledge-artifacts', false);

-- Storage RLS: tenant isolation via folder path convention (tenantId/brandId/...)
CREATE POLICY storage_content_media ON storage.objects FOR ALL USING (
  bucket_id = 'content-media'
  AND (storage.foldername(name))[1] = current_tenant_id()::text
);

CREATE POLICY storage_knowledge_sources ON storage.objects FOR ALL USING (
  bucket_id = 'knowledge-sources'
  AND (storage.foldername(name))[1] = current_tenant_id()::text
);

CREATE POLICY storage_knowledge_artifacts ON storage.objects FOR ALL USING (
  bucket_id = 'knowledge-artifacts'
  AND (storage.foldername(name))[1] = current_tenant_id()::text
);
