type ContentBlockProps = {
  type: string;
  data: Record<string, unknown>;
};

export function ContentBlock({ type, data }: ContentBlockProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-neutral-400">Block: {type}</p>
      <pre className="mt-2 font-mono text-xs text-neutral-500">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
