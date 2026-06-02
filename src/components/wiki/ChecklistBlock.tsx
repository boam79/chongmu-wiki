type ChecklistGroup = {
  title: string;
  items: string[];
};

type ChecklistBlockProps = {
  groups?: ChecklistGroup[];
  items?: { label: string; checked?: boolean }[];
};

export function ChecklistBlock({ groups, items }: ChecklistBlockProps) {
  if (groups?.length) {
    return (
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-2 text-sm font-semibold text-excel-text">{group.title}</h4>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-excel-text"
                >
                  <span className="mt-0.5 h-4 w-4 shrink-0 border border-excel-grid bg-white" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  const flatItems = items ?? [];
  return (
    <ul className="space-y-1">
      {flatItems.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-excel-text">
          <span
            className={`h-4 w-4 border border-excel-grid ${
              item.checked
                ? "bg-excel-title"
                : "bg-white"
            }`}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
