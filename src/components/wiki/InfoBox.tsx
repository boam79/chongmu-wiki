type InfoBoxProps = {
  title: string;
  children: React.ReactNode;
};

export function InfoBox({ title, children }: InfoBoxProps) {
  return (
    <div className="border border-excel-grid border-l-4 border-l-excel-title bg-excel-ribbon-hover p-4">
      <h3 className="font-semibold text-excel-title">{title}</h3>
      <div className="mt-2 text-excel-text">{children}</div>
    </div>
  );
}
