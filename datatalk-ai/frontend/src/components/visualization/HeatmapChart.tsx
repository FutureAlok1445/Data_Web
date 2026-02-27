import * as React from 'react';
import { useMemo } from 'react';
import Plot from 'react-plotly.js';

interface HeatmapChartProps {
    data: any[];
    rowCol: string;
    colCol: string;
    valueCol: string;
}

export const HeatmapChart: React.FC<HeatmapChartProps> = ({ data, rowCol, colCol, valueCol }: HeatmapChartProps) => {
    const { zValues, xLabels, yLabels } = useMemo(() => {
        // Build a pivot table from the flat data
        const rowSet = new Set<string>();
        const colSet = new Set<string>();
        const valueMap: Record<string, Record<string, number>> = {};

        data.forEach((d: any) => {
            const r = String(d[rowCol]);
            const c = String(d[colCol]);
            const v = Number(d[valueCol]) || 0;
            rowSet.add(r);
            colSet.add(c);
            if (!valueMap[r]) valueMap[r] = {};
            valueMap[r][c] = v;
        });

        const yLabels = Array.from(rowSet);
        const xLabels = Array.from(colSet);

        const zValues = yLabels.map(row =>
            xLabels.map(col => valueMap[row]?.[col] ?? 0)
        );

        return { zValues, xLabels, yLabels };
    }, [data, rowCol, colCol, valueCol]);

    // Find global min/max for annotation
    const allValues = zValues.flat();
    const globalMax = Math.max(...allValues);
    const globalMin = Math.min(...allValues);

    return (
        <div className="w-full h-80 animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={[
                    {
                        z: zValues,
                        x: xLabels.map(l => l.replace(/_/g, ' ')),
                        y: yLabels.map(l => l.replace(/_/g, ' ')),
                        type: 'heatmap',
                        colorscale: [
                            [0, '#f0fdf4'],
                            [0.25, '#bbf7d0'],
                            [0.5, '#fbbf24'],
                            [0.75, '#f97316'],
                            [1, '#dc2626']
                        ],
                        showscale: true,
                        colorbar: {
                            title: { text: valueCol.replace(/_/g, ' '), font: { size: 11, color: '#64748b' } },
                            thickness: 15,
                            len: 0.9,
                            tickfont: { size: 10, color: '#64748b' }
                        },
                        hovertemplate:
                            `${rowCol.replace(/_/g, ' ')}: %{y}<br>` +
                            `${colCol.replace(/_/g, ' ')}: %{x}<br>` +
                            `${valueCol.replace(/_/g, ' ')}: %{z:,.2f}<extra></extra>`,
                        // Cell text annotations
                        text: zValues.map(row => row.map(v => v.toLocaleString(undefined, { maximumFractionDigits: 1 }))),
                        texttemplate: '%{text}',
                        textfont: { size: 11, color: '#1e293b', family: 'Inter, sans-serif' }
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { t: 20, r: 80, l: 100, b: 60 },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    xaxis: {
                        side: 'bottom',
                        tickangle: -30,
                        tickfont: { size: 11, color: '#475569', family: 'Inter, sans-serif' }
                    },
                    yaxis: {
                        autorange: 'reversed',
                        tickfont: { size: 11, color: '#475569', family: 'Inter, sans-serif' }
                    },
                    annotations: [
                        {
                            text: `Range: ${globalMin.toLocaleString(undefined, { maximumFractionDigits: 1 })} – ${globalMax.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            xref: 'paper',
                            yref: 'paper',
                            x: 0.5,
                            y: -0.2,
                            showarrow: false,
                            font: { size: 10, color: '#94a3b8', family: 'Inter, sans-serif' }
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
