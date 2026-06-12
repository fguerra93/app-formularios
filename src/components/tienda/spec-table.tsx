"use client";

interface SpecTableProps {
  specs: { label: string; value: string }[];
  title?: string;
}

export function SpecTable({ specs, title }: SpecTableProps) {
  if (!specs || specs.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="font-bold text-[#0f1115] text-sm mb-3">{title}</h3>
      )}
      <div className="spec-table-wrapper">
        <table className="spec-table">
          <thead>
            <tr>
              <th>Caracteristica</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {specs.map((spec, i) => (
              <tr key={i}>
                <td className="font-medium">{spec.label}</td>
                <td>{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface SpecTableMultiColProps {
  headers: string[];
  rows: string[][];
  title?: string;
}

export function SpecTableMultiCol({ headers, rows, title }: SpecTableMultiColProps) {
  if (!rows || rows.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="font-bold text-[#0f1115] text-sm mb-3">{title}</h3>
      )}
      <div className="spec-table-wrapper">
        <table className="spec-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
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
    </div>
  );
}
