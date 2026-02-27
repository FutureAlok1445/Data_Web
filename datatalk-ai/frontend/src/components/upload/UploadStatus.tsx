import React from 'react';

interface UploadStatusProps {
    isUploading: boolean;
    error?: string | null;
    datasetName?: string;
}

export const UploadStatus: React.FC<UploadStatusProps> = ({ isUploading, error, datasetName }) => {
    if (isUploading) {
        return (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-pulse">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm font-bold text-blue-700">Uploading & profiling schema...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                <span className="font-bold">Upload Error:</span> {error}
            </div>
        );
    }

    if (datasetName) {
        return (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-emerald-500">✓</span>
                <span className="text-sm font-bold text-emerald-700">{datasetName} loaded successfully</span>
            </div>
        );
    }

    return null;
};
