import * as React from 'react';
import Plot from 'react-plotly.js';

interface LineChartProps {
    data: any[];
    xCol: string;
    yCol: string;
}

export const LineChart: React.FC<LineChartProps> = ({ data, xCol, yCol }: LineChartProps) => {
    const xData = data.map((d: any) => d[xCol]);
    const yData = data.map((d: any) => Number(d[yCol]) || 0);

    // Find peaks and dips for annotations
    const annotations: any[] = [];
    if (yData.length >= 3) {
        let maxIdx = 0, minIdx = 0;
        yData.forEach((v: number, i: number) => {
            if (v > yData[maxIdx]) maxIdx = i;
            if (v < yData[minIdx]) minIdx = i;
        });

        annotations.push({
            x: xData[maxIdx],
            y: yData[maxIdx],
            text: `Peak: ${yData[maxIdx].toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
            showarrow: true,
            arrowhead: 2,
            arrowcolor: '#10b981',
            font: { color: '#10b981', size: 11, family: 'Inter, sans-serif' },
            bgcolor: 'rgba(16, 185, 129, 0.08)',
            bordercolor: '#10b981',
            borderwidth: 1,
            borderpad: 4,
            ax: 0,
            ay: -35
        });

        if (minIdx !== maxIdx) {
            annotations.push({
                x: xData[minIdx],
                y: yData[minIdx],
                text: `Low: ${yData[minIdx].toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                showarrow: true,
                arrowhead: 2,
                arrowcolor: '#ef4444',
                font: { color: '#ef4444', size: 11, family: 'Inter, sans-serif' },
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                bordercolor: '#ef4444',
                borderwidth: 1,
                borderpad: 4,
                ax: 0,
                ay: 35
            });
        }
    }

    return (
        <div className="w-full h-80 animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={[
                    {
                        x: xData,
                        y: yData,
                        type: 'scatter',
                        mode: 'lines+markers',
                        fill: 'tozeroy',
                        fillcolor: 'rgba(59, 130, 246, 0.06)',
                        line: {
                            color: '#3b82f6',
                            width: 3,
                            shape: 'spline',
                            smoothing: 0.8
                        },
                        marker: {
                            color: '#3b82f6',
                            size: 7,
                            line: { color: '#ffffff', width: 2 },
                            symbol: 'circle'
                        },
                        name: yCol.replace(/_/g, ' '),
                        hovertemplate: `<b>%{x}</b><br>${yCol.replace(/_/g, ' ')}: %{y:,.2f}<extra></extra>`
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { t: 20, r: 50, l: 65, b: 60 },
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    xaxis: {
                        title: { text: xCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        tickangle: -45,
                        gridcolor: '#f1f5f9',
                        linecolor: '#e2e8f0'
                    },
                    yaxis: {
                        title: { text: yCol.replace(/_/g, ' '), font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' } },
                        gridcolor: '#e2e8f0',
                        zeroline: true,
                        zerolinecolor: '#cbd5e1'
                    },
                    annotations,
                    hovermode: 'x unified'
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
};
