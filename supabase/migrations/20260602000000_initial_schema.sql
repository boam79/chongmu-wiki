-- chongmu-wiki initial schema (PRD v2.0 §6)

CREATE TABLE analytics_snapshots (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  season           integer     NOT NULL DEFAULT 1,
  season_label     text,
  season_start     date,
  season_end       date,
  snapshot_date    date        NOT NULL,
  first_date       date,
  last_date        date,
  total_messages   integer,
  member_count     integer,
  active_months    integer,
  time_analysis    jsonb,
  monthly_stats    jsonb,
  top_members      jsonb,
  member_profiles  jsonb,
  industry_dist    jsonb,
  topic_counts     jsonb,
  topic_trends     jsonb,
  vendor_mentions  jsonb,
  law_mentions     jsonb,
  amount_analysis  jsonb,
  url_analysis     jsonb,
  questions        jsonb,
  community_health jsonb,
  auto_insights    jsonb,
  recent_batch     jsonb,
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_snapshots_season_active
  ON analytics_snapshots(season, is_active)
  WHERE is_active = true;

CREATE TABLE wiki_sections (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text    UNIQUE NOT NULL,
  title         text    NOT NULL,
  icon          text,
  nav_group     text,
  nav_order     integer,
  description   text,
  is_published  boolean DEFAULT true,
  updated_at    timestamptz DEFAULT now()
);

INSERT INTO wiki_sections (slug, title, icon, nav_group, nav_order) VALUES
  ('vendors',     '업체 비교',              '🏢', 'knowledge', 1),
  ('negotiation', '협상 · 예산절감',        '🤝', 'knowledge', 2),
  ('fleet',       '법인차량 관리',           '🚗', 'knowledge', 3),
  ('facility',    '시설 · 안전 · 소방',     '🔥', 'knowledge', 4),
  ('legal',       '법무 · 등기 · 라이선스', '⚖️', 'knowledge', 5),
  ('hr',          '급여 · 복리후생',        '💰', 'knowledge', 6),
  ('checklist',   '체크리스트 · 캘린더',    '✅', 'knowledge', 7),
  ('ai',          'AI 도구 활용',           '🤖', 'digital',   1),
  ('community',   '커뮤니티 이야기',        '👥', 'community', 1);

CREATE TABLE wiki_content_blocks (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id     uuid    REFERENCES wiki_sections(id) ON DELETE CASCADE,
  block_type     text    NOT NULL,
  block_order    integer,
  title          text,
  content        jsonb   NOT NULL,
  accent_color   text,
  is_verified    boolean DEFAULT false,
  verified_year  integer,
  season_added   integer DEFAULT 1,
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX idx_blocks_section_order
  ON wiki_content_blocks(section_id, block_order);

CREATE TABLE quotes (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid    REFERENCES wiki_sections(id),
  content     text    NOT NULL,
  speaker     text,
  season      integer DEFAULT 1,
  score       float,
  created_at  timestamptz DEFAULT now()
);

-- RLS: public read, authenticated write
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read analytics" ON analytics_snapshots FOR SELECT USING (true);
CREATE POLICY "admin write analytics" ON analytics_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read wiki_sections" ON wiki_sections FOR SELECT USING (true);
CREATE POLICY "admin write wiki_sections" ON wiki_sections FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read wiki_content_blocks" ON wiki_content_blocks FOR SELECT USING (true);
CREATE POLICY "admin write wiki_content_blocks" ON wiki_content_blocks FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "public read quotes" ON quotes FOR SELECT USING (true);
CREATE POLICY "admin write quotes" ON quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);
