import { createClient } from "@/lib/supabase/server";

export async function getLatestAnalytics(season?: number) {
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
