import React, { useRef } from 'react';
import {
    AlignJustify, Network, HeartPulse, Filter, Plus, CheckSquare, Square, FileJson, Maximize2, X, Download, Copy
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function DataExplorerPage() {
    const containerRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        gsap.fromTo('.stagger-card',
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' }
        );
    }, { scope: containerRef });

    // Dummy data for the table
    const tableData = [
        { id: 'usr_98412', email: 'alex.chen@enterprise.com', created: '2023-11-24 10:42', region: 'NORTH AMERICA', mrr: '$1,250.00', meta: '{"plan": "pro"...' },
        { id: 'usr_98413', email: 'sara.smith@cloudtech.io', created: '2023-11-24 11:15', region: 'EUROPE', mrr: '$840.00', meta: '{"plan": "basi...' },
        { id: 'usr_98414', email: 'mike.j@globex.com', created: '2023-11-24 12:01', region: 'NORTH AMERICA', mrr: '$2,100.00', meta: '{"plan": "ente...' },
        { id: 'usr_98415', email: 'jiro.tan@tokyo.net', created: '2023-11-25 09:30', region: 'ASIA PACIFIC', mrr: '$450.00', meta: '{"plan": "star...' },
    ];

    // Dummy charts configurations
    const mrrHistogramOption = {
        grid: { left: 0, right: 0, top: 10, bottom: 0 },
        xAxis: { type: 'category', show: false, data: ['1', '2', '3', '4', '5', '6', '7'] },
        yAxis: { type: 'value', show: false },
        series: [{
            data: [30, 80, 150, 100, 40, 20, 10],
            type: 'bar',
            itemStyle: { color: '#60a5fa', borderRadius: [4, 4, 0, 0] },
            emphasis: { itemStyle: { color: '#3b82f6' } }
        }]
    };

    return (
        <div className="max-w-[1600px] mx-auto py-6 px-8 overflow-y-auto h-full" ref={containerRef}>
            {/* Header / Breadcrumb Area */}
            <div className="flex items-center justify-between mb-6 stagger-card">
                <div className="flex items-center text-sm">
                    <span className="text-muted flex items-center">
                        <span className="bg-gray-200 dark:bg-gray-800 p-1 rounded mr-2">📁</span> Projects
                    </span>
                    <span className="mx-2 text-border">/</span>
                    <span className="font-medium text-foreground">customer_export_october.csv</span>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium rounded-md border border-green-100 dark:border-green-800">
                        <CheckSquare className="w-4 h-4 mr-2" /> Autosaved
                    </div>
                    <button className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-md text-sm font-medium flex items-center shadow-sm transition-colors">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-300 shadow-sm border border-white dark:border-gray-800"></div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-panel rounded-xl border border-border p-5 flex items-center shadow-sm stagger-card">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-4 text-primary">
                        <AlignJustify className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">Total Rows</p>
                        <p className="text-2xl font-bold text-foreground">1,284,092</p>
                    </div>
                </div>
                <div className="bg-panel rounded-xl border border-border p-5 flex items-center shadow-sm stagger-card">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-4 text-purple-500">
                        <Network className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">Schema Detected</p>
                        <p className="text-2xl font-bold text-foreground">Mixed SQL/JSON</p>
                    </div>
                </div>
                <div className="bg-panel rounded-xl border border-border p-5 flex items-center shadow-sm stagger-card">
                    <div className="w-12 h-12 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-4 text-green-500">
                        <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-1">Data Health</p>
                        <div className="flex items-baseline">
                            <p className="text-2xl font-bold text-foreground">98.4%</p>
                            <span className="ml-2 text-sm font-medium text-green-500">Excellent</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center space-x-3 mb-6 stagger-card">
                <button className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Filter className="w-4 h-4 mr-2 text-muted" /> Filters
                </button>
                <div className="flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-full text-sm text-primary font-medium">
                    region: North America <button className="ml-2 text-primary hover:text-blue-700"><X className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-panel border border-border rounded-full text-sm text-foreground font-medium shadow-sm">
                    revenue: {'>'} $10,000 <button className="ml-2 text-muted hover:text-foreground"><X className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center px-3 py-1.5 bg-panel border border-border rounded-full text-sm text-foreground font-medium shadow-sm">
                    status: Active <button className="ml-2 text-muted hover:text-foreground"><X className="w-3 h-3" /></button>
                </div>
                <button className="flex items-center px-3 py-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                    <Plus className="w-4 h-4 mr-1" /> Add Filter
                </button>
            </div>

            {/* Main Grid: Data Table + JSON Inspector */}
            <div className="flex flex-col lg:flex-row gap-6 mb-6">

                {/* Data Table Container */}
                <div className="flex-1 bg-panel border border-border rounded-xl shadow-sm overflow-hidden stagger-card flex flex-col">
                    <div className="overflow-x-auto flex-1">
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12"><Square className="w-4 h-4 text-muted" /></th>
                                    <th className="px-4 py-3 text-left font-bold text-foreground">user_id <Filter className="w-3 h-3 inline ml-1 text-muted" /></th>
                                    <th className="px-4 py-3 text-left font-bold text-foreground">email_address <Filter className="w-3 h-3 inline ml-1 text-muted" /></th>
                                    <th className="px-4 py-3 text-left font-bold text-foreground">created_at <Filter className="w-3 h-3 inline ml-1 text-muted" /></th>
                                    <th className="px-4 py-3 text-left font-bold text-foreground">region <Filter className="w-3 h-3 inline ml-1 text-muted" /></th>
                                    <th className="px-4 py-3 text-right font-bold text-foreground"><Filter className="w-3 h-3 inline mr-1 text-muted" /> mrr_val</th>
                                    <th className="px-4 py-3 text-left font-bold text-foreground">metadata_json <Filter className="w-3 h-3 inline ml-1 text-muted" /></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {tableData.map((row, idx) => (
                                    <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${idx === 0 ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                        <td className="px-4 py-3 whitespace-nowrap">{idx === 0 ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted" />}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted font-mono">{row.id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-foreground font-medium">{row.email}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted font-mono">{row.created}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${row.region === 'NORTH AMERICA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                                row.region === 'EUROPE' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
                                                    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                                }`}>
                                                {row.region}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-foreground font-mono">{row.mrr}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-muted font-mono text-xs">{row.meta}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Sidebar: Data Inspector */}
                <div className="w-full lg:w-96 flex flex-col gap-4 stagger-card">
                    {/* JSON Inspector Header */}
                    <div className="bg-panel border border-border rounded-xl shadow-sm p-4">
                        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                            <h3 className="font-bold text-foreground">Data Inspector</h3>
                            <button className="text-muted hover:text-foreground"><FileJson className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center border-b border-border mb-4">
                            <button className="px-4 py-2 border-b-2 border-primary text-primary font-bold text-sm">JSON Record</button>
                            <button className="px-4 py-2 text-muted font-medium text-sm hover:text-foreground transition-colors">Source Info</button>
                        </div>

                        {/* JSON Code Block */}
                        <div className="bg-[#111827] rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-inner">
                            <pre className="text-gray-300 leading-relaxed">
                                {`{
  "`}<span className="text-blue-400">id</span>{`": "`}<span className="text-yellow-300">usr_98412</span>{`",
  "`}<span className="text-blue-400">profile</span>{`": {
    "`}<span className="text-blue-400">name</span>{`": "`}<span className="text-yellow-300">Alex Chen</span>{`",
    "`}<span className="text-blue-400">email</span>{`": "`}<span className="text-yellow-300">alex.c@ent.com</span>{`",
    "`}<span className="text-blue-400">tier</span>{`": "`}<span className="text-yellow-300">platinum</span>{`"
  },
  "`}<span className="text-blue-400">history</span>{`": [
    {"`}<span className="text-blue-400">ev</span>{`": "`}<span className="text-green-400">login</span>{`", "`}<span className="text-blue-400">ts</span>{`": "`}<span className="text-yellow-300">24-11</span>{`"},
    {"`}<span className="text-blue-400">ev</span>{`": "`}<span className="text-green-400">upgr</span>{`", "`}<span className="text-blue-400">ts</span>{`": "`}<span className="text-yellow-300">20-11</span>{`"}
  ],
  "`}<span className="text-blue-400">mrr</span>{`": `}<span className="text-orange-400">1250.00</span>{`,
  "`}<span className="text-blue-400">tags</span>{`": ["`}<span className="text-yellow-300">beta</span>{`", "`}<span className="text-yellow-300">priority</span>{`"]
}`}
                            </pre>
                        </div>
                    </div>

                    {/* SQL Origin Card */}
                    <div className="bg-panel border border-border rounded-xl shadow-sm p-4">
                        <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-2">Source Table</p>
                        <p className="text-sm font-medium text-foreground mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-border">customer_activity_logs</p>

                        <p className="text-xs font-semibold text-muted tracking-wider uppercase mb-2 mt-4">SQL Origin</p>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded border border-border font-mono text-xs text-muted mb-4">
                            SELECT * FROM users JOIN activity<br />
                            ON users.id = activity.uid WHERE<br />
                            activity.region = 'NA'
                        </div>

                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <p className="text-xs font-semibold text-muted tracking-wider uppercase">Data Health Score</p>
                            <span className="font-bold text-green-500">94</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full mt-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                    </div>

                    {/* Copy Button */}
                    <button className="w-full bg-panel border border-border hover:bg-gray-50 dark:hover:bg-gray-800 text-foreground py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center shadow-sm">
                        <Copy className="w-4 h-4 mr-2" /> Copy Row as JSON
                    </button>
                </div>
            </div>

            {/* Bottom Section: Distribution Analytics */}
            <div className="bg-panel border border-border rounded-xl shadow-sm p-5 stagger-card">
                <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                    <div className="flex items-center">
                        <AlignJustify className="w-4 h-4 text-muted mr-2" />
                        <h3 className="font-bold text-xs text-muted tracking-wider uppercase">Distribution Analytics</h3>
                    </div>
                    <div className="flex items-center space-x-3 text-muted">
                        <button className="hover:text-foreground"><Maximize2 className="w-4 h-4" /></button>
                        <button className="hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Histogram 1 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">MRR Histogram</span>
                            <span className="text-xs text-muted">n=1,284k</span>
                        </div>
                        <div className="h-24 w-full">
                            <ReactECharts option={mrrHistogramOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>

                    {/* Box Plot placeholder */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">User Tenure (Days)</span>
                        </div>
                        <div className="h-24 w-full flex items-center justify-center border-b border-border relative">
                            <div className="absolute w-full h-[1px] bg-border top-1/2"></div>
                            <div className="w-24 h-8 bg-gray-50 dark:bg-gray-800 border border-border flex items-center z-10">
                                <div className="w-1/2 h-full border-r border-border"></div>
                            </div>
                        </div>
                    </div>

                    {/* Progress bars */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">Region Distribution</span>
                        </div>
                        <div className="space-y-3 mt-4">
                            <div>
                                <div className="flex justify-between text-xs text-muted mb-1">
                                    <span>NA</span><span>48%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '48%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-muted mb-1">
                                    <span>EU</span><span>32%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full">
                                    <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '32%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sparkline / Density */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-foreground">Data Density</span>
                        </div>
                        <div className="flex gap-1 mt-6">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded"
                                    style={{
                                        height: '12px',
                                        backgroundColor: `rgba(34, 197, 94, ${Math.random() * 0.8 + 0.2})`
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Connect Status */}
            <div className="mt-4 flex items-center justify-between text-[10px] text-muted font-mono uppercase tracking-wider px-2">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Engine Connected</span>
                    <span>CSV: production_backup_2023.csv</span>
                    <span>JSON Depth: 4</span>
                </div>
                <div className="flex items-center space-x-4">
                    <span>QUERY: 2.4MS</span>
                    <span>RENDER: 14MS</span>
                </div>
            </div>
        </div>
    );
}
