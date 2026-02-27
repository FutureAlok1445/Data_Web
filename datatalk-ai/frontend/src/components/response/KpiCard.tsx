import React from 'react';
import { formatValue, getKpiColor } from '../../utils/formatters';

interface KpiCardProps {
    label: string;
    value: string | number;
    format?: 'number' | 'currency' | 'percentage' | 'text';
}

const colorMap = {
    green: { bg: 'from-emerald-50 to-green-50', border: 'border-emerald-200/60', dot: 'bg-emerald-500', text: 'from-emerald-700 to-emerald-900' },
    red: { bg: 'from-rose-50 to-red-50', border: 'border-rose-200/60', dot: 'bg-rose-500', text: 'from-rose-700 to-rose-900' },
    amber: { bg: 'from-amber-50 to-yellow-50', border: 'border-amber-200/60', dot: 'bg-amber-500', text: 'from-amber-700 to-amber-900' },
    blue: { bg: 'from-white to-slate-50', border: 'border-slate-200/60', dot: 'bg-blue-500', text: 'from-slate-800 to-slate-600' }
};

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, format = 'number' }) => {
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    const displayValue = formatValue(value, label);
    const color = !isNaN(numValue) ? getKpiColor(label, numValue) : 'blue';
    const styles = colorMap[color];

    return (
        <div className={`bg-gradient-to-br ${styles.bg} p-5 rounded-2xl border ${styles.border} shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
            <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${styles.dot} shadow-sm`}></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate" title={label}>{label}</span>
            </div>
            <span className={`text-3xl font-extrabold tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-br ${styles.text}`} title={displayValue}>
                {displayValue}
            </span>
            <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        </div>
    );
};
