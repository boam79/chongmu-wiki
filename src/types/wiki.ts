export type WikiBlockType = "table" | "info_box" | "quote" | "checklist" | "text";

export type WikiContentBlock = {
  id: string;
  section_id: string;
  block_type: WikiBlockType;
  block_order: number | null;
  title: string | null;
  content: Record<string, unknown>;
  accent_color: string | null;
  is_verified: boolean | null;
  verified_year: number | null;
  season_added: number | null;
};

export type WikiSection = {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  nav_group: "knowledge" | "digital" | "community" | null;
  nav_order: number | null;
};

export type AnalyticsSnapshot = {
  id: string;
  season: number;
  season_label: string | null;
  total_messages: number | null;
  member_count: number | null;
  monthly_stats: Record<string, number> | null;
  topic_counts: Record<string, number> | null;
};
