-- Tighten RLS: public read only published wiki; remove permissive authenticated writes;
-- remove authenticated storage read on private chat-exports bucket.

DROP POLICY IF EXISTS "admin write analytics" ON analytics_snapshots;
DROP POLICY IF EXISTS "admin write wiki_sections" ON wiki_sections;
DROP POLICY IF EXISTS "admin write wiki_content_blocks" ON wiki_content_blocks;
DROP POLICY IF EXISTS "admin write quotes" ON quotes;

DROP POLICY IF EXISTS "public read wiki_sections" ON wiki_sections;
CREATE POLICY "public read published wiki_sections"
  ON wiki_sections FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "public read wiki_content_blocks" ON wiki_content_blocks;
CREATE POLICY "public read blocks of published sections"
  ON wiki_content_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM wiki_sections ws
      WHERE ws.id = wiki_content_blocks.section_id
        AND ws.is_published = true
    )
  );

DROP POLICY IF EXISTS "authenticated read chat-exports" ON storage.objects;
