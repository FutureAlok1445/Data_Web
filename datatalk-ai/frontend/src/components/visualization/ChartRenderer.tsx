import * as React from 'react';
import { useMemo } from 'react';
import { decideChartType } from '../../utils/chartDecider';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { LineChart } from './LineChart';
import { HistogramChart } from './HistogramChart';
import { ScatterChart } from './ScatterChart';
import { HeatmapChart } from './HeatmapChart';

interface ChartRendererProps {
    data: any[];
    query: string;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data, query }: ChartRendererProps) => {
    const { xCol, yCol, secondDimCol } = useMemo(() => {
        if (!data || data.length === 0) return { xCol: undefined, yCol: undefined, secondDimCol: undefined };
        const cols = Object.keys(data[0]);
        const sample = data[0];

        // Classify columns by type
        const dimensions: string[] = [];
        const measures: string[] = [];
        const timeColumns: string[] = [];

        cols.forEach((col: string) => {
            const colLower = col.toLowerCase();
            const val = sample[col];

            // Check for ID columns — skip them
            if (colLower.includes('id') || colLower.endsWith('_id') || colLower === 'uuid') return;

            // Check for time columns
            if (
                colLower.includes('date') || colLower.includes('time') ||
                colLower.includes('month') || colLower.includes('year') ||
                colLower.includes('quarter') || colLower.includes('week') ||
                (typeof val === 'string' && /^\d{4}-\d{2}/.test(val))
            ) {
                timeColumns.push(col);
                return;
            }

            // Numeric = measure, otherwise dimension
            if (typeof val === 'number') {
                measures.push(col);
            } else {
                dimensions.push(col);
            }
        });

        // Decision logic
        let x: string | undefined;
        let y: string | undefined;
        let secondDim: string | undefined;

        if (timeColumns.length > 0 && measures.length > 0) {
            // Time-series: time on x, first measure on y
            x = timeColumns[0];
            y = measures[0];
        } else if (dimensions.length >= 2 && measures.length >= 1) {
            // Multi-dimensional: two dims + one measure → heatmap
            x = dimensions[0];
            y = measures[0];
            secondDim = dimensions[1];
        } else if (dimensions.length === 1 && measures.length >= 1) {
            // Standard: one dim, one measure
            x = dimensions[0];
            y = measures[0];
        } else if (dimensions.length === 0 && measures.length >= 2) {
            // Scatter: two numeric columns
            x = measures[0];
            y = measures[1];
        } else if (dimensions.length === 0 && measures.length === 1) {
            // Single numeric → histogram against itself
            x = measures[0];
            y = measures[0];
        } else {
            // Fallback: first two columns
            x = cols[0];
            y = cols.length > 1 ? cols[1] : cols[0];
        }

        return { xCol: x, yCol: y, secondDimCol: secondDim };
    }, [data]);

    const chartType = useMemo(() => {
        return decideChartType(data, xCol, yCol, query, secondDimCol);
    }, [data, xCol, yCol, query, secondDimCol]);

    if (!data || data.length === 0) return null;

    switch (chartType) {
        case 'BarChart':
            return <BarChart data={data} xCol={xCol!} yCol={yCol!} />;

        case 'PieChart':
            return <PieChart data={data} labelCol={xCol!} valueCol={yCol!} />;

        case 'LineChart':
            return <LineChart data={data} xCol={xCol!} yCol={yCol!} />;

        case 'HistogramChart':
            return <HistogramChart data={data} valueCol={yCol!} />;

        case 'ScatterChart':
            return <ScatterChart data={data} xCol={xCol!} yCol={yCol!} />;

        case 'HeatmapChart':
            return secondDimCol
                ? <HeatmapChart data={data} rowCol={xCol!} colCol={secondDimCol} valueCol={yCol!} />
                : <BarChart data={data} xCol={xCol!} yCol={yCol!} />;

        default:
            // Fallback Raw Table View
            return (
                <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl shadow-inner scrollbar-thin">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                {Object.keys(data[0]).map((col: string) => (
                                    <th key={col} className="px-4 py-3 text-left font-bold text-slate-600 uppercase tracking-wider text-xs">{col.replace(/_/g, ' ')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {data.slice(0, 100).map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                    {Object.values(row).map((val: any, j: number) => (
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
