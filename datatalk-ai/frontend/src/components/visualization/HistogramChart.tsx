import * as React from 'react';
import Plot from 'react-plotly.js';

interface HistogramChartProps {
    data: any[];
    valueCol: string;
    groupCol?: string;
}

export const HistogramChart: React.FC<HistogramChartProps> = ({ data, valueCol, groupCol }: HistogramChartProps) => {
    const values = data.map((d: any) => Number(d[valueCol]) || 0).filter((v: number) => !isNaN(v));

    // Calculate statistics for annotations
    const mean = values.reduce((a: number, b: number) => a + b, 0) / (values.length || 1);
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    return (
        <div className="w-full h-80 animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={[
                    {
                        x: values,
                        type: 'histogram',
                        marker: {
                            color: 'rgba(99, 102, 241, 0.7)',
                            line: { color: '#4f46e5', width: 1 }
                        },
                        opacity: 0.85,
                        name: valueCol.replace(/_/g, ' '),
                        hovertemplate: 'Range: %{x}<br>Count: %{y}<extra></extra>',
                        nbinsx: Math.min(30, Math.max(8, Math.ceil(Math.sqrt(values.length))))
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { t: 20, r: 40, l: 65, b: 60 },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    bargap: 0.05,
                    xaxis: {
                        title: { text: valueCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        gridcolor: '#f1f5f9'
                    },
                    yaxis: {
                        title: { text: 'Frequency', font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        gridcolor: '#e2e8f0'
                    },
                    shapes: [
                        // Mean line
                        {
                            type: 'line',
                            x0: mean, x1: mean,
                            y0: 0, y1: 1,
                            xref: 'x', yref: 'paper',
                            line: { color: '#ef4444', width: 2, dash: 'dash' }
                        },
                        // Median line
                        {
                            type: 'line',
                            x0: median, x1: median,
                            y0: 0, y1: 1,
                            xref: 'x', yref: 'paper',
                            line: { color: '#10b981', width: 2, dash: 'dot' }
                        }
                    ],
                    annotations: [
                        {
                            x: mean,
                            y: 1.02,
                            xref: 'x',
                            yref: 'paper',
                            text: `Mean: ${mean.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            showarrow: false,
                            font: { color: '#ef4444', size: 10, family: 'Inter, sans-serif' },
                            bgcolor: 'rgba(239,68,68,0.08)',
                            borderpad: 3
                        },
                        {
                            x: median,
                            y: 0.95,
                            xref: 'x',
                            yref: 'paper',
                            text: `Median: ${median.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            showarrow: false,
                            font: { color: '#10b981', size: 10, family: 'Inter, sans-serif' },
                            bgcolor: 'rgba(16,185,129,0.08)',
                            borderpad: 3
                        }
                    ]
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
};
