import { useCallback, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { apiClient } from '../api/client';

export function useUpload() {
    const setSession = useSessionStore(state => state.setSession);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = useCallback(async (file: File) => {
        if (!file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
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
    }, [setSession]);

    return { uploadFile, isUploading, error };
}
