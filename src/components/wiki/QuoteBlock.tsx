type QuoteBlockProps = {
  quote: string;
  author?: string;
};

export function QuoteBlock({ quote, author }: QuoteBlockProps) {
  return (
    <blockquote className="border-l-4 border-accent-amber bg-excel-header py-2 pl-4 italic text-excel-text">
      <p>{quote}</p>
      {author && (
        <footer className="mt-2 text-sm text-excel-text-muted not-italic">
          — {author}
        </footer>
      )}
    </blockquote>
  );
}
