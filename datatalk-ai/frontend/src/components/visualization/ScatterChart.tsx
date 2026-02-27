import * as React from 'react';
import Plot from 'react-plotly.js';

interface ScatterChartProps {
    data: any[];
    xCol: string;
    yCol: string;
    colorCol?: string;
}

export const ScatterChart: React.FC<ScatterChartProps> = ({ data, xCol, yCol, colorCol }: ScatterChartProps) => {
    const xData = data.map((d: any) => Number(d[xCol]) || 0);
    const yData = data.map((d: any) => Number(d[yCol]) || 0);

    // Calculate linear regression trendline
    const n = xData.length;
    const sumX = xData.reduce((a: number, b: number) => a + b, 0);
    const sumY = yData.reduce((a: number, b: number) => a + b, 0);
    const sumXY = xData.reduce((total: number, x: number, i: number) => total + x * yData[i], 0);
    const sumX2 = xData.reduce((total: number, x: number) => total + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
    const intercept = (sumY - slope * sumX) / (n || 1);

    const xMin = Math.min(...xData);
    const xMax = Math.max(...xData);
    const trendX = [xMin, xMax];
    const trendY = [slope * xMin + intercept, slope * xMax + intercept];

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = yData.reduce((total: number, y: number, i: number) => total + Math.pow(y - (slope * xData[i] + intercept), 2), 0);
    const ssTot = yData.reduce((total: number, y: number) => total + Math.pow(y - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 0 : 1 - (ssRes / ssTot);

    // Color mapping for optional group column
    const colorData = colorCol ? data.map((d: any) => String(d[colorCol])) : undefined;

    const traces: any[] = [
        {
            x: xData,
            y: yData,
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: colorData || '#6366f1',
                size: 9,
                opacity: 0.75,
                line: { color: '#ffffff', width: 1.5 },
                colorscale: colorData ? undefined : undefined
            },
            name: 'Data Points',
            text: colorData,
            hovertemplate: `${xCol.replace(/_/g, ' ')}: %{x:,.2f}<br>${yCol.replace(/_/g, ' ')}: %{y:,.2f}<extra>%{text}</extra>`
        },
        // Trendline
        {
            x: trendX,
            y: trendY,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#ef4444', width: 2, dash: 'dash' },
            name: `Trendline (R²=${rSquared.toFixed(3)})`,
            hoverinfo: 'skip'
        }
    ];

    return (
        <div className="w-full h-80 animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={traces}
                layout={{
                    autosize: true,
                    margin: { t: 30, r: 40, l: 65, b: 60 },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    xaxis: {
                        title: { text: xCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        gridcolor: '#f1f5f9',
                        zeroline: true,
                        zerolinecolor: '#e2e8f0'
                    },
                    yaxis: {
                        title: { text: yCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        gridcolor: '#e2e8f0',
                        zeroline: true,
                        zerolinecolor: '#e2e8f0'
                    },
                    showlegend: true,
                    legend: {
                        orientation: 'h',
                        y: -0.15,
                        xanchor: 'center',
                        x: 0.5,
                        font: { family: 'Inter, sans-serif', size: 11, color: '#64748b' }
                    },
                    annotations: [
                        {
                            text: `R² = ${rSquared.toFixed(3)}`,
                            xref: 'paper',
                            yref: 'paper',
                            x: 0.98,
                            y: 0.98,
                            showarrow: false,
                            font: { color: '#6366f1', size: 12, family: 'Inter, sans-serif' },
                            bgcolor: 'rgba(99,102,241,0.08)',
                            bordercolor: '#6366f1',
                            borderwidth: 1,
                            borderpad: 5
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
