import React from 'react';
import { Search, ArrowRight } from 'lucide-react';

interface ExpansionChipsProps {
    queries: string[];
    onSelect: (query: string) => void;
}

export const ExpansionChips: React.FC<ExpansionChipsProps> = ({ queries, onSelect }) => {
    if (!queries || queries.length === 0) return null;

    return (
        <div className="mt-6 space-y-4 p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] animate-in fade-in slide-in-from-left-4">
            <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Exploratory Expansion</span>
            </div>
            <p className="text-sm font-bold text-slate-700 italic">"This question is broad. Which specific analytical angle would you like to explore?"</p>
            <div className="flex flex-wrap gap-2">
                {queries.map((q, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(q)}
                        className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-[13px] font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm hover:shadow-md"
                    >
                        {q}
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </button>
                ))}
            </div>
        </div>
    );
};
