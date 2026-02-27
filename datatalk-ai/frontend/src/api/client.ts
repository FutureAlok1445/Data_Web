const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = {
    async uploadDataset(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_URL}/upload/`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${errorText}`);
        }
        return response.json();
    },

    async getSession(sessionId: string) {
        const response = await fetch(`${API_URL}/session/${sessionId}`);
        if (!response.ok) throw new Error("Session not found");
        return response.json();
    },

    async processQuery(sessionId: string, query: string) {
        const response = await fetch(`${API_URL}/query/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId, query }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        return response.json();
    },

    exportUrls: {
        csv: (sessionId: string) => `${API_URL}/export/csv/${sessionId}`,
        json: (sessionId: string) => `${API_URL}/export/json/${sessionId}`,
        sql: (sessionId: string) => `${API_URL}/export/sql/${sessionId}`,
        pdf: (sessionId: string) => `${API_URL}/export/pdf/${sessionId}`,
    }
};
