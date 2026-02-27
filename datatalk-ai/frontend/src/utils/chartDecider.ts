export type ChartType = 'BarChart' | 'LineChart' | 'PieChart' | 'HistogramChart' | 'ScatterChart' | 'HeatmapChart' | 'RawTable';

export function decideChartType(data: any[], xCol?: string, yCol?: string, query: string = ''): ChartType {
    const queryLower = query.toLowerCase();

    // Explicit user requests
    if (queryLower.includes('bar chart') || queryLower.includes('bar graph')) return 'BarChart';
    if (queryLower.includes('line chart') || queryLower.includes('line graph') || queryLower.includes('trend')) return 'LineChart';
    if (queryLower.includes('pie chart') || queryLower.includes('proportion')) return 'PieChart';
    if (queryLower.includes('histogram') || queryLower.includes('distribution')) return 'HistogramChart';
    if (queryLower.includes('scatter') || queryLower.includes('correlation')) return 'ScatterChart';
    if (queryLower.includes('heatmap')) return 'HeatmapChart';

    // Fallback if not enough structure
    if (!data || data.length === 0) return 'RawTable';
    if (!xCol || !yCol) return 'RawTable';

    // Infer based on data shape 
    const sample = data[0];
    const isXNumeric = typeof sample[xCol] === 'number';
    const isYNumeric = typeof sample[yCol] === 'number';

    // Time series -> Line
    const isXDate = !isXNumeric && (String(sample[xCol]).match(/^\d{4}-\d{2}-\d{2}/) || xCol.toLowerCase().includes('date') || xCol.toLowerCase().includes('time') || xCol.toLowerCase().includes('month') || xCol.toLowerCase().includes('year'));

    if (isXDate && isYNumeric) return 'LineChart';

    // Correlation between numeric variables
    if (isXNumeric && isYNumeric && data.length > 5) return 'ScatterChart';

    // Categorical vs Numeric
    if (!isXNumeric && isYNumeric) {
        const uniqueCategories = new Set(data.map(d => String(d[xCol]))).size;
        if (uniqueCategories <= 7 && queryLower.includes('percent')) {
            return 'PieChart';
        }
        return 'BarChart';
    }

    // Distribution
    if (isXNumeric && (yCol.toLowerCase().includes('count') || yCol === xCol)) return 'HistogramChart';

    return 'RawTable';
}
