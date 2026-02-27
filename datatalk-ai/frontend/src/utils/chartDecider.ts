export type ChartType = 'BarChart' | 'LineChart' | 'PieChart' | 'HistogramChart' | 'ScatterChart' | 'HeatmapChart' | 'RawTable';

export function decideChartType(
    data: any[],
    xCol?: string,
    yCol?: string,
    query: string = '',
    secondDimCol?: string
): ChartType {
    const q = query.toLowerCase();

    // ── 1. Explicit user requests ──────────────────────────────────
    if (q.includes('bar chart') || q.includes('bar graph')) return 'BarChart';
    if (q.includes('line chart') || q.includes('line graph')) return 'LineChart';
    if (q.includes('pie chart') || q.includes('donut')) return 'PieChart';
    if (q.includes('histogram') || q.includes('distribution')) return 'HistogramChart';
    if (q.includes('scatter') || q.includes('scatter plot')) return 'ScatterChart';
    if (q.includes('heatmap') || q.includes('heat map')) return 'HeatmapChart';

    // ── 2. Structural fallbacks ────────────────────────────────────
    if (!data || data.length === 0) return 'RawTable';
    if (!xCol || !yCol) return 'RawTable';

    const sample = data[0];
    const isXNumeric = typeof sample[xCol] === 'number';
    const isYNumeric = typeof sample[yCol] === 'number';
    const totalCols = Object.keys(sample).length;

    // ── 3. Multi-dimensional → Heatmap ─────────────────────────────
    if (secondDimCol) return 'HeatmapChart';

    // ── 4. Time-series → Line ──────────────────────────────────────
    const isXDate = !isXNumeric && (
        String(sample[xCol]).match(/^\d{4}-\d{2}/) ||
        xCol.toLowerCase().includes('date') ||
        xCol.toLowerCase().includes('time') ||
        xCol.toLowerCase().includes('month') ||
        xCol.toLowerCase().includes('year') ||
        xCol.toLowerCase().includes('quarter') ||
        xCol.toLowerCase().includes('week')
    );

    if (isXDate && isYNumeric) return 'LineChart';

    // Question intent for trends
    if (isYNumeric && (
        q.includes('trend') || q.includes('over time') || q.includes('monthly') ||
        q.includes('yearly') || q.includes('growth') || q.includes('decline') ||
        q.includes('change over') || q.includes('evolution')
    )) return 'LineChart';

    // ── 5. Two numerics → Scatter ──────────────────────────────────
    if (isXNumeric && isYNumeric && data.length > 3) {
        // But if one column looks like a count/frequency, it's a histogram
        if (yCol.toLowerCase().includes('count') || yCol.toLowerCase().includes('frequency')) {
            return 'BarChart';
        }
        return 'ScatterChart';
    }

    // ── 6. Correlation / relationship questions → Scatter ──────────
    if (q.includes('correlation') || q.includes('relationship') || q.includes('vs') || q.includes('impact') || q.includes('affect')) {
        if (isXNumeric && isYNumeric) return 'ScatterChart';
    }

    // ── 7. Categorical x + Numeric y ───────────────────────────────
    if (!isXNumeric && isYNumeric) {
        const uniqueCategories = new Set(data.map((d: any) => String(d[xCol]))).size;

        // Proportion / percentage questions → Pie
        if (
            q.includes('proportion') || q.includes('share') || q.includes('breakdown') ||
            q.includes('what portion') || q.includes('percentage of') || q.includes('pie')
        ) {
            if (uniqueCategories <= 8) return 'PieChart';
        }

        // Percentages that sum ~100 → Pie
        if (uniqueCategories <= 7) {
            const total = data.reduce((sum: number, d: any) => sum + (Number(d[yCol]) || 0), 0);
            const allPercentLike = data.every((d: any) => {
                const v = Number(d[yCol]) || 0;
                return v >= 0 && v <= 100;
            });
            if (allPercentLike && total > 80 && total < 120) return 'PieChart';
        }

        // Few categories → bar, many → horizontal bar (still bar type)
        if (q.includes('rank') || q.includes('top') || q.includes('bottom') || q.includes('leaderboard')) {
            return 'BarChart';
        }

        return 'BarChart';
    }

    // ── 8. Single numeric column → Histogram ───────────────────────
    if (totalCols === 1 && isXNumeric) return 'HistogramChart';
    if (isXNumeric && xCol === yCol) return 'HistogramChart';
    if (
        q.includes('spread') || q.includes('how many fall') || q.includes('range of') ||
        q.includes('distribution of')
    ) return 'HistogramChart';

    // ── 9. Catch-all → Table ───────────────────────────────────────
    return 'RawTable';
}
