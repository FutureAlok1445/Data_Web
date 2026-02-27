import React from 'react';
import { ColumnCard } from './ColumnCard';
import { detectColumnRoles } from '../../utils/columnRoleDetector';

interface SchemaPanelProps {
    schema: Record<string, string>;
}

export const SchemaPanel: React.FC<SchemaPanelProps> = ({ schema }) => {
    if (!schema || Object.keys(schema).length === 0) return null;

    const roles = detectColumnRoles(schema);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    DATASET SCHEMA
                </h3>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded shadow-sm tracking-widest uppercase">
                    {Object.keys(schema).length} Columns
                </span>
            </div>

            <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                {Object.entries(schema).map(([col, type]) => (
                    <ColumnCard
                        key={col}
                        name={col}
                        type={type}
                        role={roles[col]}
                    />
                ))}
            </div>
        </div>
    );
};
