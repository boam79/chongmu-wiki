#!/usr/bin/env node
/**
 * Seed wiki_sections descriptions + wiki_content_blocks from scripts/data/wiki_blocks_seed.json
 *
 * Usage:
 *   node scripts/seed_wiki_blocks.mjs
 *   node scripts/seed_wiki_blocks.mjs --dry-run
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

function loadEnvFile(relativePath) {
  try {
    const lines = readFileSync(join(process.cwd(), relativePath), "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional .env.local
  }
}

loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.",
  );
  process.exit(1);
}

const seedPath = join(__dirname, "data/wiki_blocks_seed.json");
const sections = JSON.parse(readFileSync(seedPath, "utf8"));

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: sectionRows, error: sectionError } = await supabase
    .from("wiki_sections")
    .select("id, slug");

  if (sectionError) throw sectionError;

  const slugToId = Object.fromEntries(
    (sectionRows ?? []).map((row) => [row.slug, row.id]),
  );

  let blockCount = 0;

  for (const section of sections) {
    const sectionId = slugToId[section.slug];
    if (!sectionId) {
      console.warn(`Skip unknown slug: ${section.slug}`);
      continue;
    }

    if (dryRun) {
      console.log(
        `[dry-run] ${section.slug}: description + ${section.blocks.length} blocks`,
      );
      blockCount += section.blocks.length;
      continue;
    }

    const { error: descError } = await supabase
      .from("wiki_sections")
      .update({
        description: section.description,
        is_published: true,
      })
      .eq("id", sectionId);

    if (descError) throw descError;

    const { error: deleteError } = await supabase
      .from("wiki_content_blocks")
      .delete()
      .eq("section_id", sectionId);

    if (deleteError) throw deleteError;

    const rows = section.blocks.map((block) => ({
      section_id: sectionId,
      block_type: block.block_type,
      block_order: block.block_order,
      title: block.title ?? null,
      content: block.content,
      accent_color: block.accent_color ?? null,
      is_verified: block.is_verified ?? false,
      verified_year: block.verified_year ?? null,
      season_added: block.season_added ?? 1,
    }));

    const { error: insertError } = await supabase
      .from("wiki_content_blocks")
      .insert(rows);

    if (insertError) throw insertError;

    blockCount += rows.length;
    console.log(`Seeded ${section.slug}: ${rows.length} blocks`);
  }

  console.log(`Done. Total blocks: ${blockCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
