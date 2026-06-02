type TextBlockProps = {
  paragraphs: string[];
};

export function TextBlock({ paragraphs }: TextBlockProps) {
  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-neutral-300">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
