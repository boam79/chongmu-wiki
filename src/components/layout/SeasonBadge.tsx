type SeasonBadgeProps = {
  label: string;
  active?: boolean;
};

export function SeasonBadge({ label, active = false }: SeasonBadgeProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-sm ${
        active
          ? "bg-accent-blue/20 text-accent-blue"
          : "bg-surface-2 text-neutral-400"
      }`}
    >
      {label}
    </span>
  );
}
