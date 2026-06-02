import { TopBar } from "@/components/layout/TopBar";
import { ContentBlock } from "@/components/wiki/ContentBlock";
import { SeasonWikiBanner } from "@/components/wiki/SeasonWikiBanner";
import {
  filterBlocksForSeason,
  getPublishedSection,
  getSectionBlocks,
  getSectionBreadcrumb,
} from "@/lib/wiki";
import { parseSeasonParam, topBarBreadcrumb } from "@/lib/seasons";
import { notFound } from "next/navigation";

const SLUGS = [
  "vendors",
  "negotiation",
  "fleet",
  "facility",
  "legal",
  "hr",
  "checklist",
  "ai",
  "community",
] as const;

export const revalidate = 86400;

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

type WikiSlugPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function WikiSlugPage({
  params,
  searchParams,
}: WikiSlugPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const season = parseSeasonParam(query.season);

  if (!SLUGS.includes(slug as (typeof SLUGS)[number])) {
    notFound();
  }

  const section = await getPublishedSection(slug);
  if (!section) {
    notFound();
  }

  const blocks = filterBlocksForSeason(
    await getSectionBlocks(section.id),
    season,
  );
  const breadcrumb = topBarBreadcrumb(
    getSectionBreadcrumb(section),
    season,
  );

  return (
    <>
      <TopBar title={section.title} breadcrumb={breadcrumb} />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-[980px] space-y-10">
          <SeasonWikiBanner season={season} />

          {section.description && (
            <p className="text-[15px] leading-relaxed text-neutral-400">
              {section.description}
            </p>
          )}

          {blocks.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface p-6 text-neutral-400">
              {season === 2
                ? "이 섹션의 시즌 2 콘텐츠를 준비 중입니다. 시즌 1 아카이브는 시즌 1 탭에서 확인할 수 있습니다."
                : "이 섹션의 콘텐츠를 준비 중입니다."}
            </p>
          ) : (
            blocks.map((block) => <ContentBlock key={block.id} block={block} />)
          )}
        </div>
      </main>
    </>
  );
}
