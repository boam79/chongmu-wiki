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
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <h4 className="mb-3 text-sm font-semibold text-white">{group.title}</h4>
            <ul className="space-y-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-neutral-300"
                >
                  <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-border" />
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
    <ul className="space-y-2">
      {flatItems.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-neutral-300">
          <span
            className={`h-4 w-4 rounded border ${
              item.checked
                ? "border-accent-blue bg-accent-blue"
                : "border-border"
            }`}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
