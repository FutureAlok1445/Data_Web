export type ChartType =
    | 'BarChart'
    | 'LineChart'
    | 'PieChart'
    | 'HistogramChart'
    | 'ScatterChart'
    | 'HeatmapChart'
    | 'RawTable';

export interface ChartConfig {
    type: ChartType;
    xCol: string;
    yCol: string;
    secondDimCol?: string;
    title?: string;
}

export interface PlotlyFigure {
    data: any[];
    layout: any;
    frames?: any[];
}
