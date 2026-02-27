import React, { useCallback, useState } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { apiClient } from '../../api/client';

export const UploadPanel: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setSession = useSessionStore(state => state.setSession);

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
        <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50/50">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">DataTalk AI</h1>
                <p className="text-lg text-slate-500">Intelligent dataset analytics in plain English</p>
            </div>

            <div
                className={`w-full max-w-2xl p-16 text-center border-4 border-dashed rounded-3xl transition-all duration-300 ${isDragging ? 'border-blue-500 bg-blue-50/80 scale-105 shadow-xl' : 'border-slate-300 bg-white shadow-md hover:border-slate-400 hover:shadow-lg'}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className="text-6xl mb-6">📊</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">Upload your Dataset</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">Drag and drop your CSV file here to begin structural profiling and AI-assisted data dictionary generation.</p>

                {error && <div className="text-red-500 mb-6 font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}

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
                    className={`px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg cursor-pointer transition-all ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
                >
                    {isUploading ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Uploading & Profiling Schema...
                        </span>
                    ) : 'Browse CSV Files'}
                </label>
            </div>
        </div>
    );
};
