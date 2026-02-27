import React from 'react';

interface SuggestedChipsProps {
    suggestions?: string[];
    onSelect?: (query: string) => void;
}

const DEFAULT_SUGGESTIONS = [
    "What is the churn rate by gender?",
    "Show average monthly charges by contract type",
    "Which internet service has the highest churn?",
    "What is the distribution of tenure?",
    "Compare charges of churned vs non-churned customers"
];

export const SuggestedChips: React.FC<SuggestedChipsProps> = ({ suggestions = DEFAULT_SUGGESTIONS, onSelect }) => {
    return (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
            {suggestions.map((s, i) => (
                <button
                    key={i}
                    onClick={() => onSelect?.(s)}
                    className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-full text-xs font-semibold hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow"
                >
                    {s}
                </button>
            ))}
        </div>
    );
};
