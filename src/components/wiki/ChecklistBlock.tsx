type ChecklistBlockProps = {
  items: { label: string; checked: boolean }[];
};

export function ChecklistBlock({ items }: ChecklistBlockProps) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
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
