import React from 'react';

interface AnswerTextProps {
    answer: string;
}

export const AnswerText: React.FC<AnswerTextProps> = ({ answer }) => {
    if (!answer) return null;

    return (
        <div className="prose prose-slate max-w-none text-slate-700 font-medium leading-relaxed text-[15px] bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data-Backed Answer</span>
            </div>
            <p className="whitespace-pre-wrap">{answer}</p>
        </div>
    );
};
