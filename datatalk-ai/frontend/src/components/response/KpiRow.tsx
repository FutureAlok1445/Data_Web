import React from 'react';
import { extractKpis } from '../../utils/kpiExtractor';

interface KpiRowProps {
    data: any[];
}

export const KpiRow: React.FC<KpiRowProps> = ({ data }) => {
    const kpis = extractKpis(data);
    if (kpis.length === 0) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            {kpis.map((kpi, idx) => {
                let displayValue = String(kpi.value);
                if (typeof kpi.value === 'number') {
                    if (kpi.format === 'currency') displayValue = '$' + kpi.value.toLocaleString();
                    else if (kpi.format === 'percentage') displayValue = (kpi.value * 100).toFixed(1) + '%';
                    else displayValue = kpi.value.toLocaleString();
                }

                return (
                    <div key={idx} className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 truncate" title={kpi.label}>{kpi.label}</span>
                        <span className="text-3xl font-extrabold text-slate-800 tracking-tight truncate bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600" title={displayValue}>{displayValue}</span>
                    </div>
                );
            })}
        </div>
    );
};
