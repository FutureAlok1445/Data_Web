import React, { useMemo } from 'react';
import { decideChartType } from '../../utils/chartDecider';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';

interface ChartRendererProps {
    data: any[];
    query: string;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data, query }) => {
    const { xCol, yCol } = useMemo(() => {
        if (!data || data.length === 0) return { xCol: undefined, yCol: undefined };
        const cols = Object.keys(data[0]);

        // Simplistic axis selector to guarantee visualization rendering
        const x = cols[0];
        const y = cols.length > 1 ? cols[1] : cols[0];
        return { xCol: x, yCol: y };
    }, [data]);

    const chartType = useMemo(() => {
        return decideChartType(data, xCol, yCol, query);
    }, [data, xCol, yCol, query]);

    if (!data || data.length === 0) return null;

    switch (chartType) {
        case 'BarChart':
            return <BarChart data={data} xCol={xCol!} yCol={yCol!} />;
        case 'PieChart':
            return <PieChart data={data} labelCol={xCol!} valueCol={yCol!} />;
        default:
            // Fallback Raw Table View for unsupported complex multidimensional data
            return (
                <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl shadow-inner scrollbar-thin">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {Object.keys(data[0]).map(col => (
                                    <th key={col} className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">{col.replace(/_/g, ' ')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {data.slice(0, 100).map((row, i) => (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                    {Object.values(row).map((val: any, j) => (
                                        <td key={j} className="px-4 py-2.5 text-slate-700 whitespace-nowrap font-medium">{String(val)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.length > 100 && (
                        <div className="text-center py-2.5 text-xs font-semibold text-slate-500 bg-slate-50 border-t uppercase tracking-widest">
                            Previewing top 100 rows of {data.length} total
                        </div>
                    )}
                </div>
            );
    }
};
