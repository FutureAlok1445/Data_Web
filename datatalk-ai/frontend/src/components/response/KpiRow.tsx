import React from 'react';
import { extractKpis } from '../../utils/kpiExtractor';
import { formatValue, getKpiColor } from '../../utils/formatters';

interface KpiRowProps {
    data: any[];
}

const colorMap = {
    green: {
        bg: 'from-emerald-50 to-green-50',
        border: 'border-emerald-200/60',
        indicator: 'bg-emerald-500',
        glow: 'shadow-emerald-100',
        text: 'from-emerald-700 to-emerald-900'
    },
    red: {
        bg: 'from-rose-50 to-red-50',
        border: 'border-rose-200/60',
        indicator: 'bg-rose-500',
        glow: 'shadow-rose-100',
        text: 'from-rose-700 to-rose-900'
    },
    amber: {
        bg: 'from-amber-50 to-yellow-50',
        border: 'border-amber-200/60',
        indicator: 'bg-amber-500',
        glow: 'shadow-amber-100',
        text: 'from-amber-700 to-amber-900'
    },
    blue: {
        bg: 'from-white to-slate-50',
        border: 'border-slate-200/60',
        indicator: 'bg-blue-500',
        glow: 'shadow-blue-50',
        text: 'from-slate-800 to-slate-600'
    }
};

export const KpiRow: React.FC<KpiRowProps> = ({ data }) => {
    const kpis = extractKpis(data);
    if (kpis.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            {kpis.map((kpi, idx) => {
                const numValue = typeof kpi.value === 'number' ? kpi.value : parseFloat(String(kpi.value));
                const displayValue = formatValue(kpi.value, kpi.label);
                const color = !isNaN(numValue) ? getKpiColor(kpi.label, numValue) : 'blue';
                const styles = colorMap[color];

                return (
                    <div
                        key={idx}
                        className={`bg-gradient-to-br ${styles.bg} p-5 rounded-2xl border ${styles.border} shadow-sm ${styles.glow} flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group`}
                    >
                        {/* Color indicator dot */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`w-2 h-2 rounded-full ${styles.indicator} shadow-sm`}></span>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate" title={kpi.label}>
                                {kpi.label}
                            </span>
                        </div>
                        <span
                            className={`text-3xl font-extrabold tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-br ${styles.text}`}
                            title={displayValue}
                        >
                            {displayValue}
                        </span>
                        {/* Subtle hover shine */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                    </div>
                );
            })}
        </div>
    );
};
