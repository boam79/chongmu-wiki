type InfoBoxProps = {
  title: string;
  children: React.ReactNode;
};

export function InfoBox({ title, children }: InfoBoxProps) {
  return (
    <div className="rounded-lg border border-accent-cyan/30 bg-surface p-4">
      <h3 className="font-semibold text-accent-cyan">{title}</h3>
      <div className="mt-2 text-neutral-300">{children}</div>
    </div>
  );
}
