/**
 * Format a numeric value into a human-readable string based on detected type.
 */
export function formatValue(value: any, key?: string): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'string') return value;

    const num = Number(value);
    if (isNaN(num)) return String(value);

    const keyLower = (key || '').toLowerCase();

    // Currency
    if (
        keyLower.includes('rev') || keyLower.includes('price') ||
        keyLower.includes('cost') || keyLower.includes('amount') ||
        keyLower.includes('sales') || keyLower.includes('charge') ||
        keyLower.includes('income') || keyLower.includes('fee')
    ) {
        return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Percentage
    if (
        keyLower.includes('pct') || keyLower.includes('percent') ||
        keyLower.includes('rate') || keyLower.includes('ratio') ||
        keyLower.includes('churn') || keyLower.includes('conversion')
    ) {
        // If value is already 0-100, display directly
        if (num >= 0 && num <= 100) {
            return num.toFixed(1) + '%';
        }
        // If value is 0-1, multiply by 100
        if (num >= 0 && num <= 1) {
            return (num * 100).toFixed(1) + '%';
        }
    }

    // Large numbers → compact format
    if (Math.abs(num) >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (Math.abs(num) >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }

    // Standard number
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Format a column name into a clean human-readable label.
 */
export function formatColumnLabel(col: string): string {
    return col
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

/**
 * Determine a color indicator (for KPI cards) based on the key name and value.
 */
export function getKpiColor(key: string, value: number): 'green' | 'red' | 'amber' | 'blue' {
    const keyLower = key.toLowerCase();

    // High churn / error rate → red
    if (keyLower.includes('churn') || keyLower.includes('error') || keyLower.includes('loss') || keyLower.includes('decline')) {
        if (value > 30) return 'red';
        if (value > 15) return 'amber';
        return 'green';
    }

    // Revenue / growth → inverse
    if (keyLower.includes('revenue') || keyLower.includes('growth') || keyLower.includes('profit') || keyLower.includes('gain')) {
        if (value > 50) return 'green';
        if (value > 20) return 'amber';
        return 'red';
    }

    return 'blue';
}

/**
 * Truncate text to maxLen characters with ellipsis.
 */
export function truncate(text: string, maxLen: number = 80): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '…';
}
