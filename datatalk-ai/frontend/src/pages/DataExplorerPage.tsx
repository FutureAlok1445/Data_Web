import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    LayoutDashboard, Network, HeartPulse, Filter, CheckSquare, Square,
    FileJson, Maximize2, X, Download, Copy, Loader2, AlertCircle
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useSessionStore } from '../store/sessionStore';
import { apiClient } from '../api/client';

interface PreviewData {
    total_rows: number;
    columns: string[];
    rows: Record<string, any>[];
    col_stats: Record<string, any>;
}

export default function DataExplorerPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { sessionId, datasetName } = useSessionStore();
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [copiedRow, setCopiedRow] = useState(false);

    useGSAP(() => {
        if (!preview) return;
        gsap.fromTo('.stagger-card',
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
        );
    }, { scope: containerRef, dependencies: [preview] });

    useEffect(() => {
        if (!sessionId) return;
        let isMounted = true;
        setLoading(true);
        setError(null);

        apiClient.get(`/session/preview/${sessionId}?limit=100`)
            .then(res => {
                if (isMounted && res.data) {
                    setPreview(res.data);
                    if (res.data.rows?.length > 0) setSelectedRow(res.data.rows[0]);
                }
            })
            .catch(err => {
                if (isMounted) setError('Could not load dataset preview. Ensure the session is active.');
                console.error(err);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [sessionId]);

    const handleCopyRow = () => {
        if (!selectedRow) return;
        navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
        setCopiedRow(true);
        setTimeout(() => setCopiedRow(false), 2000);
    };

    // Robust memoized columns
    const { numericCols, catCols } = useMemo(() => {
        const stats = preview?.col_stats || {};
        const entries = Object.entries(stats);
        return {
            numericCols: entries.filter(([, s]: any) => s?.type === 'numeric').map(([c]) => c).slice(0, 2),
            catCols: entries.filter(([, s]: any) => s?.type === 'categorical').map(([c]) => c).slice(0, 2)
        };
    }, [preview]);

    // Build distribution chart for a numeric column
    const buildHistogramOption = (colName: string) => {
        if (!preview?.rows) return null;
        const vals = preview.rows.map(r => Number(r[colName])).filter(v => !isNaN(v));
        if (vals.length === 0) return null;
        const min = Math.min(...vals), max = Math.max(...vals);
        const buckets = 7;
        const step = (max - min) / buckets || 1;
        const counts = Array(buckets).fill(0);
        vals.forEach(v => {
            const idx = Math.min(Math.floor((v - min) / step), buckets - 1);
            counts[idx]++;
        });
        return {
            grid: { left: 0, right: 0, top: 10, bottom: 0 },
            xAxis: { type: 'category', show: false, data: counts.map((_, i) => i) },
            yAxis: { type: 'value', show: false },
            series: [{ data: counts, type: 'bar', itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] } }]
        };
    };

    // Build pie chart for a categorical column
    const buildPieOption = (colName: string) => {
        const stat = preview?.col_stats?.[colName];
        if (!stat || stat.type !== 'categorical' || !stat.top_values?.length) return null;
        return {
            tooltip: { show: false },
            series: [{
                type: 'pie', radius: ['40%', '70%'], label: { show: false },
                data: stat.top_values.slice(0, 6).map((item: any, i: number) => ({
                    value: item.cnt,
                    name: String(item[colName]),
                    itemStyle: { color: ['#60a5fa', '#a78bfa', '#34d399', '#f97316', '#f43f5e', '#facc15'][i] }
                }))
            }]
        };
    };

    // --- RENDER HELPERS ---

    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                    <LayoutDashboard className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">No Dataset Loaded</h2>
                <p className="text-muted text-sm max-w-sm">Upload a CSV file via Query & Chat to explore your data here.</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto py-6 px-8 overflow-y-auto h-full" ref={containerRef}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 stagger-card">
                <div className="flex items-center text-sm">
                    <span className="text-muted flex items-center">
                        <span className="bg-gray-200 dark:bg-gray-800 p-1 rounded mr-2">📁</span> Projects
                    </span>
                    <span className="mx-2 text-border">/</span>
                    <span className="font-medium text-foreground truncate max-w-[200px]">{datasetName ?? 'Dataset'}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-md border border-green-100 dark:border-green-800">
                        <CheckSquare className="w-4 h-4 mr-2" /> Live
                    </div>
                    <a
                        href={`http://localhost:8000/export/json/${sessionId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" /> JSON
                    </a>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl mb-6 stagger-card">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && !preview && (
                <div className="flex flex-col items-center justify-center py-20 stagger-card">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="text-muted font-medium">Analyzing dataset schema...</p>
                </div>
            )}

            {/* Main Content (only if preview exists) */}
            {preview ? (
                <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-panel rounded-xl border border-border p-5 flex items-center shadow-sm stagger-card">
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-4 text-primary">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">Total Rows</p>
                                <p className="text-2xl font-bold text-foreground">{(preview.total_rows || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-panel rounded-xl border border-border p-5 flex items-center shadow-sm stagger-card">
                            <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-4 text-purple-500">
                                <Network className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">Columns</p>
                                <p className="text-2xl font-bold text-foreground">{(preview.columns || []).length}</p>
                            </div>
                        </div>
                        <div className="bg-panel rounded-xl border border-border p-5 flex items-center shadow-sm stagger-card">
                            <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-4 text-green-500">
                                <HeartPulse className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">Quality</p>
                                <p className="text-2xl font-bold text-foreground">Healthy</p>
                            </div>
                        </div>
                    </div>

                    {/* Table + Inspector */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-6">
                        <div className="flex-1 bg-panel border border-border rounded-xl shadow-sm overflow-hidden stagger-card flex flex-col min-h-[400px]">
                            <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                                <table className="min-w-full divide-y divide-border text-sm">
                                    <thead className="bg-gray-50/80 dark:bg-gray-800/80 sticky top-0 z-10 backdrop-blur-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-left w-12"><Square className="w-4 h-4 text-muted" /></th>
                                            {(preview.columns || []).map(col => (
                                                <th key={col} className="px-4 py-3 text-left font-bold text-foreground whitespace-nowrap">
                                                    {col}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {(preview.rows || []).map((row, idx) => (
                                            <tr
                                                key={idx}
                                                onClick={() => setSelectedRow(row)}
                                                className={`hover:bg-blue-50/40 dark:hover:bg-blue-900/10 cursor-pointer transition-colors ${selectedRow === row ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {selectedRow === row ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted" />}
                                                </td>
                                                {preview.columns.map(col => (
                                                    <td key={col} className="px-4 py-3 whitespace-nowrap font-mono text-xs truncate max-w-[200px]">
                                                        {row[col] === null || row[col] === undefined ? '—' : String(row[col])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="w-full lg:w-96 flex flex-col gap-4 stagger-card">
                            <div className="bg-panel border border-border rounded-xl shadow-sm p-4">
                                <h3 className="font-bold text-foreground mb-3 flex items-center justify-between">
                                    Inspector <FileJson className="w-4 h-4 text-muted" />
                                </h3>
                                <div className="bg-[#111827] rounded-lg p-3 font-mono text-xs max-h-80 overflow-auto">
                                    <pre className="text-gray-300">
                                        {selectedRow ? JSON.stringify(selectedRow, null, 2) : '// Select a row'}
                                    </pre>
                                </div>
                            </div>
                            <button onClick={handleCopyRow} className="w-full bg-panel border border-border hover:bg-gray-100 dark:hover:bg-gray-800 py-3 rounded-xl text-sm font-medium transition-colors">
                                {copiedRow ? '✅ Copied' : 'Copy JSON'}
                            </button>
                        </div>
                    </div>

                    {/* Analytics */}
                    <div className="bg-panel border border-border rounded-xl shadow-sm p-5 stagger-card">
                        <h3 className="font-bold text-xs text-muted tracking-wider uppercase mb-4">Distribution Analytics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {numericCols.map(col => (
                                <div key={col}>
                                    <p className="text-xs font-bold text-foreground mb-2 truncate">{col}</p>
                                    <div className="h-24"><ReactECharts option={buildHistogramOption(col)} style={{ height: '100%' }} /></div>
                                </div>
                            ))}
                            {catCols.map(col => (
                                <div key={col}>
                                    <p className="text-xs font-bold text-foreground mb-2 truncate">{col}</p>
                                    <div className="h-24"><ReactECharts option={buildPieOption(col)} style={{ height: '100%' }} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            ) : !loading && !error && (
                <div className="flex flex-col items-center justify-center py-20 text-muted">
                    <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                    <p>No data available for this session.</p>
                </div>
            )}
        </div>
    );
}
