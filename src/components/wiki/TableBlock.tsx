type TableBlockProps = {
  headers: string[];
  rows: string[][];
};

export function TableBlock({ headers, rows }: TableBlockProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-2">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-2 text-left text-neutral-300">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-border">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-neutral-400">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
