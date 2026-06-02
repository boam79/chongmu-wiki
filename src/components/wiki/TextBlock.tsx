type TextBlockProps = {
  paragraphs: string[];
};

export function TextBlock({ paragraphs }: TextBlockProps) {
  return (
    <div className="space-y-3 text-[11pt] leading-relaxed text-excel-text">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
