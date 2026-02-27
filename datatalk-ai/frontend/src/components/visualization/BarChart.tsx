import * as React from 'react';
import Plot from 'react-plotly.js';

interface BarChartProps {
    data: any[];
    xCol: string;
    yCol: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#6366f1', '#06b6d4', '#84cc16'];

export const BarChart: React.FC<BarChartProps> = ({ data, xCol, yCol }: BarChartProps) => {
    const xData = data.map((d: any) => d[xCol]);
    const yData = data.map((d: any) => Number(d[yCol]) || 0);

    const avg = yData.reduce((a: number, b: number) => a + b, 0) / (yData.length || 1);
    const maxVal = Math.max(...yData);
    const minVal = Math.min(...yData);

    // Color-code: highest = red/warning, lowest = green/safe, rest = blue
    const barColors = yData.map((v: number) => {
        if (v === maxVal && yData.length > 1) return '#ef4444'; // Red for highest (risk)
        if (v === minVal && yData.length > 1) return '#10b981'; // Green for lowest (safe)
        return '#3b82f6'; // Default blue
    });

    return (
        <div className="w-full h-80 animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={[
                    {
                        x: xData,
                        y: yData,
                        type: 'bar',
                        marker: {
                            color: barColors,
                            opacity: 0.85,
                            line: { color: barColors.map(c => c === '#3b82f6' ? '#2563eb' : c), width: 1.5 }
                        },
                        text: yData.map(v => v.toLocaleString(undefined, { maximumFractionDigits: 1 })),
                        textposition: 'outside',
                        textfont: { size: 11, color: '#475569', family: 'Inter, sans-serif' },
                        name: yCol.replace(/_/g, ' '),
                        hovertemplate: `<b>%{x}</b><br>${yCol.replace(/_/g, ' ')}: %{y:,.2f}<extra></extra>`
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { t: 25, r: 50, l: 65, b: 70 },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    xaxis: {
                        title: { text: xCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        tickangle: xData.length > 5 ? -45 : 0,
                        gridcolor: '#f1f5f9',
                        tickfont: { size: 11, color: '#475569', family: 'Inter, sans-serif' }
                    },
                    yaxis: {
                        title: { text: yCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        gridcolor: '#e2e8f0',
                        tickfont: { size: 11, color: '#475569', family: 'Inter, sans-serif' }
                    },
                    shapes: [
                        {
                            type: 'line',
                            x0: 0,
                            x1: 1,
                            xref: 'paper',
                            y0: avg,
                            y1: avg,
                            yref: 'y',
                            line: { color: '#94a3b8', width: 1.5, dash: 'dash' }
                        }
                    ],
                    annotations: [
                        {
                            x: 1.02,
                            y: avg,
                            xref: 'paper',
                            yref: 'y',
                            text: `Avg: ${avg.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            showarrow: false,
                            xanchor: 'left',
                            yanchor: 'middle',
                            font: { color: '#94a3b8', size: 10, family: 'Inter, sans-serif' },
                            bgcolor: 'rgba(148,163,184,0.08)',
                            borderpad: 3
                        }
                    ],
                    bargap: 0.2
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
};
