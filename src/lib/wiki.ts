import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type WikiBlockRow = Database["public"]["Tables"]["wiki_content_blocks"]["Row"];
export type WikiSectionRow = Database["public"]["Tables"]["wiki_sections"]["Row"];

const BREADCRUMB: Record<string, string> = {
  knowledge: "실무 지식",
  digital: "디지털",
  community: "커뮤니티",
};

export function getSectionBreadcrumb(section: WikiSectionRow): string {
  if (section.nav_group && BREADCRUMB[section.nav_group]) {
    return BREADCRUMB[section.nav_group];
  }
  return "실무 지식";
}

export async function getPublishedSection(
  slug: string,
): Promise<WikiSectionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wiki_sections")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    console.error("[wiki] getPublishedSection", slug, error.message);
    return null;
  }
  return data;
}

export function filterBlocksForSeason(
  blocks: WikiBlockRow[],
  season: number,
): WikiBlockRow[] {
  return blocks.filter(
    (block) => block.season_added == null || block.season_added <= season,
  );
}

export async function getSectionBlocks(
  sectionId: string,
): Promise<WikiBlockRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wiki_content_blocks")
    .select("*")
    .eq("section_id", sectionId)
    .order("block_order", { ascending: true });

  if (error) {
    console.error("[wiki] getSectionBlocks", sectionId, error.message);
    return [];
  }
  return data ?? [];
}
