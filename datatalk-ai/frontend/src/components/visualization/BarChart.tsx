import React from 'react';
import Plot from 'react-plotly.js';

interface BarChartProps {
    data: any[];
    xCol: string;
    yCol: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, xCol, yCol }) => {
    const xData = data.map(d => d[xCol]);
    const yData = data.map(d => d[yCol]);

    const avg = yData.reduce((a, b) => a + (Number(b) || 0), 0) / (yData.length || 1);

    return (
        <div className="w-full h-80 animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={[
                    {
                        x: xData,
                        y: yData,
                        type: 'bar',
                        marker: {
                            color: '#3b82f6',
                            opacity: 0.8,
                            line: { color: '#2563eb', width: 1.5 }
                        },
                        name: yCol.replace(/_/g, ' '),
                        hoverinfo: 'x+y'
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { t: 20, r: 40, l: 60, b: 60 },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    xaxis: {
                        title: xCol.replace(/_/g, ' '),
                        tickangle: -45,
                        gridcolor: '#f1f5f9'
                    },
                    yaxis: {
                        title: yCol.replace(/_/g, ' '),
                        gridcolor: '#e2e8f0'
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
                            line: { color: '#ef4444', width: 2, dash: 'dash' }
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
                            font: { color: '#ef4444', size: 11, family: 'Inter, sans-serif' }
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
