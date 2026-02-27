import React from 'react';
import { Filter, SortAsc, SortDesc, Calendar, Tag, BarChart3, Settings2, X, Plus, Trash2, Search, Zap } from 'lucide-react';

interface SidebarProps {
    schema: Record<string, any>;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    filters: Record<string, string>;
    onSortChange: (col: string, order: 'asc' | 'desc') => void;
    onFilterChange: (col: string, value: string) => void;
    onReset: () => void;
    datasetName: string;
}

export const DashboardFilterSidebar: React.FC<SidebarProps> = ({
    schema, sortBy, sortOrder, filters, onSortChange, onFilterChange, onReset, datasetName
}) => {
    const schemaKeys = Object.keys(schema || {});

    return (
        <div className="w-80 bg-panel/80 backdrop-blur-3xl border-r border-border/40 h-full flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.1)] z-20 overflow-hidden group">
            {/* Sidebar Header with Glowing Accent */}
            <div className="p-8 border-b border-border/40 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/20 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                            <Settings2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground tracking-tighter">Command Control</h2>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80 mt-0.5">Global Overrides</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 px-4 py-2 bg-panel/40 border border-border/60 rounded-xl">
                    <p className="text-[10px] text-muted font-bold truncate">ACTIVE STREAM: <span className="text-primary">{datasetName}</span></p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-none custom-scrollbar pb-32">
                {/* Sorting Architecture */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <SortAsc className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Primary Pivot</h3>
                        </div>
                        <div className="h-px flex-1 bg-border/40 ml-4" />
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value, sortOrder)}
                                className="w-full bg-panel/50 border border-border/80 rounded-2xl px-4 py-3.5 text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none cursor-pointer hover:border-primary/50"
                            >
                                {schemaKeys.map(k => (
                                    <option key={k} value={k} className="bg-panel py-2">{k.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <BarChart3 className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => onSortChange(sortBy, 'asc')}
                                className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 transition-all duration-300 border ${sortOrder === 'asc' ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-panel/40 border-border/60 text-muted hover:border-primary/50'}`}
                            >
                                <SortAsc className="w-3.5 h-3.5" /> ASCENDING
                            </button>
                            <button
                                onClick={() => onSortChange(sortBy, 'desc')}
                                className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 transition-all duration-300 border ${sortOrder === 'desc' ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-panel/40 border-border/60 text-muted hover:border-primary/50'}`}
                            >
                                <SortDesc className="w-3.5 h-3.5" /> DESCENDING
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Matrix */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Filter className="w-4 h-4 text-primary" />
                            <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Signal Matrix</h3>
                        </div>
                        <div className="h-px flex-1 bg-border/40 ml-4" />
                    </div>

                    <div className="space-y-5">
                        {/* Global Search Interface */}
                        <div className="group/search relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within/search:text-primary transition-colors">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Global heuristic search..."
                                value={filters.query || ''}
                                onChange={(e) => onFilterChange('query', e.target.value)}
                                className="w-full bg-panel border border-border/80 rounded-2xl pl-12 pr-10 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-primary/10 hover:border-primary/30 transition-all placeholder:opacity-50"
                            />
                            {filters.query && (
                                <button
                                    onClick={() => onFilterChange('query', '')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-white hover:bg-red-500 rounded-lg transition-all"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Semantic Column Filter */}
                        <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem] space-y-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <Tag className="w-12 h-12 -rotate-12" />
                            </div>

                            <p className="text-[10px] font-black text-primary uppercase tracking-widest relative z-10">Semantic Focus</p>

                            <div className="space-y-3 relative z-10">
                                <select
                                    className="w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none hover:border-primary/50 transition-colors cursor-pointer"
                                    onChange={(e) => onFilterChange('filterCol', e.target.value)}
                                    value={filters.filterCol || ''}
                                >
                                    <option value="" className="opacity-50">All Dimensions</option>
                                    {schemaKeys.map(k => <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>)}
                                </select>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Target value..."
                                        value={filters.filterVal || ''}
                                        onChange={(e) => onFilterChange('filterVal', e.target.value)}
                                        className="w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
                                        <Zap className="w-3 h-3 text-primary animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Advice */}
                <div className="p-6 bg-panel/30 border border-border/40 rounded-3xl relative overflow-hidden group/tip">
                    <div className="absolute -left-2 top-0 h-full w-1 bg-amber-500/50" />
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wider">Tactical System</p>
                    </div>
                    <p className="text-[10px] text-muted font-medium leading-relaxed group-hover:text-foreground transition-colors duration-500">
                        Primary pivots automatically re-aggregate all distribution maps in real-time. Heuristic search impacts the cross-filtering yield.
                    </p>
                </div>
            </div>

            {/* Sidebar Action Zone */}
            <div className="p-8 border-t border-border/40 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-800/20 backdrop-blur-2xl">
                <button
                    onClick={onReset}
                    className="w-full py-4 bg-panel border-2 border-border/60 hover:border-red-500/50 hover:bg-red-500/5 hover:text-red-500 text-foreground font-black rounded-2xl shadow-sm transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 group/reset"
                >
                    <Trash2 className="w-4 h-4 transition-transform group-hover/reset:rotate-12" />
                    PURGE OVERRIDES
                </button>
            </div>
        </div>
    );
};
