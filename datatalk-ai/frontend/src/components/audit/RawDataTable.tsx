import React from 'react';

interface RawDataTableProps {
    data: any[];
    maxRows?: number;
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ data, maxRows = 30 }) => {
    if (!data || data.length === 0) return null;

    const columns = Object.keys(data[0]);

    return (
        <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-xl shadow-inner">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                        {columns.map(col => (
                            <th key={col} className="px-3 py-2 text-left font-bold text-slate-500 uppercase tracking-wider">
                                {col.replace(/_/g, ' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {data.slice(0, maxRows).map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                            {columns.map((col, j) => (
                                <td key={j} className="px-3 py-1.5 text-slate-600 whitespace-nowrap">
                                    {String(row[col] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length > maxRows && (
                <div className="text-center py-2 text-[10px] font-bold text-slate-400 bg-slate-50 border-t uppercase tracking-widest">
                    Showing {maxRows} of {data.length} rows
                </div>
            )}
        </div>
    );
};
