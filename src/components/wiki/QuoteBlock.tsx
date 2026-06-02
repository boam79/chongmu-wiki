type QuoteBlockProps = {
  quote: string;
  author?: string;
};

export function QuoteBlock({ quote, author }: QuoteBlockProps) {
  return (
    <blockquote className="border-l-4 border-accent-amber pl-4 italic text-neutral-300">
      <p>{quote}</p>
      {author && (
        <footer className="mt-2 text-sm text-neutral-500">— {author}</footer>
      )}
    </blockquote>
  );
}
