type TableBlockProps = {
  headers: string[];
  rows: string[][];
};

export function TableBlock({ headers, rows }: TableBlockProps) {
  return (
    <div className="overflow-x-auto border border-excel-grid">
      <table className="excel-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
