export type WikiBlockType = "table" | "info_box" | "quote" | "checklist" | "text";

export type WikiContentBlock = {
  id: string;
  section_id: string;
  block_type: WikiBlockType;
  content: Record<string, unknown>;
  sort_order: number;
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
