import type { WikiBlockRow } from "@/lib/wiki";
import { ChecklistBlock } from "./ChecklistBlock";
import { InfoBox } from "./InfoBox";
import { QuoteBlock } from "./QuoteBlock";
import { TableBlock } from "./TableBlock";
import { TextBlock } from "./TextBlock";

const ACCENT_BORDER: Record<string, string> = {
  blue: "border-l-excel-title",
  cyan: "border-l-excel-title",
  amber: "border-l-accent-amber",
  red: "border-l-red-600",
  green: "border-l-emerald-600",
  purple: "border-l-purple-600",
};

type ContentBlockProps = {
  block: WikiBlockRow;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asTable(value: unknown): { headers: string[]; rows: string[][] } | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const headers = asStringArray(record.headers);
  const rowsRaw = record.rows;
  if (!Array.isArray(rowsRaw)) return null;
  const rows = rowsRaw
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => String(cell)));
  return { headers, rows };
}

function asChecklistGroups(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.groups)) return undefined;
  return record.groups
    .filter((group): group is Record<string, unknown> => !!group && typeof group === "object")
    .map((group) => ({
      title: String(group.title ?? ""),
      items: asStringArray(group.items),
    }))
    .filter((group) => group.title && group.items.length > 0);
}

export function ContentBlock({ block }: ContentBlockProps) {
  const content =
    block.content && typeof block.content === "object"
      ? (block.content as Record<string, unknown>)
      : {};
  const accent = block.accent_color
    ? ACCENT_BORDER[block.accent_color] ?? ACCENT_BORDER.cyan
    : ACCENT_BORDER.cyan;

  const badges = (
    <div className="mb-2 flex flex-wrap gap-1">
      {block.is_verified && block.verified_year && (
        <span className="border border-emerald-600 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
          {block.verified_year} 검증
        </span>
      )}
      {block.season_added && block.season_added > 1 && (
        <span className="border border-excel-title bg-excel-ribbon-hover px-2 py-0.5 font-mono text-[10px] font-semibold text-excel-title">
          시즌 {block.season_added} 추가
        </span>
      )}
    </div>
  );

  let body: React.ReactNode = null;

  switch (block.block_type) {
    case "text": {
      const paragraphs = asStringArray(content.paragraphs);
      body = paragraphs.length > 0 ? <TextBlock paragraphs={paragraphs} /> : null;
      break;
    }
    case "table": {
      const table = asTable(content);
      body = table ? <TableBlock headers={table.headers} rows={table.rows} /> : null;
      break;
    }
    case "info_box":
    case "warning": {
      const items = asStringArray(content.items);
      const variant =
        block.block_type === "warning"
          ? "border-l-red-600 bg-red-50"
          : `${accent} bg-excel-ribbon-hover`;
      body = (
        <div className={`border border-excel-grid border-l-4 p-4 ${variant}`}>
          {block.title && (
            <h3
              className={`font-semibold ${
                block.block_type === "warning" ? "text-red-700" : "text-excel-title"
              }`}
            >
              {block.title}
            </h3>
          )}
          {items.length > 0 && (
            <ul className={`mt-2 space-y-1 text-excel-text ${block.title ? "" : "mt-0"}`}>
              {items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent-amber">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
      break;
    }
    case "quote": {
      const text = typeof content.text === "string" ? content.text : "";
      const speaker = typeof content.speaker === "string" ? content.speaker : undefined;
      body = text ? <QuoteBlock quote={text} author={speaker} /> : null;
      break;
    }
    case "checklist": {
      const groups = asChecklistGroups(content);
      body = groups ? (
        <ChecklistBlock groups={groups} />
      ) : (
        <ChecklistBlock
          items={asStringArray(content.items).map((label) => ({ label }))}
        />
      );
      break;
    }
    default:
      body = (
        <InfoBox title={`미지원 블록 (${block.block_type})`}>
          <pre className="font-mono text-xs text-excel-text-muted">
            {JSON.stringify(content, null, 2)}
          </pre>
        </InfoBox>
      );
  }

  if (!body) return null;

  return (
    <section className="wiki-block">
      {badges}
      {block.title && block.block_type !== "info_box" && block.block_type !== "warning" && (
        <h2 className="mb-3 text-base font-bold text-excel-text">{block.title}</h2>
      )}
      {body}
    </section>
  );
}
