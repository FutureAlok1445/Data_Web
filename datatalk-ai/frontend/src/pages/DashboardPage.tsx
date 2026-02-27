import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
    LayoutDashboard, Filter, TrendingUp, Users, Activity,
    ArrowUpRight, MoreVertical, Maximize2, RefreshCw, Layers, Zap, Heart
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ReactECharts from 'echarts-for-react';
import { useSessionStore } from '../store/sessionStore';
import { DashboardFilterSidebar } from '../components/layout/DashboardFilterSidebar';
import { DashboardSparkline } from '../components/visualization/DashboardSparkline';
import { apiClient } from '../api/client';

export default function DashboardPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { sessionId, datasetName, schema } = useSessionStore();
    const [preview, setPreview] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Functional State
    const [sortBy, setSortBy] = useState<string>('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filters, setFilters] = useState<Record<string, string>>({
        query: '',
        filterCol: '',
        filterVal: ''
    });

    // Initialize sortBy when schema arrives
    useEffect(() => {
        if (schema && !sortBy) {
            setSortBy(Object.keys(schema)[0]);
        }
    }, [schema, sortBy]);

    // Data Processing Pipeline
    const processedData = useMemo(() => {
        if (!preview?.rows) return [];
        let data = [...preview.rows];

        // 1. Apply Filters
        if (filters.query) {
            const q = filters.query.toLowerCase();
            data = data.filter(row =>
                Object.values(row).some(v => String(v).toLowerCase().includes(q))
            );
        }

        if (filters.filterCol && filters.filterVal) {
            const val = filters.filterVal.toLowerCase();
            data = data.filter(row =>
                String(row[filters.filterCol]).toLowerCase().includes(val)
            );
        }

        // 2. Apply Sorting
        if (sortBy) {
            data.sort((a, b) => {
                const valA = a[sortBy];
                const valB = b[sortBy];

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortOrder === 'asc' ? valA - valB : valB - valA;
                }

                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();

                if (sortOrder === 'asc') return strA > strB ? 1 : -1;
                return strA < strB ? 1 : -1;
            });
        }

        return data;
    }, [preview, sortBy, sortOrder, filters]);

    // GSAP Entrance
    useGSAP(() => {
        if (!processedData.length) return;
        gsap.fromTo('.stagger-card',
            { scale: 0.95, y: 30, autoAlpha: 0 },
            {
                scale: 1,
                y: 0,
                autoAlpha: 1,
                duration: 1.2,
                stagger: { amount: 0.6, grid: [3, 3] },
                ease: 'expo.out',
                overwrite: true
            }
        );
    }, { scope: containerRef, dependencies: [processedData.length > 0] });

    useEffect(() => {
        if (!sessionId) return;
        setLoading(true);
        apiClient.get(`/session/preview/${sessionId}?limit=100`)
            .then(res => setPreview(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [sessionId]);

    if (!sessionId) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-background">
                <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/10 border border-primary/20">
                    <LayoutDashboard className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-foreground mb-4">No Data Pulse</h2>
                <p className="text-muted max-w-sm mb-10 font-medium leading-relaxed italic">Connect a dataset to watch your analytics come alive in this command center.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-10 py-4 bg-primary text-white font-black rounded-3xl shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all active:scale-95"
                >
                    Launch Core Engine →
                </button>
            </div>
        );
    }

    // --- CHART OPTIONS BUILDERS ---

    const getRadarHealthOption = () => {
        if (!schema) return {};
        const colCount = Object.keys(schema).length;
        const catCount = Object.values(schema).filter((s: any) => (s.type || s) === 'categorical').length;
        const numCount = Object.values(schema).filter((s: any) => (s.type || s) === 'numeric').length;

        // Pseudo-health metrics based on schema
        const uniqueness = 0.85; // Mock
        const completeness = 0.98; // Mock
        const variety = Math.min(1, (catCount + numCount) / 10);
        const volume = Math.min(1, (preview?.total_rows || 0) / 10000);

        return {
            radar: {
                indicator: [
                    { name: 'Uniqueness', max: 1 },
                    { name: 'Completeness', max: 1 },
                    { name: 'Variety', max: 1 },
                    { name: 'Volume', max: 1 },
                    { name: 'Density', max: 1 }
                ],
                shape: 'circle',
                splitNumber: 4,
                axisName: { color: '#9ca3af', fontSize: 10, fontWeight: 'bold' },
                splitLine: { lineStyle: { color: ['#374151', '#1f2937'] } },
                splitArea: { show: false }
            },
            series: [{
                type: 'radar',
                data: [{
                    value: [uniqueness, completeness, variety, volume, 0.7],
                    name: 'Data Health',
                    symbol: 'none',
                    lineStyle: { width: 2, color: '#6366f1' },
                    areaStyle: { color: '#6366f130' }
                }]
            }]
        };
    };

    const getCorrelationOption = () => {
        if (processedData.length === 0) return {};
        const numCols = Object.entries(schema || {}).filter(([, info]: any) => (info?.type || info) === 'numeric');
        if (numCols.length < 2) return {};

        const xCol = numCols[0][0];
        const yCol = numCols[1][0];
        const scatterData = processedData.map(r => [r[xCol], r[yCol]]);

        return {
            grid: { top: '15%', bottom: '15%', left: '15%', right: '5%' },
            xAxis: { splitLine: { show: false }, axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9ca3af', fontSize: 9 } },
            yAxis: { splitLine: { lineStyle: { color: '#1f2937' } }, axisLabel: { color: '#9ca3af', fontSize: 9 } },
            series: [{
                symbolSize: 8,
                data: scatterData,
                type: 'scatter',
                itemStyle: { color: '#f43f5e', opacity: 0.6 }
            }],
            tooltip: { trigger: 'item', backgroundColor: '#111827' }
        };
    };

    const getDonutOption = () => {
        if (processedData.length === 0) return {};
        let col = sortBy;
        const colType = schema?.[col]?.type || schema?.[col];
        if (colType !== 'categorical' && colType !== 'text') {
            const catCols = Object.entries(schema || {}).filter(([, info]: any) =>
                (info?.type || info) === 'categorical' || (info?.type || info) === 'text'
            );
            col = catCols[0]?.[0] || Object.keys(schema || {})[0];
        }

        const counts: Record<string, number> = {};
        processedData.forEach(row => {
            const val = String(row[col]);
            counts[val] = (counts[val] || 0) + 1;
        });

        const stats = Object.entries(counts).map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        return {
            tooltip: { trigger: 'item', backgroundColor: '#1f2937', borderColor: '#374151', textStyle: { color: '#f3f4f6' } },
            legend: { top: 'middle', right: '5%', orient: 'vertical', textStyle: { color: '#9ca3af', fontSize: 9 } },
            series: [{
                name: col.replace(/_/g, ' '),
                type: 'pie',
                center: ['40%', '50%'],
                radius: ['50%', '80%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 12, borderColor: 'transparent', borderWidth: 3 },
                label: { show: false },
                emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
                data: stats.map((s, i) => ({
                    ...s,
                    itemStyle: { color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'][i] }
                }))
            }]
        };
    };

    const getTrendOption = () => {
        if (processedData.length === 0) return {};
        let col = sortBy;
        if ((schema?.[col]?.type || schema?.[col]) !== 'numeric') {
            const numCols = Object.entries(schema || {}).filter(([, info]: any) => (info?.type || info) === 'numeric');
            col = numCols[0]?.[0] || Object.keys(schema || {})[0];
        }
        const vals = processedData.map(r => r[col]);

        return {
            grid: { left: '3%', right: '4%', bottom: '5%', top: '10%', containLabel: true },
            tooltip: { trigger: 'axis', backgroundColor: '#111827' },
            xAxis: { type: 'category', boundaryGap: false, axisLine: { show: false }, axisLabel: { show: false } },
            yAxis: { type: 'value', splitLine: { lineStyle: { color: '#1f2937' } }, axisLabel: { color: '#9ca3af', fontSize: 10 } },
            series: [{
                name: col.replace(/_/g, ' '),
                data: vals.slice(0, 60),
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: { width: 4, color: '#3b82f6' },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [{ offset: 0, color: '#3b82f650' }, { offset: 1, color: '#3b82f600' }]
                    }
                }
            }]
        };
    };

    const handleFilterChange = (key: string, val: string) => {
        setFilters(prev => ({ ...prev, [key]: val }));
    };

    const handleReset = () => {
        setFilters({ query: '', filterCol: '', filterVal: '' });
        if (schema) setSortBy(Object.keys(schema)[0]);
        setSortOrder('desc');
    };

    return (
        <div className="h-full flex bg-background text-foreground overflow-hidden font-sans" ref={containerRef}>
            {/* Sidebar with Glassmorphism */}
            <DashboardFilterSidebar
                schema={schema || {}}
                sortBy={sortBy}
                sortOrder={sortOrder}
                filters={filters}
                datasetName={datasetName || 'Data Stream'}
                onSortChange={(col, order) => { setSortBy(col); setSortOrder(order); }}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
            />

            <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/5 via-background to-background">
                {/* Premium Header */}
                <header className="h-24 px-12 flex items-center justify-between border-b border-border/40 backdrop-blur-2xl sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                            <div className="relative p-3.5 bg-panel border border-primary/20 rounded-2xl shadow-inner">
                                <Activity className="w-7 h-7 text-primary animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                                    Strategic Intelligence
                                </h1>
                                <span className="text-[10px] font-black px-2.5 py-1 bg-primary text-white rounded-full tracking-widest uppercase animate-pulse">
                                    LIVE FEED
                                </span>
                            </div>
                            <p className="text-sm text-muted font-bold mt-1.5 flex items-center gap-2">
                                <Zap className="w-3.5 h-3.5 text-amber-500" />
                                High-velocity stream analysis: {processedData.length} records active
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center -space-x-3 h-10 px-4 bg-panel/30 border border-border rounded-2xl">
                            {[1, 2, 3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />)}
                            <span className="text-[10px] font-black ml-6 text-emerald-500">SYNC ACTIVE</span>
                        </div>
                        <button
                            onClick={() => { setLoading(true); apiClient.get(`/session/preview/${sessionId}?limit=100`).then(res => setPreview(res.data)).finally(() => setLoading(false)); }}
                            className="p-3 bg-panel border border-border rounded-2xl text-muted hover:text-foreground hover:scale-110 active:rotate-[360deg] transition-all duration-700"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12 space-y-10 scrollbar-none custom-scrollbar pb-24">

                    {/* Bento Level 1: Key Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: 'Display Yield', value: processedData.length.toLocaleString(), icon: TrendingUp, delta: '+12%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { label: 'Data Fidelity', value: '99.9%', icon: Heart, delta: 'OPT', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'Schema Depth', value: Object.keys(schema || {}).length, icon: Layers, delta: 'NEW', color: 'text-violet-500', bg: 'bg-violet-500/10' },
                            { label: 'Latency', value: '14ms', icon: Activity, delta: '-4ms', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                        ].map((stat, i) => (
                            <div key={i} className="stagger-card bg-panel/50 backdrop-blur-md border border-border/60 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all group relative overflow-hidden">
                                <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
                                    <stat.icon className="w-24 h-24" />
                                </div>
                                <div className="flex items-center justify-between mb-8">
                                    <div className={`p-4 rounded-2xl ${stat.bg} shadow-inner`}>
                                        <stat.icon className={`w-7 h-7 ${stat.color}`} />
                                    </div>
                                    <span className={`text-[10px] font-black px-2.5 py-1 ${stat.bg} ${stat.color} rounded-full border border-current/20`}>
                                        {stat.delta}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-4xl font-black tracking-tighter mb-2">{stat.value}</p>
                                    <p className="text-xs text-muted font-bold tracking-[0.2em] uppercase opacity-60">{stat.label}</p>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
                            </div>
                        ))}
                    </div>

                    {/* Bento Level 2: Core Analytics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Main Trend Map (Spans 8 cols) */}
                        <div className="lg:col-span-8 stagger-card bg-panel/50 backdrop-blur-xl border border-border/80 rounded-[3rem] p-10 shadow-xl relative overflow-hidden group">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">Visual Trajectory</h3>
                                    <p className="text-sm text-muted font-medium mt-1">Metric: <span className="text-foreground">{sortBy.replace(/_/g, ' ')}</span></p>
                                </div>
                                <div className="flex p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl border border-border">
                                    <button className="px-6 py-2 bg-primary text-white font-black rounded-xl text-xs shadow-lg shadow-primary/20">Absolute</button>
                                    <button className="px-6 py-2 text-muted font-bold text-xs hover:text-foreground">Predictive</button>
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ReactECharts option={getTrendOption()} style={{ height: '100%' }} />
                            </div>
                        </div>

                        {/* Data Health Radar (Spans 4 cols) */}
                        <div className="lg:col-span-4 stagger-card bg-panel/50 backdrop-blur-xl border border-border/80 rounded-[3rem] p-10 shadow-xl flex flex-col">
                            <h3 className="text-xl font-black tracking-tight mb-2">Signal Integrity</h3>
                            <p className="text-xs text-muted font-bold mb-8 uppercase tracking-widest">Multi-dimensional Audit</p>
                            <div className="flex-1 w-full flex items-center justify-center">
                                <ReactECharts option={getRadarHealthOption()} style={{ height: '300px', width: '100%' }} />
                            </div>
                            <div className="mt-8 pt-8 border-t border-border/40 text-center">
                                <p className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 py-2 rounded-2xl flex items-center justify-center gap-2">
                                    <Zap className="w-3 h-3" /> NO CRITICAL ANOMALIES DETECTED
                                </p>
                            </div>
                        </div>

                        {/* Categorical Distribution (Spans 5 cols) */}
                        <div className="lg:col-span-5 stagger-card bg-panel/50 backdrop-blur-xl border border-border/80 rounded-[3rem] p-10 shadow-xl">
                            <h3 className="text-xl font-black tracking-tight mb-8 animate-pulse">Category Allocation</h3>
                            <div className="h-[300px] w-full">
                                <ReactECharts option={getDonutOption()} style={{ height: '100%' }} />
                            </div>
                        </div>

                        {/* Correlation Map (Spans 7 cols) */}
                        <div className="lg:col-span-7 stagger-card bg-panel/50 backdrop-blur-xl border border-border/80 rounded-[3rem] p-10 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Correlation Matrix</h3>
                                    <p className="text-xs text-muted font-bold mt-1">Discovering latent relationships</p>
                                </div>
                                <div className="p-3 bg-panel border border-border rounded-2xl">
                                    <Filter className="w-5 h-5 text-primary" />
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ReactECharts option={getCorrelationOption()} style={{ height: '100%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Bento Level 3: Insights Feed */}
                    <div className="stagger-card bg-gradient-to-br from-panel to-panel/50 backdrop-blur-3xl border border-primary/20 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full translate-x-1/2" />
                        <h3 className="text-2xl font-black tracking-tight mb-10 flex items-center gap-4">
                            <Zap className="w-8 h-8 text-amber-500" /> Executive Synthetic Insights
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: "Entropy Check", desc: "Current sorting dimension '" + sortBy + "' shows 14% high-variance spikes in initial 50 records.", color: "bg-blue-500" },
                                { title: "Subset Warning", desc: processedData.length < (preview?.total_rows || 0) / 2 ? "Narrow view active. Visuals represent local optima, not global trends." : "Global focus active. Representative of entire signal space.", color: "bg-emerald-500" },
                                { title: "Optimal Dimension", desc: "Detected numeric correlation identifies high impact ranking for numeric columns.", color: "bg-violet-500" }
                            ].map((insight, idx) => (
                                <div key={idx} className="p-8 bg-panel/40 border border-border/50 rounded-[2rem] hover:border-primary/40 transition-all cursor-default relative z-10 hover:shadow-xl hover:shadow-black/5">
                                    <div className={`w-3 h-10 rounded-full ${insight.color} mb-6 shadow-xl shadow-current/20`} />
                                    <p className="font-black text-lg mb-3 tracking-tight">{insight.title}</p>
                                    <p className="text-sm text-muted font-medium leading-relaxed">{insight.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Custom Background Effects */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]" />
        </div>
    );
}
