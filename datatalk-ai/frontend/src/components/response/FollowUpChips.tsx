import React from 'react';

interface FollowUpChipsProps {
    suggestions: string[];
    onSelect: (query: string) => void;
}

export const FollowUpChips: React.FC<FollowUpChipsProps> = ({ suggestions, onSelect }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest self-center mr-1">Explore further:</span>
            {suggestions.map((suggestion, idx) => (
                <button
                    key={idx}
                    onClick={() => onSelect(suggestion)}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
};
