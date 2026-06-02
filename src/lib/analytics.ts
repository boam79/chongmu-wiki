import { createClient } from "@/lib/supabase/server";
import type { AnalyticsSnapshot } from "@/lib/supabase/types";

export async function getLatestAnalytics(
  season?: number,
): Promise<AnalyticsSnapshot | null> {
  const supabase = await createClient();

  let query = supabase
    .from("analytics_snapshots")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (season !== undefined) {
    query = query.eq("season", season);
  }

  const { data, error } = await query.single();

  if (error) {
    return null;
  }

  return data;
}
