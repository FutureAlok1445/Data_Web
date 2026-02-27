import React from 'react';

interface AnomalyWarningProps {
    anomalies: Record<string, { outlier_count: number; total_count: number; threshold_used: number }>;
}

export const AnomalyWarning: React.FC<AnomalyWarningProps> = ({ anomalies }) => {
    if (!anomalies || Object.keys(anomalies).length === 0) return null;

    const count = Object.keys(anomalies).length;

    return (
        <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold w-fit shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                Statistical anomalies detected in {count} dimension{count > 1 ? 's' : ''}.
            </div>

            {Object.entries(anomalies).map(([col, info]) => (
                <div key={col} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                    <span>
                        <strong>{col.replace(/_/g, ' ')}</strong>: {info.outlier_count} outlier{info.outlier_count > 1 ? 's' : ''} detected
                        ({info.total_count} total, threshold: {info.threshold_used}σ)
                    </span>
                </div>
            ))}
        </div>
    );
};
