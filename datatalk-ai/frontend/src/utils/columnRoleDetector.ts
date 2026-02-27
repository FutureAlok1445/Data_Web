export type ColumnRole = 'dimension' | 'measure' | 'time' | 'id';

export function detectColumnRoles(schema: Record<string, string>, dataSample: any[] = []): Record<string, ColumnRole> {
    const roles: Record<string, ColumnRole> = {};

    for (const [col, type] of Object.entries(schema)) {
        const colLower = col.toLowerCase();
        const typeLower = type.toLowerCase();

        // Check ID first
        if (colLower.includes('id') || colLower.endsWith('_id') || colLower === 'uuid') {
            roles[col] = 'id';
            continue;
        }

        // Check Time
        if (
            typeLower.includes('date') || typeLower.includes('time') || typeLower.includes('timestamp') ||
            colLower.includes('date') || colLower.includes('time') || colLower.includes('month') || colLower.includes('year')
        ) {
            roles[col] = 'time';
            continue;
        }

        // Check Measure (Numeric Data)
        if (
            typeLower.includes('int') || typeLower.includes('float') || typeLower.includes('double') ||
            typeLower.includes('decimal') || typeLower.includes('numeric')
        ) {
            roles[col] = 'measure';
            continue;
        }

        // Default to Dimension (Categorical, Text, Boolean)
        roles[col] = 'dimension';
    }

    return roles;
}
