export interface KpiMetric {
    label: string;
    value: string | number;
    format: 'number' | 'currency' | 'percentage' | 'text';
}

export function extractKpis(data: any[]): KpiMetric[] {
    if (!data || data.length === 0) return [];

    const kpis: KpiMetric[] = [];

    // Common scenario: analytical query returns 1 row with aggregations (e.g. SUM/AVG)
    if (data.length === 1) {
        const row = data[0];
        Object.entries(row).forEach(([key, value]) => {
            const isNum = typeof value === 'number';
            const keyLower = key.toLowerCase();

            let format: 'number' | 'currency' | 'percentage' | 'text' = isNum ? 'number' : 'text';

            if (isNum) {
                if (keyLower.includes('rev') || keyLower.includes('price') || keyLower.includes('cost') || keyLower.includes('amount') || keyLower.includes('sales')) {
                    format = 'currency';
                } else if (keyLower.includes('pct') || keyLower.includes('percent') || keyLower.includes('rate') || keyLower.includes('ratio')) {
                    format = 'percentage';
                }
            }

            // Clean up label text
            const cleanLabel = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            kpis.push({ label: cleanLabel, value: String(value), format });
        });

        return kpis.slice(0, 4); // Return maximum 4 top-level KPIs
    }

    // If multiple rows returned, expose summary of the resultset
    kpis.push({
        label: "Total Records Selected",
        value: data.length,
        format: 'number'
    });

    return kpis;
}
