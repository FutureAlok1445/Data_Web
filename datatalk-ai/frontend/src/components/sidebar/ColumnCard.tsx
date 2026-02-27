import React from 'react';

interface ColumnCardProps {
    name: string;
    type: string;
    role?: 'dimension' | 'measure' | 'time' | 'id';
}

const roleConfig = {
    dimension: { label: 'Dimension', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '📊' },
    measure: { label: 'Measure', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '📈' },
    time: { label: 'Time', color: 'bg-green-100 text-green-700 border-green-200', icon: '📅' },
    id: { label: 'ID', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: '🔑' }
};

export const ColumnCard: React.FC<ColumnCardProps> = ({ name, type, role = 'dimension' }) => {
    const config = roleConfig[role];

    return (
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-sm">{config.icon}</span>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{name.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{type}</p>
                </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${config.color}`}>
                {config.label}
            </span>
        </div>
    );
};
