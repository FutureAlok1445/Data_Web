import * as React from 'react';
import { useCallback, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { apiClient } from '../../api/client';

export const UploadPanel: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setSession = useSessionStore((state: any) => state.setSession);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError("Please upload a valid CSV file.");
            return;
        }

        setIsUploading(true);
        setError(null);
        try {
            const response = await apiClient.uploadDataset(file);
            setSession(response.session_id, file.name, response.schema, response.data_dictionary);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 bg-gradient-to-b from-white to-slate-50 overflow-y-auto custom-scrollbar">
            {/* ── Brand Hero ── */}
            <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl mx-auto mb-6 flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-8 ring-blue-50">D</div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">
                    DataTalk <span className="text-blue-600">AI</span>
                </h1>
                <p className="text-xl text-slate-600 max-w-lg mx-auto leading-relaxed">
                    Transform complex structured data into <span className="text-blue-600 font-bold underline decoration-blue-200 underline-offset-4">grounded insights</span> using natural language.
                </p>
            </div>

            {/* ── Dropzone ── */}
            <div
                className={`w-full max-w-3xl p-1 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 rounded-[2.5rem] transition-all duration-500 animate-in fade-in zoom-in-95 delay-150 ${isDragging ? 'scale-[1.02] shadow-2xl rotate-1' : 'shadow-xl'
                    }`}
            >
                <div
                    className={`w-full h-full p-12 lg:p-20 text-center border-2 border-dashed rounded-[2.3rem] transition-all duration-300 ${isDragging
                            ? 'border-blue-500 bg-blue-50/90'
                            : 'border-slate-300 bg-white hover:border-blue-400'
                        }`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                >
                    <div className="relative inline-block mb-8">
                        <div className="text-7xl group-hover:scale-110 transition-transform duration-500">📥</div>
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    <h2 className="text-3xl font-black text-slate-800 mb-4">Start your Analysis</h2>
                    <p className="text-slate-500 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                        Drop any CSV dataset here. Our AI will automatically profile the schema and discover key entity relationships.
                    </p>

                    {error && (
                        <div className="text-rose-600 mb-8 font-bold bg-rose-50 px-6 py-3 rounded-2xl border border-rose-200 animate-in shake duration-500 flex items-center justify-center gap-2">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}

                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                        disabled={isUploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 hover:shadow-blue-200 active:scale-95 cursor-pointer transition-all duration-300 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {isUploading ? 'PROFILING DATASET...' : 'BROWSE FILES'}
                        {!isUploading && <span className="text-xl">🚀</span>}
                    </label>

                    <div className="mt-8 flex items-center justify-center gap-6 grayscale opacity-50">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Supports</span>
                        <div className="px-3 py-1 border border-slate-300 rounded text-[10px] font-black tracking-widest text-slate-400">CSV</div>
                        <div className="px-3 py-1 border border-slate-300 rounded text-[10px] font-black tracking-widest text-slate-400">DUCKDB</div>
                    </div>
                </div>
            </div>

            {/* ── Feature Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                {[
                    { title: 'Explainable AI', desc: 'No hallucinations. Every answer is grounded in DuckDB-validated SQL proofs.', icon: '🛡️' },
                    { title: 'Smart Discovery', desc: 'Auto-detects correlations, anomalies, and statistical drivers in milliseconds.', icon: '🧠' },
                    { title: 'Interactive BI', desc: 'Enterprise-grade visualizations powered by Plotly with automated chart selection.', icon: '📊' }
                ].map((f, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 transition-colors shadow-sm group">
                        <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">{f.icon}</div>
                        <h4 className="font-extrabold text-slate-800 mb-2">{f.title}</h4>
                        <p className="text-slate-500 text-sm leading-relaxed font-medium">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
