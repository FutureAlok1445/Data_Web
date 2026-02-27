import React from 'react';
import ReactECharts from 'echarts-for-react';

interface SparklineProps {
    data: number[];
    color?: string;
}

export const DashboardSparkline: React.FC<SparklineProps> = ({ data, color = '#60a5fa' }) => {
    const option = {
        grid: { left: 0, right: 0, top: 4, bottom: 4 },
        xAxis: { type: 'category', show: false, data: (data || []).map((_, i) => i) },
        yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
        series: [{
            data: data || [],
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: { width: 2, color: color },
            areaStyle: {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: `${color}40` },
                        { offset: 1, color: `${color}00` }
                    ]
                }
            }
        }],
        animationDuration: 1500
    };

    return (
        <div className="h-full w-full">
            <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
        </div>
    );
};
