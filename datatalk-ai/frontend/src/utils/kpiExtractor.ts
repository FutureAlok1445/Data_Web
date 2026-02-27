export interface KpiMetric {
    label: string;
    value: string | number;
    format: 'number' | 'currency' | 'percentage' | 'text';
}

export function extractKpis(data: any[]): KpiMetric[] {
    if (!data || data.length === 0) return [];

    const kpis: KpiMetric[] = [];

    // ── Case 1: Single row → each column is a KPI ──────────────
    if (data.length === 1) {
        const row = data[0];
        Object.entries(row).forEach(([key, value]) => {
            const isNum = typeof value === 'number';
            const keyLower = key.toLowerCase();

            let format: 'number' | 'currency' | 'percentage' | 'text' = isNum ? 'number' : 'text';

            if (isNum) {
                if (
                    keyLower.includes('rev') || keyLower.includes('price') ||
                    keyLower.includes('cost') || keyLower.includes('amount') ||
                    keyLower.includes('sales') || keyLower.includes('charge') ||
                    keyLower.includes('fee') || keyLower.includes('income')
                ) {
                    format = 'currency';
                } else if (
                    keyLower.includes('pct') || keyLower.includes('percent') ||
                    keyLower.includes('rate') || keyLower.includes('ratio') ||
                    keyLower.includes('churn')
                ) {
                    format = 'percentage';
                }
            }

            const cleanLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            kpis.push({ label: cleanLabel, value: isNum ? (value as number) : String(value), format });
        });

        return kpis.slice(0, 4);
    }

    // ── Case 2: Multi-row comparison → derive aggregate KPIs ────
    const cols = Object.keys(data[0]);
    const numericCols = cols.filter(c => typeof data[0][c] === 'number');
    const dimensionCols = cols.filter(c => typeof data[0][c] !== 'number');

    // Total records
    kpis.push({
        label: 'Segments Analyzed',
        value: data.length,
        format: 'number'
    });

    // For each numeric column, show min vs max
    numericCols.forEach(col => {
        const values = data.map(d => Number(d[col]) || 0);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        const keyLower = col.toLowerCase();
        let format: 'number' | 'currency' | 'percentage' | 'text' = 'number';
        if (keyLower.includes('rate') || keyLower.includes('pct') || keyLower.includes('percent') || keyLower.includes('churn')) {
            format = 'percentage';
        } else if (keyLower.includes('charge') || keyLower.includes('rev') || keyLower.includes('price') || keyLower.includes('cost')) {
            format = 'currency';
        }

        const cleanLabel = col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Add the highest value
        if (kpis.length < 4) {
            const maxRow = data.find(d => Number(d[col]) === max);
            const maxLabel = dimensionCols.length > 0 && maxRow
                ? `Highest ${cleanLabel}`
                : `Max ${cleanLabel}`;
            kpis.push({ label: maxLabel, value: max, format });
        }

        // Add the average
        if (kpis.length < 4) {
            kpis.push({ label: `Avg ${cleanLabel}`, value: Math.round(avg * 100) / 100, format });
        }

        // Add the gap/spread
        if (kpis.length < 4 && max !== min) {
            kpis.push({ label: `${cleanLabel} Spread`, value: Math.round((max - min) * 100) / 100, format });
        }
    });

    return kpis.slice(0, 4);
}
