import { TopBar } from "@/components/layout/TopBar";
import { ContentBlock } from "@/components/wiki/ContentBlock";
import {
  getPublishedSection,
  getSectionBlocks,
  getSectionBreadcrumb,
} from "@/lib/wiki";
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
};

export default async function WikiSlugPage({ params }: WikiSlugPageProps) {
  const { slug } = await params;
  if (!SLUGS.includes(slug as (typeof SLUGS)[number])) {
    notFound();
  }

  const section = await getPublishedSection(slug);
  if (!section) {
    notFound();
  }

  const blocks = await getSectionBlocks(section.id);
  const breadcrumb = getSectionBreadcrumb(section);

  return (
    <>
      <TopBar title={section.title} breadcrumb={breadcrumb} />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-[980px] space-y-10">
          {section.description && (
            <p className="text-[15px] leading-relaxed text-neutral-400">
              {section.description}
            </p>
          )}

          {blocks.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface p-6 text-neutral-400">
              이 섹션의 콘텐츠를 준비 중입니다.
            </p>
          ) : (
            blocks.map((block) => <ContentBlock key={block.id} block={block} />)
          )}
        </div>
      </main>
    </>
  );
}
