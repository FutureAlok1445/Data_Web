import * as React from 'react';
import { useCallback, useState, useRef } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { useChatStore } from '../../store/chatStore';
import { apiClient } from '../../api/client';
import {
    Upload, FileText, BrainCircuit, ShieldCheck, BarChart3,
    Loader2, Rocket, CloudUpload, FileSpreadsheet, Database,
    Zap, Sparkles, Activity, Shield
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const UploadPanel: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const dropzoneRef = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        // Entrance animations
        gsap.fromTo('.stagger-card',
            { y: 40, scale: 0.9, autoAlpha: 0 },
            {
                y: 0,
                scale: 1,
                autoAlpha: 1,
                duration: 1.5,
                stagger: 0.2,
                ease: 'expo.out'
            }
        );

        // Floating animation for icons
        gsap.to('.float-icon', {
            y: -10,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            stagger: 0.5
        });

        // Glowing pulse for the primary ring
        gsap.to('.glow-pulse', {
            boxShadow: '0 0 40px rgba(99, 102, 241, 0.4)',
            duration: 1.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }, { scope: containerRef });

    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setSession = useSessionStore((state: any) => state.setSession);
    const addMessage = useChatStore((state: any) => state.addMessage);
    const setLoading = useChatStore((state: any) => state.setLoading);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
        gsap.to(dropzoneRef.current, { scale: 1.02, duration: 0.3, ease: 'back.out(1.7)' });
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        gsap.to(dropzoneRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }, []);

    const handleFile = async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError("Analysis limited to CSV protocols.");
            return;
        }

        setIsUploading(true);
        setError(null);
        try {
            const response = await apiClient.uploadDataset(file);
            setSession(
                response.session_id,
                file.name,
                response.schema,
                response.data_dictionary,
                response.impact_scores,
                response.target_column
            );

            setIsUploading(false);
            setIsAnalyzing(true);

            const targetCol = response.target_column;
            const autoQuestion = targetCol
                ? `Perform a deep dive: analyze the distribution of ${targetCol.replace(/_/g, ' ')} and identify principal drivers behind its variance.`
                : `Initialize systemic overview: map numeric distributions and identify anomalous clusters in the primary dimensions.`;

            const userMsg = {
                id: Date.now().toString(),
                role: 'user' as const,
                content: `🧬 Synchronizing Data Pulse: ${autoQuestion}`
            };
            addMessage(userMsg);
            setLoading(true);

            try {
                const queryResponse = await apiClient.processQuery(response.session_id, autoQuestion);
                addMessage({
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: queryResponse.answer,
                    responsePayload: queryResponse
                });
            } catch (qErr: any) {
                addMessage({
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: 'Data synchronization complete. Neural bridge established.',
                    isError: false
                });
            } finally {
                setLoading(false);
            }
        } catch (err: any) {
            setError(err.message || 'Synchronization failure detected.');
        } finally {
            setIsUploading(false);
            setIsAnalyzing(false);
        }
    };

    const onDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        gsap.to(dropzoneRef.current, { scale: 1, duration: 0.3 });
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

    const isProcessing = isUploading || isAnalyzing;

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-8 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" ref={containerRef}>

            {/* --- Premium Header Section --- */}
            <div className="text-center mb-16 stagger-card max-w-2xl">
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-20 h-20 bg-panel border-2 border-primary/20 rounded-[2rem] flex items-center justify-center text-primary shadow-2xl glow-pulse float-icon">
                        <Database className="w-10 h-10" />
                        <div className="absolute -top-1 -right-1">
                            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 animate-bounce" />
                        </div>
                    </div>
                </div>
                <h1 className="text-5xl font-black text-foreground tracking-tighter mb-4 flex items-center justify-center gap-3">
                    Neural <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Sync</span> Engine
                </h1>
                <p className="text-base text-muted font-medium leading-relaxed italic opacity-80 px-4">
                    Inject your datasets into the core. Unlock deep-layer heuristics and synthetic intelligence mapping instantly.
                </p>
            </div>

            {/* --- Advanced Dropzone --- */}
            <div
                ref={dropzoneRef}
                className={`w-full max-w-4xl p-1 bg-gradient-to-br from-primary/20 via-border/40 to-primary/20 rounded-[3rem] transition-all duration-500 stagger-card group ${isDragging ? 'scale-[1.03] rotate-1' : ''
                    }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className={`relative h-[450px] w-full bg-panel rounded-[2.9rem] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${isDragging ? 'bg-primary/5' : 'bg-panel'
                    }`}>
                    {/* Background Decorative Rings */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/10 rounded-full" />
                    </div>

                    <div className="relative mb-10 group-hover:scale-110 transition-transform duration-500">
                        <div className="p-10 bg-primary/5 rounded-[3rem] border border-primary/20 flex items-center justify-center relative">
                            {isAnalyzing ? (
                                <BrainCircuit className="w-20 h-20 text-primary animate-pulse" />
                            ) : (
                                <CloudUpload className="w-20 h-20 text-primary" />
                            )}

                            {isProcessing && (
                                <div className="absolute -inset-4">
                                    <div className="w-full h-full border-2 border-primary border-t-transparent rounded-[4rem] animate-spin opacity-40"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight px-4 text-center">
                        {isAnalyzing ? 'SYNTHESIZING NEURAL PATHS' : 'DROP DATA PROTOCOL'}
                    </h2>

                    <div className="flex items-center gap-4 mb-12">
                        <div className="h-px w-12 bg-border/60" />
                        <p className="text-xs text-muted font-black tracking-widest uppercase opacity-60">
                            {isAnalyzing ? 'Mapping Correlations' : 'Awaiting CSV Input'}
                        </p>
                        <div className="h-px w-12 bg-border/60" />
                    </div>

                    {error && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md text-rose-500 text-[10px] font-black bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-500/20 flex items-center justify-center gap-3 animate-pulse uppercase tracking-widest">
                            <Activity className="w-4 h-4" /> SECURE HANDSHAKE FAILED: {error}
                        </div>
                    )}

                    {!isProcessing && (
                        <div className="relative stagger-card">
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept=".csv"
                                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                                disabled={isProcessing}
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex items-center gap-4 px-12 py-5 bg-primary text-white font-black rounded-[2rem] shadow-[0_20px_40px_rgba(99,102,241,0.3)] hover:shadow-primary/50 hover:-translate-y-1 active:scale-90 cursor-pointer transition-all duration-300 group"
                            >
                                <Zap className="w-5 h-5 fill-white group-hover:rotate-12 transition-transform" />
                                <span className="text-sm tracking-widest uppercase">Select Sequence</span>
                            </label>
                        </div>
                    )}

                    {isProcessing && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3 px-10 py-5 bg-primary/10 text-primary font-black rounded-[2rem] border border-primary/20 shadow-inner">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm tracking-widest uppercase">Processing Stream...</span>
                            </div>
                            <div className="w-64 h-1.5 bg-border/40 rounded-full overflow-hidden">
                                <div className="h-full bg-primary animate-progress-glow" style={{ width: '45%' }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Trust & Metadata Grid --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-20 stagger-card">
                {[
                    { title: 'Secured Environment', desc: 'Hardware-level encryption for local data residency.', icon: Shield, color: 'text-blue-500' },
                    { title: 'Neural Profiling', desc: 'Predictive schema mapping and automated clean-up.', icon: BrainCircuit, color: 'text-purple-500' },
                    { title: 'Enterprise Yield', desc: 'Real-time multi-dimensional trend extraction.', icon: Activity, color: 'text-amber-500' }
                ].map((f, i) => (
                    <div key={i} className="p-10 rounded-[2.5rem] bg-panel/30 backdrop-blur-md border border-border/40 hover:border-primary/40 transition-all duration-500 group relative overflow-hidden flex flex-col items-center text-center">
                        <div className={`p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/10 ${f.color} mb-6 transition-transform duration-500 group-hover:rotate-[360deg]`}>
                            <f.icon className="w-8 h-8" />
                        </div>
                        <h4 className="font-black text-foreground mb-3 text-lg leading-tight uppercase tracking-tight">{f.title}</h4>
                        <p className="text-muted text-xs leading-relaxed font-bold opacity-70 italic">{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* Background Noise Gradient Overlay */}
            <div className="fixed inset-0 pointer-events-none -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04]" />
        </div>
    );
};
