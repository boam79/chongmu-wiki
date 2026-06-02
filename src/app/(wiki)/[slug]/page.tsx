import { TopBar } from "@/components/layout/TopBar";
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

const TITLES: Record<(typeof SLUGS)[number], string> = {
  vendors: "업체 비교",
  negotiation: "협상 · 예산절감",
  fleet: "법인차량 관리",
  facility: "시설 · 안전 · 소방",
  legal: "법무 · 등기 · 라이선스",
  hr: "급여 · 복리후생",
  checklist: "체크리스트 · 캘린더",
  ai: "AI 도구 활용",
  community: "커뮤니티 이야기",
};

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

  const title = TITLES[slug as (typeof SLUGS)[number]];

  return (
    <>
      <TopBar title={title} breadcrumb="실무 지식" />
      <main className="flex-1 p-10">
        <div className="mx-auto max-w-[980px]">
          <p className="text-neutral-400">
            위키 콘텐츠 블록은 Supabase <code className="text-accent-amber">wiki_content_blocks</code>에서
            로드됩니다.
          </p>
        </div>
      </main>
    </>
  );
}
