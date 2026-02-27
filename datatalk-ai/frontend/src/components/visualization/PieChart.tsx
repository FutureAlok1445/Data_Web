import React from 'react';
import Plot from 'react-plotly.js';

interface PieChartProps {
    data: any[];
    labelCol: string;
    valueCol: string;
}

export const PieChart: React.FC<PieChartProps> = ({ data, labelCol, valueCol }) => {
    const labels = data.map(d => String(d[labelCol]));
    const values = data.map(d => Number(d[valueCol]) || 0);

    const total = values.reduce((a, b) => a + b, 0);

    return (
        <div className="w-full h-80 flex justify-center animate-in fade-in zoom-in-95 duration-500">
            <Plot
                data={[
                    {
                        labels: labels,
                        values: values,
                        type: 'pie',
                        hole: 0.5, // Standard Donut Style
                        marker: {
                            colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#6366f1'],
                            line: { color: '#ffffff', width: 2 }
                        },
                        textinfo: 'percent',
                        hoverinfo: 'label+value+percent',
                        textfont: { size: 12, color: '#ffffff', family: 'Inter, sans-serif' }
                    }
                ]}
                layout={{
                    autosize: true,
                    margin: { t: 20, r: 20, l: 20, b: 20 },
                    showlegend: true,
                    plot_bgcolor: 'transparent',
                    paper_bgcolor: 'transparent',
                    legend: {
                        orientation: 'h',
                        y: -0.1,
                        xanchor: 'center',
                        x: 0.5,
                        font: { family: 'Inter, sans-serif', color: '#475569' }
                    },
                    annotations: [
                        {
                            text: `<b>Total</b><br>${total.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
                            showarrow: false,
                            font: { size: 14, color: '#1e293b', family: 'Inter, sans-serif' }
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
